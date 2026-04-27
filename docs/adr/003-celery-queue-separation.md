# ADR-003: Celery Queue Separation (default / email / maintenance)

**Date:** 2026-04-15
**Status:** Accepted

## Context

BookSwap uses Celery for background work: transactional emails (SendGrid),
WebSocket push notifications, scheduled maintenance (expiring stale exchanges,
anonymizing deleted accounts), and real-time task triggers (rating stats
recalculation).

Running all tasks on a single `default` queue means:

- A burst of notification emails can delay time-sensitive default tasks.
- A long-running maintenance task (e.g. anonymizing thousands of accounts) blocks
  email delivery.
- No ability to scale email delivery independently.

## Decision

Split into **three named queues**:

| Queue | Purpose | Concurrency |
|-------|---------|-------------|
| `default` | General-purpose tasks (rating stats, etc.) | CPU-based (default workers) |
| `email` | Notification tasks that send emails and push WS events | 2 (I/O bound, limited by SendGrid rate) |
| `maintenance` | Scheduled cron tasks (expire requests, anonymize accounts) | 1 (serial, no rush) |

Task routing is configured via `CELERY_TASK_ROUTES` in Django settings using
glob patterns (e.g. `"notifications.*" → email`).

In **development and staging**, a single worker listens on all three queues
(`-Q default,email,maintenance`) for simplicity. In **production**, three
separate workers run with dedicated concurrency.

## Consequences

- **Positive:** Email delivery is isolated — a maintenance task cannot block
  user-facing notifications.
- **Positive:** Maintenance tasks run serially, preventing resource contention
  on bulk operations.
- **Positive:** Each queue can be scaled independently in production.
- **Negative:** Three worker containers in production (more memory on the Pi5).
  Mitigated by low concurrency on email (2) and maintenance (1).
