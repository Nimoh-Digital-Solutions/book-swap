# BookSwap iOS — Release Day Runbook

Last updated: 2026-05-01 (right after submitting `1.0.0 (8)` to App Store Review).

This runbook covers the moment Apple approves the app and you flip it live to
the public, plus how to roll back if something breaks. The Android track is
already on Play production and is out of scope for this document.

---

## Status today

| Layer | State |
|---|---|
| iOS build | `1.0.0 (8)` — submitted, **Waiting for Review** |
| iOS reviewer test account | `reviewer@bookswaps.com` (production, verified, has seeded listing) |
| Release mode | **Manual** — operator clicks *Release This Version* after approval |
| Country reach | ~169 countries, China / Korea / Russia deselected |
| Localizations | EN (primary) + FR + NL — store listing only; in-app i18n via i18next |
| Android | Already live on Play production since 2026-04-30 |

---

## Possible review outcomes

You will get one of three Apple emails (typically 24–48h after submission, sometimes faster).

### A. ✅ "Pending Developer Release"

Apple approved. The app is signed, validated, and sitting in your dashboard
waiting for **you** to click the green light.

> Go to **§ When Apple Approves** below.

### B. ⚠️ "Metadata Rejected"

Something in the **store listing** (text, screenshots, privacy, URLs) doesn't
match Apple's guidelines. You do NOT need to rebuild or resubmit the binary.
Just edit the metadata and click *Submit for Review* again.

> Go to **§ When Apple Rejects (Metadata)** below.

### C. ❌ "Binary Rejected"

Something in the **build itself** failed review (a feature crashes, a
permission is asked but not used, sign-in fails, etc.). You'll need to fix
the code, rebuild via EAS, and resubmit.

> Go to **§ When Apple Rejects (Binary)** below.

---

## When Apple approves

### Pre-release sanity checks (~15 min)

Before clicking *Release*, do a final round of "is the world OK to go public?"
checks. Going public sends real users to your real backend; you want it stable.

```bash
# 1. Backend healthy?
curl -sS https://api.book-swaps.com/api/v1/health/ | jq .
# Expect: {"postgres":"ok","redis":"ok","celery_workers":N}

# 2. Frontend healthy?
curl -sIL https://book-swaps.com | head -2
# Expect: HTTP/2 200

# 3. No active Sentry alerts?
# Open https://sentry.io/organizations/nimoh-digital-solutions/issues/
# Filter: project=bookswap-mobile, environment=production, last 24h
# Look for: any unresolved Critical or Warning issue with > 5 events
# If yes: triage before releasing.

# 4. No active production incidents?
# Open the Telegram BookSwap channel; check the last container-monitor
# / endpoint-monitor digest. If anything's red, fix or accept the risk
# before going public.

# 5. Crash-free session rate (mobile)?
# Open https://sentry.io/organizations/nimoh-digital-solutions/projects/bookswap-mobile/releases/
# Look at the latest release; crash-free sessions should be ≥ 99.5%.
# If below 99%: investigate before releasing.
```

### Click *Release This Version*

1. App Store Connect → BookSwap → Distribution → **iOS App Version 1.0**
2. Top-right blue button: **Release This Version**
3. ASC asks "Are you sure?" → confirm
4. Status changes to **Processing for App Store** (~1–4 hours)
5. After processing: **Ready for Sale** → app appears on the Public App Store globally

### What happens behind the scenes after release

| Time after click | What's happening |
|---|---|
| 0–10 min | ASC marks build as released; CDN propagation begins |
| 10–60 min | App appears on App Store search results in some regions |
| 1–4 h | Full global CDN propagation; iTunes Lookup API returns 200 |
| 4–12 h | Search ranking stabilizes; reviews can start being submitted by users |

### First-hour checks (after status = Ready for Sale)

```bash
# 1. Public iTunes API confirms app is live
curl -s "https://itunes.apple.com/lookup?id=6762515297" | jq '.resultCount, .results[0].trackName, .results[0].version'
# Expect: 1, "BookSwap", "1.0.0"

# 2. App Store URL works
open "https://apps.apple.com/app/id6762515297"
# Or visit on a phone

# 3. Backend metrics — watch for traffic surge
# Login throughput, websocket connections, Postgres connection count
# Telegram BookSwap channel will show the next ops digest in ≤ 4h
```

### What to do in the first 24 hours after release

- **Watch Sentry** — new install crashes appear in the first hour. Triage anything spiky.
- **Watch the BookSwap Telegram channel** — `bookswap-ops-digest.sh` reports user counts every 4h. Sudden spikes or freezes are early signals.
- **Watch UptimeRobot** — 3 monitors. Any flap = investigate.
- **Don't merge anything risky to `main`** until 24h of clean release health passed. OTA fixes are allowed (they go via `eas update` not via App Store re-review), but resist the urge to ship features.
- **Reply to App Store reviews** within 24h. Negative reviews are most influential in the first week.

---

## When Apple rejects (Metadata)

The most common rejection in EU markets. Examples and fix patterns:

| Rejection text | What to do | Time |
|---|---|---|
| "We were unable to sign in with the provided credentials" | Re-test the test account login. If broken, recreate the account, update Sign-In Information field, resubmit. | 5 min |
| "Your screenshots show features not present in the app" | Identify which screenshot is misleading. Either replace the screenshot or remove the feature mention. Resubmit. | 15 min |
| "Your description references content not visible in the binary" | Edit description to drop the offending claim. Resubmit. | 5 min |
| "Privacy policy URL doesn't load" | Fix DNS / hosting issue. Verify with `curl -I <url>`. Resubmit. | 10 min |
| "DSA trader information is missing or invalid" | App Information → Digital Services Act → Edit. Verify URL is HTTPS and the page loads with operator details. | 5 min |

**Resubmission flow (no rebuild needed):**

1. ASC → **App Review** (left sidebar) → see the rejection note
2. Fix the metadata
3. Top-right → **Submit for Review** → answer compliance questions → submit
4. Back into the queue. Each resubmission is a fresh ~24h review.

---

## When Apple rejects (Binary)

Less common but more involved. Examples:

| Rejection text | Likely cause | Fix |
|---|---|---|
| "App crashes on launch on iPad" | A library failed to load on iPad despite `supportsTablet: false` | Verify Info.plist + entitlements; rebuild |
| "Sign in with Apple is required because you offer Google Sign-In" | Apple Sign-In missing OR not visible on the auth screen | Verify the iOS app's auth screen actually renders Apple Sign-In as the first option — re-test |
| "Camera permission is requested but never used" | Permission rationale string fires before camera is actually invoked | Move the permission prompt to the moment of camera need (barcode scanner) |
| "Test account login leads to a blank screen" | Backend issue specific to the reviewer's IP / location | Check backend logs at the time of review for that user. Fix backend; OTA may suffice if no native code change |

**Rebuild + resubmit flow:**

```bash
cd mobile

# 1. Make the code fix (whatever it is). Commit it.
git add . && git commit -m "fix(mobile): <what was rejected>"

# 2. Trigger new build (autoIncrement bumps build number 8 → 9)
eas build --platform ios --profile production --auto-submit --non-interactive

# 3. Wait for build (~10-15 min) + auto-submit to ASC (~5 min) +
#    Apple processing (~10 min) — total ~30 min.

# 4. Once 1.0.0 (9) shows "Complete" in ASC TestFlight tab:
#    App Store tab → 1.0 Prepare for Submission
#    Build section → "–" detach (8) → "+" attach (9) → Save
#    Add for Review → answer questions → Submit
```

The rejection note from Apple has a "Reply to App Review" button — use it
to respond with what you fixed. That sometimes shortens the next review cycle.

---

## Rollback plan (if release goes badly)

If you've released to public and things break catastrophically:

### Option 1 — Pull the app from sale (fastest, ~5 min)

```
ASC → Pricing and Availability → Manage → uncheck all countries → Save
```

App stops being downloadable instantly (existing installs continue to run).
This is your "stop the bleeding" lever — use it if a critical security issue
or data corruption appears in the first hour.

### Option 2 — Ship an OTA fix (no review required, ~10 min)

If the bug is in JS / React Native code (not native modules):

```bash
cd mobile

# Make the fix, commit
git add . && git commit -m "fix(mobile): <bug>"

# Push OTA to production channel
eas update --environment production --message "fix: <description>"

# Existing installed apps fetch the update on next launch.
# 95% of users have the fix within ~24 hours.
```

OTA fixes apply to the **same binary** that's in the App Store, so the user
doesn't need to update from the store. This is your default fix mechanism
post-launch.

### Option 3 — Submit a hot-fix build (review required, ~24–48h)

If the bug is in native code, OTA can't fix it. You need a new binary:

```bash
cd mobile
# Make the fix, commit
git add . && git commit -m "fix(mobile): native crash on <X>"

# Bump version (1.0.0 → 1.0.1)
# Edit mobile/app.json: "version": "1.0.1"
# Edit mobile/package.json: "version": "1.0.1"
# (the CI version-sync gate will fail otherwise)

git add . && git commit -m "chore(mobile): bump to 1.0.1 for hotfix"

# Build + submit
eas build --platform ios --profile production --auto-submit --non-interactive

# Once processed, in ASC create a new app version (1.0.1)
# fill the same metadata, attach build, "Submit for Review"
# Mark as "Expedited Review" if security-critical (link in submission form)
```

**Apple typically grants expedited reviews for security issues within 6–12
hours.** Use this judiciously — abusing it gets future requests denied.

---

## Useful URLs and IDs

| Thing | Value |
|---|---|
| ASC App ID | `6762515297` |
| Apple Team ID | `Z68MT647CX` |
| Bundle ID | `com.gnimoh.bookswap` |
| App Store URL (post-release) | `https://apps.apple.com/app/id6762515297` |
| iTunes Lookup API | `https://itunes.apple.com/lookup?id=6762515297` |
| EAS project | `@info_nimoh/bookswap` |
| EAS dashboard | `https://expo.dev/accounts/info_nimoh/projects/bookswap` |
| Privacy policy | `https://book-swaps.com/en/privacy-policy` |
| Support page | `https://book-swaps.com/en/support` |
| Production API | `https://api.book-swaps.com` |

---

## Pre-emptive monitoring helpers

These are designed to be runnable from anywhere (your laptop, the Pi,
GitHub Actions). They don't require ASC API authentication.

### `bookswap-asc-public-check.sh`

Polls Apple's public iTunes Lookup API every N minutes; pings Telegram the
**first time** the app appears live on the App Store after release.
Actionable signal: when this fires, your app is publicly downloadable
worldwide (CDN propagation complete).

```bash
~/scripts/bookswap-asc-public-check.sh
```

Lives at `backend/scripts/pi/bookswap-asc-public-check.sh` in the repo;
deployed copy in `~/scripts/` on the Pi. Cron schedule: every 30 min until
fired, then disabled.

### Future: full review-state monitoring

Requires generating an App Store Connect API Key from
ASC → Users and Access → Integrations → App Store Connect API.
Tracked in `PRODUCTION-READINESS.md` "Next Actions" as a P1.

---

## Lessons learned during submission (for next time)

- **`supportsTablet: true` forces iPad screenshot uploads.** If you don't have
  proper iPad layouts, set it to `false` from the start. Changing it later
  requires a rebuild.
- **Privacy policy URL must use the live domain**, not a placeholder
  (we shipped with `bookswap.app` initially → fixed to `book-swaps.com`).
- **Reviewer account must exist in production AND have content seeded.**
  An empty account would have left the reviewer staring at empty tabs.
- **Manual release > automatic release** for first launch. Lets you decide
  go-live timing once approved.
- **EAS `--auto-submit` is reliable.** From `eas build` to "Build is ready
  to test" was ~25 min end-to-end.
- **The 3-branch promotion flow (`main → staging → production`)** is the
  real deploy gate, not the CI green check on `main`. The promotion bug
  caught us with the support page; document it for new contributors.
