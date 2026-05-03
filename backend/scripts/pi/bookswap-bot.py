#!/usr/bin/env python3
"""BookSwap Telegram bot — read-only operational queries.

Long-polling daemon (no webhook) so it works even when the BookSwap API is
down. Authorised only for one chat_id; everyone else is ignored silently.
Commands dispatch to a hard-coded dict — Telegram message text is matched
literally and never interpolated into shell, so command arguments are not
yet supported (and don't need to be for the read-only command set).

Runs as systemd unit ``bookswap-bot.service``. State lives at
``~/monitor-state/bookswap-bot/`` (just an offset file for getUpdates
deduplication).

Source of truth: backend/scripts/pi/bookswap-bot.py.
Deployed copy: ~/scripts/bookswap-bot.py on the Pi.
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

ENV_FILE = Path.home() / ".bookswap-monitor-env"
STATE_DIR = Path.home() / "monitor-state" / "bookswap-bot"
OFFSET_FILE = STATE_DIR / "update-offset.txt"
SCRIPT_DIR = Path.home() / "scripts"

# Long-poll wait. 25 s keeps us under most NAT timeouts and within the
# 50 s Telegram cap with comfortable headroom on the request itself.
POLL_TIMEOUT_SEC = 25
# Wall-clock timeout on the urllib request — must exceed POLL_TIMEOUT.
HTTP_TIMEOUT_SEC = POLL_TIMEOUT_SEC + 10
# Cap any /digest, /sentry, /containers handler at this many seconds so a
# wedged Django process can't lock up the bot.
HANDLER_TIMEOUT_SEC = 60
# Telegram caps sendMessage at 4096 chars. Leave headroom for our footer.
TELEGRAM_MAX_LEN = 3800

# ─── logging ───────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("bookswap-bot")


# ─── env loading ────────────────────────────────────────────────────────────


def load_env() -> dict[str, str]:
    """Parse ~/.bookswap-monitor-env into a dict.

    Same format the bash scripts source — KEY=VALUE per line, # comments
    ignored, no shell expansion. We don't `source` the file because we
    don't need bash semantics and we don't want to depend on bash being
    available inside the systemd-run process.
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
        # Mirror bash `source` semantics: strip a single layer of
        # surrounding quotes if present. Some operator env files use
        # `KEY="value"`, others bare `KEY=value`; both should work.
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
            value = value[1:-1]
        env[key.strip()] = value

    required = ("BOOKSWAP_TELEGRAM_BOT_TOKEN", "BOOKSWAP_TELEGRAM_CHAT_ID")
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
    # URL is hardcoded to a fixed `https://api.telegram.org/...` host —
    # `method` is one of {"getUpdates", "sendMessage"} and never user-
    # controlled, so the S310 scheme-audit warning doesn't apply here.
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
    """2-column grid of inline buttons mapping to read-only commands.

    `callback_data` is the slash command itself — the dispatch path
    treats it identically to a typed message, so adding/removing a
    handler in the COMMANDS dict automatically flows through here too
    (see HELP_BUTTONS for the layout).
    """
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
        # Telegram expects the keyboard as a JSON-encoded string in the
        # form-encoded body, not a nested object.
        base_params["reply_markup"] = json.dumps(reply_markup)

    # First try with Markdown — most replies are formatted. If Telegram
    # rejects it (typically a 400 over an unbalanced `_` or `*`), retry
    # as plain text so the operator at least sees the content rather
    # than a silently-dropped reply.
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
    """Dismiss the spinner on a tapped inline-keyboard button.

    Telegram requires this within 30s of the callback or the user's
    client shows "loading…" indefinitely. We pass an empty `text` for
    the silent case (no banner), and a short toast-style message when
    we want to confirm something at the tap location.
    """
    telegram_call(
        token,
        "answerCallbackQuery",
        {"callback_query_id": callback_query_id, "text": text},
    )


# ─── command handlers ──────────────────────────────────────────────────────


def run(cmd: list[str], timeout: int = HANDLER_TIMEOUT_SEC) -> tuple[int, str]:
    """Run a subprocess capturing stdout/stderr, never raising.

    Wraps the per-handler shell-out (docker exec, ~/scripts/* invocation)
    so a wedged subprocess can't hang the bot. Returns (rc, output).
    """
    try:
        # `cmd` is always a hardcoded list literal in the call sites
        # (docker / bash / python with constant binary names) — no user
        # input flows into argv, so the S603 untrusted-input warning
        # doesn't apply.
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


def _bs_containers_status() -> str:
    """Compact status table for bs_*_prod containers."""
    rc, out = run(
        [
            "docker",
            "ps",
            "-a",
            "--filter",
            "name=^bs_.*_prod$",
            "--format",
            "{{.Names}}|{{.Status}}|{{.RunningFor}}",
        ]
    )
    if rc != 0 or not out:
        return "_could not list containers_"
    rows = []
    for line in out.splitlines():
        # Pad with empty strings so the unpack works even when docker
        # returns fewer fields than expected. We only use name + status
        # below — the third slot is intentionally a sink.
        name, status, _age = [*line.split("|"), "", "", ""][:3]
        emoji = (
            "✅" if status.startswith("Up") and "(healthy)" in status else ("🟡" if status.startswith("Up") else "🔴")
        )
        rows.append(f"{emoji} `{name}` — {status}")
    return "\n".join(rows) if rows else "_no bs_*_prod containers found_"


def handle_status(_args: str, env: dict[str, str]) -> str:
    containers = _bs_containers_status()
    rc, sha = run(
        [
            "docker",
            "exec",
            "bs_web_prod",
            "python",
            "-c",
            "import os; print(os.environ.get('GIT_SHA','unknown'))",
        ],
        timeout=10,
    )
    sha_line = sha.strip() if rc == 0 and sha else "unknown"
    return (
        f"*BookSwap status*\n\n{containers}\n\n"
        f"Build: `{sha_line}`\n"
        f"Pi: `{os.uname().nodename}` · {time.strftime('%H:%M UTC', time.gmtime())}"
    )


def handle_digest(_args: str, env: dict[str, str]) -> str:
    # `print_ops_digest` defaults to Markdown when --json is absent.
    # (Don't pass `--format markdown` here — that command predates the
    # newer print_abuse_digest API and only accepts a `--json` boolean.)
    rc, out = run(
        [
            "docker",
            "exec",
            "bs_web_prod",
            "python",
            "manage.py",
            "print_ops_digest",
        ]
    )
    if rc != 0:
        return f"❌ digest command failed (rc={rc}):\n```\n{out[:600]}\n```"
    return out


def handle_review(_args: str, env: dict[str, str]) -> str:
    """Pull the current App Store review state on demand.

    Wraps `bookswap-asc-review-monitor.sh --once`, which queries the ASC
    API and prints a Markdown status report. The cron-mode invocation of
    that same script owns the transition marker file and Telegram pings;
    --once is read-only and side-effect-free, so calling it from the bot
    can't disturb the every-15-min transition tracker.

    Useful during the App Store review window when the operator wants to
    check status between cron polls without opening App Store Connect.
    """
    script_path = (
        Path.home() / "scripts" / "bookswap-asc-review-monitor.sh"
    )
    if not script_path.exists():
        return (
            "❌ review monitor script not found at "
            f"`{script_path}` — is the Pi deployment up to date?"
        )

    # Hard 30s timeout — ASC API + JWT signing usually < 3s. If it hits
    # the cap something is wrong (revoked key, ASC outage) and the
    # operator should know rather than the bot hanging.
    rc, out = run([str(script_path), "--once"], timeout=30)
    if rc != 0:
        return (
            f"❌ review state lookup failed (rc={rc}):\n"
            f"```\n{out[:600]}\n```"
        )
    return out


def handle_abuse(_args: str, env: dict[str, str]) -> str:
    rc, out = run(
        [
            "docker",
            "exec",
            "bs_web_prod",
            "python",
            "manage.py",
            "print_abuse_digest",
            "--hours",
            "24",
            "--format",
            "markdown",
        ]
    )
    if rc != 0:
        return f"❌ abuse digest failed (rc={rc}):\n```\n{out[:600]}\n```"
    return out


def handle_sentry(_args: str, env: dict[str, str]) -> str:
    """Return the last 5 unresolved BookSwap Sentry issues by latest event."""
    sentry_token = _read_sentry_token()
    if not sentry_token:
        return "_no Sentry token configured_"
    org = env.get("BOOKSWAP_SENTRY_ORG", "nimoh-digital-solutions")
    projects = env.get(
        "BOOKSWAP_SENTRY_PROJECTS",
        "bookswap-frontend,bookswap-backend,bookswap-mobile",
    ).split(",")

    lines: list[str] = ["*BookSwap Sentry — recent unresolved (prod only)*"]
    # Filter to environment:production so /sentry doesn't surface staging
    # noise in the BookSwap operator channel.
    query = urllib.parse.quote("is:unresolved environment:production")
    for project in projects:
        # URL host is hardcoded to `https://sentry.io/...`; `org` and
        # `project` come from our own env file, never user-controlled.
        # Suppressed S310 with that as the documented justification.
        url = f"https://sentry.io/api/0/projects/{org}/{project.strip()}/issues/?query={query}&sort=date&limit=5"
        req = urllib.request.Request(  # noqa: S310
            url, headers={"Authorization": f"Bearer {sentry_token}"}
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:  # noqa: S310
                issues = json.loads(resp.read())
        except Exception as exc:
            lines.append(f"\n_{project}_: ⚠️ {exc}")
            continue

        if not issues:
            lines.append(f"\n_{project}_: clean ✅")
            continue
        lines.append(f"\n*{project}*")
        for issue in issues[:5]:
            short = issue.get("shortId", "?")
            title = (issue.get("title") or "")[:80]
            level = issue.get("level", "?")
            count = issue.get("count", "?")
            lines.append(f"  • `{short}` ({level}, {count}x) — {title}")
    return "\n".join(lines)


def handle_health(_args: str, env: dict[str, str]) -> str:
    """Run the BookSwap endpoint probe on demand and report."""
    script = SCRIPT_DIR / "bookswap-endpoint-monitor.sh"
    if not script.exists():
        return "_endpoint monitor not deployed_"
    # The script logs to its file but produces no stdout in the OK case;
    # we only need the rc here, so the captured output is intentionally
    # discarded with `_out`.
    rc, _out = run(["bash", str(script)])
    # Read the last line of the log so the operator gets a confirmation
    # of what the probe actually saw.
    log_path = Path.home() / "monitor-state" / "bookswap-endpoint.log"
    last = ""
    if log_path.exists():
        last = log_path.read_text().splitlines()[-1] if log_path.stat().st_size else ""
    return f"*BookSwap endpoint probe*\n\nRun rc: `{rc}`\nLast log: `{last or '(empty)'}`"


def handle_containers(_args: str, env: dict[str, str]) -> str:
    """Verbose docker stats for bs_*_prod containers (staging excluded)."""
    rc, out = run(
        [
            "docker",
            "stats",
            "--no-stream",
            "--format",
            "{{.Name}}|{{.CPUPerc}}|{{.MemUsage}}|{{.MemPerc}}",
        ],
        timeout=10,
    )
    if rc != 0:
        return f"❌ docker stats failed:\n```\n{out[:400]}\n```"

    rows = ["*BookSwap prod containers — live stats*", ""]
    for line in out.splitlines():
        # Filter to production containers only — bs_*_staging containers
        # also live on this Pi but we deliberately exclude them from
        # /containers because the BookSwap channel is prod-only.
        if not (line.startswith("bs_") and "_prod" in line.split("|", 1)[0]):
            continue
        try:
            name, cpu, mem_use, mem_pct = line.split("|", 3)
        except ValueError:
            continue
        rows.append(f"`{name}`\n  CPU {cpu} · Mem {mem_use} ({mem_pct})")
    return "\n".join(rows) if len(rows) > 2 else "_no bs_*_prod containers running_"


# Inline-keyboard layout for the /help reply. Each tuple is
# (button label, callback command). New handlers added to the COMMANDS
# dict should also be added here so the keyboard advertises them.
HELP_BUTTONS: list[tuple[str, str]] = [
    ("📊 Status", "/status"),
    ("🐳 Containers", "/containers"),
    ("🌐 Health", "/health"),
    ("📚 Digest", "/digest"),
    ("🛡 Abuse", "/abuse"),
    ("🚨 Sentry", "/sentry"),
    ("📋 Review", "/review"),
]


def handle_help(_args: str, env: dict[str, str]) -> str:
    # Wrap container globs in backticks so Telegram's legacy Markdown
    # parses `bs_*` as a code span instead of trying to balance the
    # underscore/asterisk as italic+bold (which fails with HTTP 400).
    return (
        "*BookSwap bot — read-only commands*\n\n"
        "Tap a button below or type the command directly.\n\n"
        "/status — `bs_*` container summary + build SHA\n"
        "/containers — verbose docker stats for `bs_*`\n"
        "/health — run endpoint probes on demand\n"
        "/digest — full ops digest (users, books, exchanges, T&S queue)\n"
        "/abuse — last 24h trust-safety + lockout signals\n"
        "/sentry — last 5 unresolved Sentry issues per project\n"
        "/review — current iOS App Store review state (on demand)\n"
        "/help — this list"
    )


def _read_sentry_token() -> str | None:
    rc_file = Path.home() / ".sentryclirc"
    if not rc_file.exists():
        return None
    for line in rc_file.read_text().splitlines():
        if line.strip().startswith("token="):
            return line.split("=", 1)[1].strip()
    return None


COMMANDS: dict[str, Callable[[str, dict[str, str]], str]] = {
    "/status": handle_status,
    "/containers": handle_containers,
    "/health": handle_health,
    "/digest": handle_digest,
    "/abuse": handle_abuse,
    "/sentry": handle_sentry,
    "/review": handle_review,
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
    if chat_id != env["BOOKSWAP_TELEGRAM_CHAT_ID"]:
        log.info("ignoring message from unauthorised chat_id=%s", chat_id)
        return

    text = (message.get("text") or "").strip()
    # Telegram delivers /command@botname when the bot is in a group; strip
    # the @ suffix so single-chat handlers still match.
    cmd = text.split("@", 1)[0].split()[0] if text else ""
    if not cmd:
        return
    _dispatch_command(cmd, chat_id, env, source="message")


def dispatch_callback(cb: dict[str, Any], env: dict[str, str]) -> None:
    """Handle a tap on an inline-keyboard button.

    Telegram delivers callback queries as a separate update type, with
    `message` referring to the bot's own original reply (the one with
    the keyboard) and `from` being the user who tapped. We answer the
    callback first to dismiss the spinner, then re-dispatch through the
    same handler path used for typed commands.
    """
    token = env["BOOKSWAP_TELEGRAM_BOT_TOKEN"]
    cb_id = cb.get("id", "")
    from_user_id = str((cb.get("from") or {}).get("id", ""))
    chat_id = str(((cb.get("message") or {}).get("chat") or {}).get("id", ""))
    data = (cb.get("data") or "").strip()

    # Authorisation check — the keyboard is only ever sent to the
    # whitelisted chat, but a determined attacker who knew the chat id
    # could try to forge a callback_query. Re-validate the originating
    # user id here, not just the chat id.
    if from_user_id != env["BOOKSWAP_TELEGRAM_CHAT_ID"]:
        log.info("ignoring callback from unauthorised user_id=%s", from_user_id)
        answer_callback(token, cb_id)
        return

    # Always answer the callback first (silently) so the user's tap
    # animation completes even if the dispatched handler is slow.
    answer_callback(token, cb_id)
    if not data.startswith("/"):
        return
    _dispatch_command(data, chat_id, env, source="tap")


def _dispatch_command(cmd: str, chat_id: str, env: dict[str, str], *, source: str) -> None:
    """Shared command-dispatch path for both typed and tapped commands."""
    handler = COMMANDS.get(cmd)
    if not handler:
        send_message(
            env["BOOKSWAP_TELEGRAM_BOT_TOKEN"],
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

    # Attach the inline-keyboard only to /help replies — every other
    # response is content-heavy and the buttons would just clutter it.
    keyboard = _help_keyboard() if cmd in ("/help", "/start") else None
    send_message(env["BOOKSWAP_TELEGRAM_BOT_TOKEN"], chat_id, reply, reply_markup=keyboard)


def poll_loop(env: dict[str, str]) -> None:
    token = env["BOOKSWAP_TELEGRAM_BOT_TOKEN"]
    offset = load_offset()
    log.info("starting long-poll loop (offset=%s)", offset)

    backoff_sec = 1
    while True:
        params = {
            "offset": offset,
            "timeout": POLL_TIMEOUT_SEC,
            # Subscribe to both event types: typed commands arrive as
            # `message`, button taps arrive as `callback_query`.
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
        log.error("docker not on PATH — bookswap-bot needs it for /status etc.")
        sys.exit(1)
    env = load_env()
    install_signal_handlers()
    poll_loop(env)


if __name__ == "__main__":
    main()
