# BookSwap Monitoring Playbook

> **Status**: living document
> **Owner**: solo operator
> **Last reviewed**: 2026-05-01

The BookSwap-specific monitoring stack on the Pi5: what it watches, where it sends alerts, and how to operate the read-only Telegram bot. Pi-wide monitoring (covering all five tenants — SpeakLinka, Vineyard Group, Nimoh Digital, BookSwap, BeBase) lives outside this doc and reports to the operator-wide Telegram channel.

---

## TL;DR

- **Two Telegram channels** in use. The pre-existing operator channel keeps getting Pi-wide alerts. A new BookSwap-only channel (bot id `8717082972`) gets BookSwap-**production**-specific signals plus a mirrored copy of any Pi-wide alert that affects BookSwap availability.
- **Staging is intentionally excluded** from this channel. `bs_*_staging` containers, the `bs_staging` database, and `environment:staging` Sentry issues all stay on the operator channel via the existing pi-wide monitors. The BookSwap channel only ever pings for things that affect end-users in production.
- **Five new cron monitors** run BookSwap-specific checks (containers, endpoints, backups, Sentry, abuse signals).
- **One read-only bot** (`bookswap-bot.service`, systemd) lets the operator query state on demand from the BookSwap channel: `/status`, `/digest`, `/abuse`, `/sentry`, `/health`, `/containers`, `/help`. No mutating commands.
- All credentials live in `~/.bookswap-monitor-env` on the Pi (mode 600). The bot token is rotatable via BotFather without touching the repo.

---

## Architecture

```
                                          ╭───────── Operator channel
                                          │           (Pi-wide)
                                          │
  pi-health.sh ─────────────────────────► routine alerts (CPU temp,
  container-monitor.sh                    docker waste, build cache)
  endpoint-monitor.sh, backup-monitor.sh
  security-monitor.sh, db-monitor.sh
  docker-cleanup.sh, sentry-check.sh

  pi-health.sh (CRITICAL only) ─────────► BOTH channels
                                          (OOM, NVMe full, reboot,
                                           memory cgroup disabled)
                                          │
                                          ╰───────── BookSwap channel
                                                    (bot 8717082972)
                                                    │
  bookswap-container-monitor.sh ──────────────────► │
  bookswap-endpoint-monitor.sh ───────────────────► │
  bookswap-backup-check.sh ───────────────────────► │
  bookswap-sentry-check.sh ───────────────────────► │
  bookswap-abuse-monitor.sh ──────────────────────► │
  bookswap-ops-digest.sh ─────────────────────────► │
                                                    │
                                                    ▲
                                          /status   │   bookswap-bot.service
                                          /digest   │   (Python long-poll
                                          /sentry   ◀── daemon, systemd)
                                          /abuse    │
                                          /health   │
                                          /containers
                                          /help
```

**Why long-polling, not webhooks**: the bot must work when the BookSwap API is down (which is exactly when you'll reach for `/status`). Webhooks would couple the bot to the API.

**Why read-only commands**: the blast radius of a compromised bot token stays small. If someone steals the token via the WebSearch leak we already discussed, the worst they can do is read state. No restart-celery, no flush-cache, nothing that mutates.

---

## What each monitor watches

| Script | Cadence | Alert condition | Channel |
|---|---|---|---|
| `bookswap-container-monitor.sh` | 5 min | bs_*_prod down / unhealthy / restart loop / mem > 85% of cgroup cap / CPU > 200% sustained | BookSwap |
| `bookswap-endpoint-monitor.sh` | 5 min | book-swaps.com or api.book-swaps.com non-2xx, latency > 3 s, TLS cert < 14 d | BookSwap |
| `bookswap-backup-check.sh` | daily 06:30 UTC | bs_prod dump missing for today, < 10 KB, fails `pg_restore --list`, or NVMe ↔ external size mismatch | BookSwap |
| `bookswap-sentry-check.sh` | every 4 h (offset :17) | new unresolved `environment:production` issue across `bookswap-{frontend,backend,mobile}` Sentry projects (at-most-once per issue ID via `seen-issues.txt`) | BookSwap |
| `bookswap-abuse-monitor.sh` | hourly (offset :23) | T&S report filed, account lockout, signup spike (> 3× 7-day baseline AND > 10 absolute), or open-report queue ≥ 5 | BookSwap |
| `bookswap-ops-digest.sh` | every 4 h (offset :15) | full ops digest (users / books / exchanges / T&S queue / Pi snapshot) — re-routed from operator channel as of 2026-05-01 | BookSwap |
| `pi-health.sh` (existing) | 15 min | CRITICAL subset (OOM, NVMe full, reboot, memory cgroup disabled) mirrors to BookSwap; rest stays operator-only | Both |

Cron offset minutes are deliberately spread (`:15`, `:17`, `:23`, etc.) so they don't all stampede the docker socket and Postgres at the top of the hour.

---

## The bot

`bookswap-bot.service` is a Python 3 stdlib long-polling daemon. Approximately 350 lines, no pip dependencies. RAM footprint ~14 MiB.

**Operate the service**

```bash
ssh piserver
sudo systemctl status bookswap-bot       # current state
sudo systemctl restart bookswap-bot      # after editing the .py or .service
journalctl -u bookswap-bot -f            # tail logs (everything goes to journald)
journalctl -u bookswap-bot --since '1h ago' | grep dispatch  # see which commands ran
```

**Update the bot code**

The Python file lives in the repo at `backend/scripts/pi/bookswap-bot.py`. To deploy:

```bash
scp backend/scripts/pi/bookswap-bot.py piserver:~/scripts/
ssh piserver 'sudo systemctl restart bookswap-bot'
```

**Update the systemd unit**

```bash
scp backend/scripts/pi/bookswap-bot.service piserver:/tmp/
ssh piserver 'sudo cp /tmp/bookswap-bot.service /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl restart bookswap-bot'
```

**Auth model**

The bot only responds to messages whose `chat.id` matches `BOOKSWAP_TELEGRAM_CHAT_ID` from `~/.bookswap-monitor-env`. Any other chat is ignored silently — the unauthorised user gets no reply at all (deliberate; saying "unauthorised" tells an attacker the bot is alive).

**Adding a new read-only command**

1. Write a `handle_xyz(args, env) -> str` function in `bookswap-bot.py`.
2. Add it to the `COMMANDS` dict.
3. Append a one-liner to `handle_help()`.
4. `scp` + restart the service.

Adding a *mutating* command is intentionally not a one-step process — it would require revisiting the auth model (signed tokens? confirmation prompt?). Don't shortcut it.

---

## Credentials & rotation

**File**: `~/.bookswap-monitor-env` on the Pi (mode 600, never in the repo).

```
BOOKSWAP_TELEGRAM_BOT_TOKEN=...   # from BotFather
BOOKSWAP_TELEGRAM_CHAT_ID=...     # operator's private chat with the bot
BOOKSWAP_SENTRY_ORG=nimoh-digital-solutions
BOOKSWAP_SENTRY_PROJECTS=bookswap-frontend,bookswap-backend,bookswap-mobile
BOOKSWAP_GH_REPO=Nimoh-Digital-Solutions/book-swap
```

The Sentry token itself comes from the existing `~/.sentryclirc` (org-wide, shared with the SpeakLinka monitors).

**Rotating the bot token** (do this any time the token is suspected leaked):

```bash
# 1. In Telegram, message @BotFather, /revoke, pick the BookSwap bot,
#    paste in the new token from the reply.
# 2. On the Pi:
ssh piserver
nano ~/.bookswap-monitor-env       # update BOOKSWAP_TELEGRAM_BOT_TOKEN
sudo systemctl restart bookswap-bot
```

The cron monitors will pick up the new token automatically on their next run (they `source` the env file each time). No code or repo changes needed.

---

## Runbook — when something feels off

```bash
# Bot stopped responding?
journalctl -u bookswap-bot -n 50 --no-pager
# Most likely: telegram outage, the loop will recover; or a handler crashed
# (look for "handler crashed" in the log; the bot keeps running, the
# specific command just returns an error).

# A monitor is firing alerts in a loop?
ls -lt ~/monitor-state/bookswap-*.log | head -5
tail -20 ~/monitor-state/bookswap-<which>.log
# Each monitor is idempotent and safe to disable temporarily by commenting
# its cron line: `crontab -e` and prefix the line with `#`. Re-enable
# the same way.

# A monitor is sending too many alerts but not enough variety?
# Check the dedup state file:
ls -la ~/monitor-state/bookswap-sentry/seen-issues.txt
# Sentry monitor uses this for at-most-once delivery. Resetting it
# (rm) will replay every currently-unresolved issue once.

# Need to pause the BookSwap channel entirely?
# Easiest: in Telegram, mute the chat with the bot. The cron jobs keep
# running and logging, you just don't get pushed to. Unmute when ready.
# Heavy: `sudo systemctl stop bookswap-bot` only stops the bot itself,
# not the cron-driven alert pushes — those are independent.

# Verify mirroring is wired correctly (after a Pi reboot or alert):
journalctl -u cron --since '20m ago' | grep pi-health
tail ~/monitor-state/health.log
# Look for "(op + bookswap=yes)" on critical alerts and "(op + bookswap=no)"
# on routine ones. Mismatch = bug in pi-health.sh routing logic.
```

---

## Adding a new BookSwap monitor

Follow the existing template:

1. Create `backend/scripts/pi/bookswap-<name>.sh`.
2. Source `_monitor-lib.sh`, do whatever the check is, call `send_telegram_bookswap` to alert, `log_msg "OK" ...` on quiet runs.
3. Decide cadence (5 min / hourly / 4-hourly / daily) and a non-top-of-hour cron offset.
4. `scp` to the Pi and append the cron entry idempotently:

   ```bash
   ssh piserver "
     grep -q bookswap-<name>.sh <(crontab -l) || (
       crontab -l | { cat; echo '<schedule> /home/gnimoh001/scripts/bookswap-<name>.sh >> /home/gnimoh001/monitor-state/bookswap-<name>.log 2>&1'; } | crontab -
     )
   "
   ```

5. Run it once manually, confirm the message arrives in the BookSwap channel.
6. Document the new monitor in the table above.
