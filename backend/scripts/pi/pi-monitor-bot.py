#!/usr/bin/env python3
"""Pi Monitor Bot — operator-wide read-only Telegram bot.

Sibling of ``bookswap-bot.py``, but scoped to the *operator* channel and
covering every tenant on the Pi (bs, sl, vgf, nimoh, npz, …) instead of
just BookSwap.

Two-channel split, recap:
- ``bookswap-bot.py``  — bot ``8717082972``, BookSwap channel only
- ``pi-monitor-bot.py``— operator bot from ``~/.monitor-env``, every
  tenant on the Pi.

Architecture mirrors bookswap-bot.py 1:1 (long-polling, systemd, inline-
keyboard /help, callback_query dispatch). The two files deliberately
duplicate a few primitives so each can be deployed independently. Any
change to the Telegram primitive layer (telegram_call / send_message /
answer_callback / dispatch / poll_loop) should be applied to BOTH files
to keep behaviour consistent. The handlers are tenant-specific and
diverge.

Runs as systemd unit ``pi-monitor-bot.service``. State lives at
``~/monitor-state/pi-monitor-bot/``.

Source of truth: backend/scripts/pi/pi-monitor-bot.py.
Deployed copy: ~/scripts/pi-monitor-bot.py on the Pi.
"""

from __future__ import annotations

import json
import logging
import os
import shutil
import signal
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from collections.abc import Callable
from pathlib import Path
from typing import Any

# ─── config ─────────────────────────────────────────────────────────────────

ENV_FILE = Path.home() / ".monitor-env"
STATE_DIR = Path.home() / "monitor-state" / "pi-monitor-bot"
OFFSET_FILE = STATE_DIR / "update-offset.txt"
SCRIPT_DIR = Path.home() / "scripts"

POLL_TIMEOUT_SEC = 25
HTTP_TIMEOUT_SEC = POLL_TIMEOUT_SEC + 10
HANDLER_TIMEOUT_SEC = 60
TELEGRAM_MAX_LEN = 3800

# Tenant prefix → display name. Used by /status and /containers to group
# results sensibly. New tenants on the Pi should be added here so they
# show up in the right group; anything not in this map falls into
# "Other" so the bot still surfaces it.
TENANTS: dict[str, str] = {
    "bs": "BookSwap",
    "sl": "SpeakLinka",
    "vgf": "Vineyard Group",
    "nimoh": "Nimoh ICT",
    "npz": "NPZ Review",
    "tast": "Nimoh Digital (Tast)",
    "companysite": "Company Site",
    "redis": "Shared infra",
}

# ─── logging ───────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("pi-monitor-bot")


# ─── env loading ────────────────────────────────────────────────────────────


def load_env() -> dict[str, str]:
    """Parse ~/.monitor-env into a dict.

    Same format the bash scripts source — KEY=VALUE per line, # comments
    ignored, no shell expansion. We don't `source` the file because we
    don't want to depend on bash from inside the systemd-run process.
    """
    if not ENV_FILE.exists():
        log.error("missing %s — bot cannot start", ENV_FILE)
        sys.exit(1)

    env: dict[str, str] = {}
    for raw in ENV_FILE.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, _, value = line.partition("=")
        # Strip surrounding quotes the way bash `source` does — the
        # operator env file uses `KEY="value"` style. .strip() alone
        # leaves the quote characters in the value, which then gets
        # baked into the Telegram URL and produces 404 Not Found.
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
            value = value[1:-1]
        env[key.strip()] = value

    required = ("TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID")
    missing = [k for k in required if not env.get(k)]
    if missing:
        log.error("missing required env keys: %s", ", ".join(missing))
        sys.exit(1)

    return env


# ─── telegram primitives ───────────────────────────────────────────────────


def telegram_call(
    token: str,
    method: str,
    params: dict[str, Any],
) -> tuple[bool, dict[str, Any]]:
    """POST to the Telegram bot API.

    Returns (ok, body). ``ok`` is True only when the HTTP request
    succeeded AND Telegram's own ``ok`` flag is True. The polling loop
    retries on its own cadence; we don't raise.
    """
    url = f"https://api.telegram.org/bot{token}/{method}"
    data = urllib.parse.urlencode(params).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")  # noqa: S310
    try:
        with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT_SEC) as resp:  # noqa: S310
            body = json.loads(resp.read().decode("utf-8"))
            return bool(body.get("ok")), body
    except urllib.error.HTTPError as exc:
        try:
            body = json.loads(exc.read().decode("utf-8"))
        except Exception:
            body = {"description": str(exc)}
        log.warning("telegram %s rejected: %s", method, body.get("description"))
        return False, body
    except Exception as exc:
        log.warning("telegram %s failed: %s", method, exc)
        return False, {}


def _help_keyboard() -> dict[str, Any]:
    """3-row x 2-col grid of inline buttons mapping to read-only commands."""
    rows: list[list[dict[str, str]]] = []
    pair: list[dict[str, str]] = []
    for label, cmd in HELP_BUTTONS:
        pair.append({"text": label, "callback_data": cmd})
        if len(pair) == 2:
            rows.append(pair)
            pair = []
    if pair:
        rows.append(pair)
    return {"inline_keyboard": rows}


def send_message(
    token: str,
    chat_id: str,
    text: str,
    reply_markup: dict[str, Any] | None = None,
) -> None:
    if len(text) > TELEGRAM_MAX_LEN:
        text = text[: TELEGRAM_MAX_LEN - 30] + "\n…\n_(message truncated)_"

    base_params: dict[str, Any] = {
        "chat_id": chat_id,
        "text": text,
        "disable_web_page_preview": "true",
    }
    if reply_markup is not None:
        base_params["reply_markup"] = json.dumps(reply_markup)

    ok, _ = telegram_call(
        token,
        "sendMessage",
        {**base_params, "parse_mode": "Markdown"},
    )
    if ok:
        return

    log.warning("falling back to plain-text send for chat=%s", chat_id)
    telegram_call(token, "sendMessage", base_params)


def answer_callback(token: str, callback_query_id: str, text: str = "") -> None:
    telegram_call(
        token,
        "answerCallbackQuery",
        {"callback_query_id": callback_query_id, "text": text},
    )


# ─── helpers ───────────────────────────────────────────────────────────────


def run(cmd: list[str], timeout: int = HANDLER_TIMEOUT_SEC) -> tuple[int, str]:
    """Run a subprocess capturing stdout/stderr, never raising.

    `cmd` is always a hardcoded list literal at the call sites — never
    user input — so the S603 untrusted-input warning doesn't apply.
    """
    try:
        proc = subprocess.run(  # noqa: S603
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )
        out = (proc.stdout or "") + (proc.stderr or "")
        return proc.returncode, out.strip()
    except subprocess.TimeoutExpired:
        return 124, f"command timed out after {timeout}s: {' '.join(cmd)}"
    except FileNotFoundError as exc:
        return 127, f"command not found: {exc.filename}"
    except Exception as exc:
        return 1, f"unexpected error: {exc}"


def _tenant_for(name: str) -> str:
    """Map a container name to a tenant display label."""
    # Container naming scheme on the Pi mostly uses underscore separator
    # (bs_web_prod, sl_celery_staging) but a couple use hyphens
    # (nimoh-ict-backend, npz-review-frontend, redis_shared). Try
    # underscore first, then hyphen.
    for sep in ("_", "-"):
        head = name.split(sep, 1)[0]
        if head in TENANTS:
            return TENANTS[head]
    return "Other"


def _classify_status(status: str) -> str:
    """Map a docker `Up X (healthy)` / `Exited` string to one of: ok / warn / down."""
    if status.startswith("Up") and "(healthy)" in status:
        return "ok"
    if status.startswith("Up") and "(unhealthy)" in status:
        return "warn"
    if status.startswith("Up"):
        # Up but no healthcheck — treat as ok-ish.
        return "ok"
    return "down"


# ─── command handlers ──────────────────────────────────────────────────────


def handle_status(_args: str, env: dict[str, str]) -> str:
    """All-tenant container summary, grouped by tenant prefix."""
    rc, out = run(
        [
            "docker",
            "ps",
            "-a",
            "--format",
            "{{.Names}}|{{.Status}}",
        ],
        timeout=15,
    )
    if rc != 0:
        return f"❌ docker ps failed:\n```\n{out[:400]}\n```"

    grouped: dict[str, list[tuple[str, str, str]]] = {}
    for line in out.splitlines():
        if "|" not in line:
            continue
        name, status = line.split("|", 1)
        tenant = _tenant_for(name)
        cls = _classify_status(status)
        grouped.setdefault(tenant, []).append((name, status, cls))

    if not grouped:
        return "_no containers found_"

    lines = ["*Pi-wide container status*\n"]

    # Sort: BookSwap-first feels right since most operator-time goes
    # there now; everything else alphabetic.
    def sort_key(t: str) -> tuple[int, str]:
        return (0, "") if t == "BookSwap" else (1, t)

    for tenant in sorted(grouped, key=sort_key):
        rows = grouped[tenant]
        ok_count = sum(1 for _, _, c in rows if c == "ok")
        warn_count = sum(1 for _, _, c in rows if c == "warn")
        down_count = sum(1 for _, _, c in rows if c == "down")
        header_emoji = "✅" if down_count == 0 and warn_count == 0 else ("🟡" if down_count == 0 else "🔴")
        lines.append(f"{header_emoji} *{tenant}* — {ok_count} ok / {warn_count} warn / {down_count} down")
        for name, status, cls in sorted(rows):
            badge = {"ok": "  ✓", "warn": "  ⚠️", "down": "  ✗"}[cls]
            lines.append(f"{badge} `{name}` — {status}")
        lines.append("")

    lines.append(f"_{time.strftime('%H:%M UTC', time.gmtime())} on `{os.uname().nodename}`_")
    return "\n".join(lines)


def handle_containers(_args: str, env: dict[str, str]) -> str:
    """Verbose docker stats for every running container."""
    rc, out = run(
        [
            "docker",
            "stats",
            "--no-stream",
            "--format",
            "{{.Name}}|{{.CPUPerc}}|{{.MemUsage}}|{{.MemPerc}}",
        ],
        timeout=15,
    )
    if rc != 0:
        return f"❌ docker stats failed:\n```\n{out[:400]}\n```"

    grouped: dict[str, list[str]] = {}
    for line in out.splitlines():
        if "|" not in line:
            continue
        try:
            name, cpu, mem_use, mem_pct = line.split("|", 3)
        except ValueError:
            continue
        tenant = _tenant_for(name)
        grouped.setdefault(tenant, []).append(f"  `{name}` — CPU {cpu} · Mem {mem_use} ({mem_pct})")

    if not grouped:
        return "_no running containers_"

    lines = ["*Pi-wide container stats*\n"]
    for tenant in sorted(grouped):
        lines.append(f"*{tenant}*")
        lines.extend(sorted(grouped[tenant]))
        lines.append("")
    return "\n".join(lines)


def handle_digest(_args: str, env: dict[str, str]) -> str:
    """Pi-wide resource snapshot: load / mem / swap / temp / NVMe / uptime."""
    # Read /proc directly — fast, no shell-out, no parsing surprises.
    try:
        load_line = Path("/proc/loadavg").read_text().split()
        load_1, load_5, load_15 = load_line[0], load_line[1], load_line[2]
    except Exception:
        load_1 = load_5 = load_15 = "?"

    meminfo: dict[str, int] = {}
    try:
        for ln in Path("/proc/meminfo").read_text().splitlines():
            k, _, rest = ln.partition(":")
            num = rest.strip().split()[0]
            try:
                meminfo[k] = int(num)
            except ValueError:
                continue
    except Exception as exc:
        log.warning("meminfo parse failed: %s", exc)
    mem_total_mb = meminfo.get("MemTotal", 0) // 1024
    mem_avail_mb = meminfo.get("MemAvailable", 0) // 1024
    swap_total_mb = meminfo.get("SwapTotal", 0) // 1024
    swap_free_mb = meminfo.get("SwapFree", 0) // 1024
    swap_used_pct = 100 * (swap_total_mb - swap_free_mb) // max(1, swap_total_mb) if swap_total_mb else 0

    # Pi5 thermal sensor lives at /sys/class/thermal/thermal_zone0/temp
    # in millidegrees. Falls back gracefully on non-Pi hardware.
    try:
        temp_milli = int(Path("/sys/class/thermal/thermal_zone0/temp").read_text().strip())
        temp_c = temp_milli / 1000
    except Exception:
        temp_c = -1

    rc, df_out = run(["df", "-B1", "/"], timeout=5)
    nvme_pct = "?"
    nvme_avail = nvme_total = "?"
    if rc == 0 and df_out:
        for line in df_out.splitlines():
            parts = line.split()
            if len(parts) >= 5 and parts[-1] == "/":
                used = int(parts[2])
                avail = int(parts[3])
                total = used + avail
                nvme_pct = f"{100 * used // total}%"
                nvme_avail = f"{avail / 1_000_000_000:.1f} GB"
                nvme_total = f"{total / 1_000_000_000:.1f} GB"
                break

    # Uptime as human-readable
    try:
        up_sec = int(float(Path("/proc/uptime").read_text().split()[0]))
    except Exception:
        up_sec = 0
    days, rem = divmod(up_sec, 86400)
    hours, rem = divmod(rem, 3600)
    mins = rem // 60
    if days:
        uptime_str = f"{days}d {hours}h {mins}m"
    elif hours:
        uptime_str = f"{hours}h {mins}m"
    else:
        uptime_str = f"{mins}m"

    return (
        "*Pi resource snapshot*\n\n"
        f"⚡ *Load*: {load_1} / {load_5} / {load_15} (1m / 5m / 15m)\n"
        f"💾 *Memory*: {mem_avail_mb} MB available of {mem_total_mb} MB\n"
        f"🔄 *Swap*: {swap_used_pct}% of {swap_total_mb} MB\n"
        f"🌡 *Temp*: {temp_c:.1f}°C\n"
        f"💿 *NVMe*: {nvme_pct} used ({nvme_avail} free of {nvme_total})\n"
        f"⏱ *Uptime*: {uptime_str}\n"
        f"\n_{time.strftime('%H:%M UTC', time.gmtime())} on `{os.uname().nodename}`_"
    )


def handle_disk(_args: str, env: dict[str, str]) -> str:
    """Docker disk usage breakdown + Pi disk overview."""
    rc, out = run(["docker", "system", "df"], timeout=10)
    if rc != 0:
        return f"❌ docker system df failed:\n```\n{out[:400]}\n```"

    # df -h for / and /mnt/* (external SSD if mounted)
    rc2, df_out = run(["df", "-h", "/", "/mnt/media"], timeout=5)
    df_block = df_out if rc2 == 0 else "(df failed)"

    return f"*Pi disk usage*\n\n_Docker_:\n```\n{out[:1800]}\n```\n_Filesystem_:\n```\n{df_block[:600]}\n```"


def handle_uptime(_args: str, env: dict[str, str]) -> str:
    """Kernel + boot info."""
    rc1, uname_out = run(["uname", "-srvm"], timeout=5)
    rc2, who_out = run(["who", "-b"], timeout=5)
    rc3, free_out = run(["free", "-h"], timeout=5)
    return (
        "*Pi system info*\n\n"
        f"*Kernel*: `{uname_out if rc1 == 0 else '?'}`\n"
        f"*Last boot*: `{who_out.strip() if rc2 == 0 else '?'}`\n"
        f"\n*Memory* (`free -h`):\n```\n{free_out if rc3 == 0 else '?'}\n```"
    )


def handle_health(_args: str, env: dict[str, str]) -> str:
    """Run pi-health.sh on demand and report the run status."""
    script = SCRIPT_DIR / "pi-health.sh"
    if not script.exists():
        return "_pi-health.sh not deployed_"
    rc, _out = run(["bash", str(script)])
    log_path = Path.home() / "monitor-state" / "health.log"
    last = ""
    if log_path.exists():
        body = log_path.read_text().splitlines()
        last = "\n".join(body[-5:]) if body else ""
    return f"*Pi health probe*\n\nRun rc: `{rc}`\nLast 5 log lines:\n```\n{last or '(empty)'}\n```"


def handle_help(_args: str, env: dict[str, str]) -> str:
    return (
        "*Pi monitor bot — read-only operator commands*\n\n"
        "Tap a button below or type the command directly.\n\n"
        "/status — all-tenant container summary, grouped\n"
        "/containers — verbose docker stats for every container\n"
        "/digest — Pi resource snapshot (load, mem, swap, temp, NVMe, uptime)\n"
        "/disk — docker + filesystem disk usage breakdown\n"
        "/uptime — kernel, last boot, free memory\n"
        "/health — run pi-health.sh on demand\n"
        "/help — this list"
    )


HELP_BUTTONS: list[tuple[str, str]] = [
    ("📊 Status", "/status"),
    ("🐳 Containers", "/containers"),
    ("📈 Digest", "/digest"),
    ("💿 Disk", "/disk"),
    ("⏱ Uptime", "/uptime"),
    ("🩺 Health", "/health"),
]


COMMANDS: dict[str, Callable[[str, dict[str, str]], str]] = {
    "/status": handle_status,
    "/containers": handle_containers,
    "/digest": handle_digest,
    "/disk": handle_disk,
    "/uptime": handle_uptime,
    "/health": handle_health,
    "/help": handle_help,
    "/start": handle_help,
}


# ─── update loop ───────────────────────────────────────────────────────────


def load_offset() -> int:
    if not OFFSET_FILE.exists():
        return 0
    try:
        return int(OFFSET_FILE.read_text().strip() or 0)
    except ValueError:
        return 0


def save_offset(offset: int) -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    OFFSET_FILE.write_text(str(offset))


def dispatch(message: dict[str, Any], env: dict[str, str]) -> None:
    chat = message.get("chat", {})
    chat_id = str(chat.get("id", ""))
    if chat_id != env["TELEGRAM_CHAT_ID"]:
        log.info("ignoring message from unauthorised chat_id=%s", chat_id)
        return

    text = (message.get("text") or "").strip()
    cmd = text.split("@", 1)[0].split()[0] if text else ""
    if not cmd:
        return
    _dispatch_command(cmd, chat_id, env, source="message")


def dispatch_callback(cb: dict[str, Any], env: dict[str, str]) -> None:
    """Handle a tap on an inline-keyboard button."""
    token = env["TELEGRAM_BOT_TOKEN"]
    cb_id = cb.get("id", "")
    from_user_id = str((cb.get("from") or {}).get("id", ""))
    chat_id = str(((cb.get("message") or {}).get("chat") or {}).get("id", ""))
    data = (cb.get("data") or "").strip()

    # Re-validate the originating user_id (not just chat_id) so a
    # forged callback from another chat cannot trigger a handler.
    if from_user_id != env["TELEGRAM_CHAT_ID"]:
        log.info("ignoring callback from unauthorised user_id=%s", from_user_id)
        answer_callback(token, cb_id)
        return

    answer_callback(token, cb_id)
    if not data.startswith("/"):
        return
    _dispatch_command(data, chat_id, env, source="tap")


def _dispatch_command(cmd: str, chat_id: str, env: dict[str, str], *, source: str) -> None:
    handler = COMMANDS.get(cmd)
    if not handler:
        send_message(
            env["TELEGRAM_BOT_TOKEN"],
            chat_id,
            f"unknown command `{cmd}` — try /help",
        )
        return

    log.info("dispatch %s (via %s)", cmd, source)
    try:
        reply = handler("", env)
    except Exception as exc:
        log.exception("handler %s crashed", cmd)
        reply = f"❌ handler crashed: `{exc}`"

    keyboard = _help_keyboard() if cmd in ("/help", "/start") else None
    send_message(env["TELEGRAM_BOT_TOKEN"], chat_id, reply, reply_markup=keyboard)


def poll_loop(env: dict[str, str]) -> None:
    token = env["TELEGRAM_BOT_TOKEN"]
    offset = load_offset()
    log.info("starting long-poll loop (offset=%s)", offset)

    backoff_sec = 1
    while True:
        params = {
            "offset": offset,
            "timeout": POLL_TIMEOUT_SEC,
            "allowed_updates": json.dumps(["message", "callback_query"]),
        }
        ok, result = telegram_call(token, "getUpdates", params)
        if not ok:
            log.warning("getUpdates failed; backing off %ss", backoff_sec)
            time.sleep(backoff_sec)
            backoff_sec = min(backoff_sec * 2, 60)
            continue
        backoff_sec = 1

        for update in result.get("result", []):
            update_id = update.get("update_id", 0)
            offset = max(offset, update_id + 1)
            if "message" in update:
                dispatch(update["message"], env)
            elif "callback_query" in update:
                dispatch_callback(update["callback_query"], env)
            save_offset(offset)


# ─── entry point ───────────────────────────────────────────────────────────


def install_signal_handlers() -> None:
    def _exit(signum, _frame):
        log.info("received signal %s, shutting down", signum)
        sys.exit(0)

    signal.signal(signal.SIGTERM, _exit)
    signal.signal(signal.SIGINT, _exit)


def main() -> None:
    if shutil.which("docker") is None:
        log.error("docker not on PATH — pi-monitor-bot needs it for /status etc.")
        sys.exit(1)
    env = load_env()
    install_signal_handlers()
    poll_loop(env)


if __name__ == "__main__":
    main()
