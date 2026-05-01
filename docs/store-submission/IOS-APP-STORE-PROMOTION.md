# BookSwap — iOS App Store Production Promotion

**Goal:** promote the existing TestFlight build of BookSwap **1.0.0** to the public App Store.

**State today (2026-05-01):**
- iOS build is live on **TestFlight only**, internal testers verified.
- Android is already live on the **Play production track**.
- Backend points at `https://api.book-swaps.com` (prod). All hotfixes from 2026-04-30 → 2026-05-01 are in the build via OTA (logout-on-close, chat self-heal, push channel, profile photo auto-save).
- Sentry on `bookswap-mobile` shows 2 unresolved iOS issues, both already silent for 5–7h after the OTA. We want **24h of silence** before submitting.

**Estimated wall-clock:**
- ~1 hour of operator work in App Store Connect.
- 24–48h of Apple review.
- Total: 1–3 days from "click submit" to "live in App Store".

---

## Pre-flight (do not skip)

Run through this checklist **before** opening App Store Connect. Every item should be a one-line yes/no.

### 1. Build & metadata ready

- [ ] App Store Connect app exists with bundle ID `com.gnimoh.bookswap` (ASC App ID `6762515297`, team `Z68MT647CX`).
- [ ] TestFlight has a processed build for **1.0.0** (the one your testers are on). Apple-side processing must be complete (green "Ready to Submit" status, not "Processing").
- [ ] Build is on Internal Testing track, has been **opened on at least one real iPhone** by a tester in the last 24h with no crash.
- [ ] `mobile/app.json` and `mobile/package.json` both report `1.0.0` (CI's version-sync gate enforces this on every PR).
- [ ] `eas.json` → `submit.production.ios` has `ascAppId: "6762515297"` and `appleTeamId: "Z68MT647CX"` (already configured).

### 2. Sentry quiet window (the launch gate)

Before submitting, the two known issues must be **silent for ≥ 24h**:

- [ ] `BOOKSWAP-MOBILE-1` (`AxiosError 401`) — last seen 2026-05-01 08:05 UTC.
- [ ] `BOOKSWAP-MOBILE-2` (`No refresh token`) — last seen 2026-05-01 10:29 UTC.

**Soonest safe submit:** 2026-05-02 ~10:30 UTC (≈ 12:30 Brussels). Verify in Sentry → Issues → filter `is:unresolved environment:production`. If either issue has a fresh event in the last 24h, **do not submit yet**; investigate and OTA-fix first.

After 24h of silence: in Sentry, mark both as **Resolved in next release**.

### 3. Store assets

- [ ] App icon at `mobile/assets/icon.png` is **1024 × 1024**, no alpha channel, no rounded corners.
- [ ] Screenshots captured per `docs/store-submission/screenshot-checklist.md`:
  - [ ] 6.7" iPhone (1290 × 2796) — **mandatory**
  - [ ] 6.5" iPhone (1242 × 2688) — **mandatory**
  - [ ] 5.5" iPhone (1242 × 2208) — recommended
  - [ ] At least 2 per device class, max 10.
- [ ] Listing texts (EN, FR, NL) in `docs/store-submission/store-listing-{en,fr,nl}.md` are final.

### 4. Legal & policy

- [ ] Privacy policy is publicly reachable at `https://bookswap.app/en/privacy-policy` (and `/fr/`, `/nl/`).
- [ ] Support URL `https://bookswap.app/support` resolves.
- [ ] `app.json` has `ITSAppUsesNonExemptEncryption: false` (already set — avoids the export-compliance prompt).
- [ ] DPIA (`docs/DPIA-location-data.md`) reviewed. Privacy labels (§2 below) match the DPIA.

### 5. Backend safety

- [ ] No DB migrations queued for production deploy in the next 48h.
- [ ] `book-swaps.com` UptimeRobot monitors are green.
- [ ] BookSwap Telegram channel quiet (no fresh container/endpoint/sentry alerts).

---

## Step 1 — Set Apple privacy labels

Apple's privacy labels are **separate** from the Google Play data-safety form and from the DPIA. They live in App Store Connect → App Privacy.

Use this mapping (derived from `docs/store-submission/store-listing-en.md` § Data Safety + `docs/DPIA-location-data.md`):

| Data type | Collected? | Linked to user? | Used for tracking? | Purposes |
|---|---|---|---|---|
| **Email** | Yes | Yes | No | App Functionality, Account Management |
| **Name** | Yes | Yes | No | App Functionality (profile, visible to swap partners) |
| **Coarse Location** | Yes | Yes | No | App Functionality (nearby books discovery) |
| **Photos** | Yes | Yes | No | App Functionality (book covers, avatar) |
| **User-generated Content** (messages, listings) | Yes | Yes | No | App Functionality |
| **Device ID / Push Token** | Yes | Yes | No | App Functionality (notifications) |
| **Crash Data** | Yes | No | No | Analytics (Sentry) |
| **Performance Data** | Yes | No | No | Analytics (Sentry) |
| **Financial Info** | **No** | — | — | — |
| **Health & Fitness** | **No** | — | — | — |
| **Browsing History** | **No** | — | — | — |
| **Contacts** | **No** | — | — | — |
| **Search History** | **No** | — | — | — |

In App Store Connect:

1. Open the app → **App Privacy** in the left sidebar.
2. Click **Get Started** (or **Edit** if labels already exist).
3. For each row above marked **Yes**, add the data type, mark **Linked to user** = Yes/No as shown, **Used for tracking** = No across the board, and tick the matching purpose checkboxes.
4. **Save**. The labels propagate to the listing automatically.

> Skipping or fudging this is the #1 reason small apps get rejected. Match the table exactly.

---

## Step 2 — Fill the App Store version

In App Store Connect → **App Store** tab → click **+ Version** (top of the version list) and enter `1.0.0`.

Fill the new version page with:

### Localised metadata

For each of **English (Primary)**, **French**, **Dutch** copy from `docs/store-submission/store-listing-{en,fr,nl}.md`:

- **Name:** `BookSwap`
- **Subtitle:** value from listing (≤ 30 chars on Apple — the EN listing's subtitle is 79 chars; **shorten** to e.g. `Swap books with readers nearby` for Apple).
- **Promotional Text:** optional, can be edited post-release without re-review (use the English subtitle here).
- **Description:** full description from listing.
- **Keywords:** `books,swap,exchange,trade,reading,community,local,barcode,library,free` (≤ 100 chars, comma-separated).
- **Support URL:** `https://bookswap.app/support`
- **Marketing URL:** `https://bookswap.app`
- **Privacy Policy URL:** `https://bookswap.app/en/privacy-policy` (use the localised `/fr/` and `/nl/` URLs in their respective languages).

### What's New in This Version

```
Initial release of BookSwap! Browse books nearby, scan barcodes to list your
own, and swap with readers in your community.
```

Translations are in the FR / NL listing files.

### Screenshots & app preview

- Upload screenshot sets for 6.7", 6.5" (and 5.5" if available), 2–10 per device class.
- App preview videos optional; skip for v1.0.0.

### Build

- In the **Build** section click **+** → select the TestFlight build (1.0.0 (N), where N is the latest auto-incremented build number).
- If Apple asks for **Export Compliance** here, answer **No** (already declared via `ITSAppUsesNonExemptEncryption: false`).

### General App Information

- **Category:** Primary `Books`, Secondary `Social Networking`.
- **Content Rights:** select "Does not contain, show, or access third-party content."
- **Age Rating:** click **Edit** next to the rating, answer **None / No** to every row in the questionnaire (table in `store-listing-en.md` § Age Rating). Expected outcome: **4+**.

### App Review Information

- **Sign-in required:** Yes.
- **Demo account:**
  - Email: create one ahead of time on prod (`reviewer@bookswap.app` or similar). Seed with at least 1 owned book and 1 wishlist entry so the reviewer can exercise list/swap/chat.
  - Password: store in 1Password / vault; paste here.
- **Notes:**
  ```
  BookSwap is a free book-exchange community. To explore the app:
  1. Sign in with the demo credentials above.
  2. Tap the map tab to see nearby books (we have seeded sample listings around Brussels).
  3. Tap any book → "Request Swap" to start an exchange flow.
  4. Use the "Browse" tab + barcode scanner to add a new book.
  No purchases, ads, or external integrations require approval.
  ```
- **Contact:** your developer email + phone.

### Version Release

- Pick **Manually release this version** (recommended for v1.0.0 — gives you a moment to verify before users see it).

---

## Step 3 — Submit for review

1. Top-right of the version page → **Save** → **Add for Review**.
2. Confirm the export-compliance / advertising-identifier dialogues:
   - Export compliance: **No**.
   - IDFA / advertising identifier: **No** (BookSwap does not use IDFA).
3. Click **Submit to App Review**.

Status will move through: `Waiting for Review` → `In Review` → `Pending Developer Release` (if you chose manual release) → `Ready for Sale`.

Typical timeline: **24–48h**. First-time apps sometimes go to 72h.

---

## Step 4 — Watch while in review

For the duration of the review:

- [ ] Do not submit a new TestFlight build for the same version. If a critical fix is needed, ship via **OTA** (`yarn update:production`) — that doesn't affect the build under review.
- [ ] Keep the BookSwap Telegram channel open for prod alerts.
- [ ] Watch Sentry → `bookswap-mobile` → environment `production` for new issues.
- [ ] Keep the demo account alive and seeded.

If Apple emails a **rejection**:

| Common cause | Fix |
|---|---|
| Guideline 5.1.1 — privacy labels mismatch | Re-read §1 above, align labels to actual data, resubmit. |
| Guideline 4.0 — design / minimum functionality | Usually a copy or screenshot issue. Reply via Resolution Center with clarification. |
| Guideline 1.5 — sign-in needed but no demo account | Add / refresh the demo credentials in App Review Information. |
| Guideline 5.1.2 — sign-in with Apple required | Apple requires "Sign in with Apple" if any third-party social sign-in is offered. Confirm whether Google Sign-In counts (it does). If we ship Google Sign-In, we **must** ship Sign-in with Apple too. **Ship a new build** if so. |
| Crash on launch on reviewer device | Look at Sentry around the rejection timestamp; OTA the fix; reply with a short note in Resolution Center. |
| Privacy policy URL not reachable | Verify `https://bookswap.app/en/privacy-policy` from outside our network. |

Reply in Resolution Center with concrete remediation; resubmissions usually re-review in <24h.

---

## Step 5 — Release

When Apple approves and the status becomes `Pending Developer Release`:

1. Quick sanity pass:
   - [ ] Open Sentry → 0 fresh `bookswap-mobile` issues in last 12h.
   - [ ] Open `https://api.book-swaps.com/api/v1/health/` → 200.
   - [ ] BookSwap Telegram channel: no critical alerts in last 4h.
2. App Store Connect → version page → **Release This Version**.
3. App goes live within ~1 hour (sometimes faster).

### Post-release verification (first 2 hours)

- [ ] Search "BookSwap" on the App Store on a device — listing visible.
- [ ] Install on a non-developer Apple ID — onboarding works, can sign in, can list a book, can chat.
- [ ] Sentry release-health page shows the new install reporting sessions.
- [ ] Push notification arrives on the new install (use admin-side trigger).

### Post-release verification (first 24 hours)

- [ ] Crash-free session rate ≥ **99.5%** on `bookswap-mobile`.
- [ ] No spike in `BOOKSWAP-MOBILE-*` issues.
- [ ] BookSwap Telegram digest (every 4h) shows healthy growth.

If any of those are red, prepare an **OTA hotfix** (no store re-review needed for JS/TS-only changes) via `yarn update:production "fix: …"`.

---

## Update `PRODUCTION-READINESS.md` after release

When the App Store version goes live:

1. In `PRODUCTION-READINESS.md` → §10 Mobile Readiness → add a line under **In place**:
   `- iOS App Store production (2026-05-XX) — promoted from TestFlight, build 1.0.0 (N).`
2. In the **Next Actions** table, mark the soak P2 row as **Done** if crash-free ≥ 99.5% sustained.
3. Bump **Last reviewed** at the top.
4. Commit with `chore(docs): mark iOS App Store launch in PRODUCTION-READINESS`.

---

## Quick command reference

```bash
cd mobile

eas build:list --platform ios --limit 5

eas submit --platform ios --latest

yarn update:production "fix: <one-line description>"

eas update:list --branch production --limit 5
```

---

## Owner & escalation

- **Submission owner:** Gideon (operator).
- **If Apple review stalls > 7 days:** open an **Expedited Review Request** in App Store Connect → Resolution Center, reason "first launch, business commitment".
- **If a P0 bug is discovered during review:** OTA fix immediately; do not withdraw the submission unless the bug is in native code (then withdraw, build new, resubmit).
