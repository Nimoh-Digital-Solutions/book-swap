# BookSwap — Google Play Production Promotion

**Goal:** promote the existing **internal-testing** AAB of BookSwap **1.0.0 (versionCode 9)** to the public **Google Play Production** track.

**State today (2026-05-03):**
- Android AAB `1.0.0 (9)` already on the **Internal Testing** track, tested OK on at least one real device.
- Production track is **empty** — no release ever pushed.
- All 5 Play Console required listing items (main store listing, content rating, data safety, target audience, app category) are **not yet completed** — these are hard blockers and the bulk of tomorrow's work.
- iOS counterpart (`1.0.0 (8)`) is in Apple's review queue (see `docs/RELEASE-DAY-RUNBOOK.md`). Play and App Store will likely go live within 24–48h of each other.
- Backend points at `https://api.book-swaps.com` (prod). Same OTA hotfixes as iOS are already baked into the AAB.

**Estimated wall-clock:**
- ~2–3 hours of operator work in Play Console (mostly the listing items the first time).
- Google review: median ~24h for established apps; **first-time apps and first-time developer accounts often take 3–7 days**.
- Total: 1–7 days from "click submit" to "live on Google Play".

**Strategy chosen:** Skip extra testing tracks; promote internal-track AAB directly to Production.

---

## Pre-flight (do not skip)

Run through this checklist **before** opening Play Console. Every item should be a one-line yes/no.

### 1. Build & metadata ready

- [ ] Play Console app exists with package name `com.gnimoh.bookswap`.
- [ ] Internal Testing track has the **1.0.0 (versionCode 9)** AAB (released 2026-04-30 from EAS build `11814a1d-0ecd-4261-87fa-06e7e9068163`).
- [ ] You have opened the app from internal testing on at least one real Android device in the last 24h with no crash.
- [ ] `mobile/google-service-account.json` exists locally (already gitignored). You only need this if you plan to upload via `eas submit` instead of the web UI — for the manual promote-from-internal-track flow used here, it's not needed.

### 2. Sentry quiet window (the launch gate)

Same gate as iOS: before clicking *Send for review*, no fresh Sentry errors on `bookswap-mobile` Android in the last **24h**.

- [ ] In Sentry → Issues → filter `is:unresolved environment:production project:bookswap-mobile platform:android`. If anything has a fresh event in the last 24h, **do not promote yet** — investigate and OTA-fix first (the OTA channel is `production`, runtime version `1.0.0`, same as iOS).

### 3. Privacy policy + support URLs are reachable

- [ ] `https://book-swaps.com/en/privacy-policy/` returns 200 (verified 2026-05-03).
- [ ] `https://book-swaps.com/en/support` returns 200.
- [ ] EN/FR/NL localised privacy URLs resolve: `https://book-swaps.com/{en,fr,nl}/privacy-policy/`.

### 4. Required listing assets are ready

You need these files staged before opening Play Console — uploading is much faster than tab-switching to find them:

- [ ] **App icon** — 512×512 PNG (32-bit, < 1 MB). Source: `mobile/assets/icon.png` resized.
- [ ] **Feature graphic** — 1024×500 JPG/PNG (no transparency, no alpha channel). This is the banner shown above the screenshots in the listing. **Required for Play, was not required for iOS** — you may need to design this if it doesn't exist yet.
- [ ] **Phone screenshots** — minimum 2, max 8. Recommended: same 9 EN screenshots already uploaded to App Store Connect at `mobile/assets/apple-submission/`. Play accepts them at any aspect ratio between 16:9 and 9:16 (your iOS shots at 1284×2778 are 9:19.5 — perfectly fine).
- [ ] **(Optional but high-conversion)** 7-inch tablet screenshots, 10-inch tablet screenshots — skip these if you don't have iPad-sized ones; the listing reads fine with phone-only shots.
- [ ] **Localised store listings** ready to paste — see `docs/store-submission/store-listing-{en,fr,nl}.md`. **Verify each has been updated to use `book-swaps.com` (not `bookswap.app`)** — this was an issue on iOS that needs to stay fixed.

---

## Step-by-step: tomorrow morning

### Phase 1 — Complete the 5 required listing items (~2h)

Open Play Console → BookSwap → **Dashboard**. Look at the *"Set up your app"* checklist on the right — it shows exactly what's missing with a yellow dot per item. Work through them in this order; later steps depend on earlier ones being saved.

#### 1.1 Main store listing (~30 min)

Navigate: *Grow* → *Store presence* → *Main store listing*.

| Field | Value | Source |
|---|---|---|
| App name | `BookSwap` (or `BookSwap - Trade Books` if taken) | match iOS |
| Short description (80 char max) | `Swap books with readers nearby` | already drafted |
| Full description (4000 char max) | Paste from `store-listing-en.md` | already drafted |
| App icon | 512×512 PNG | from pre-flight |
| Feature graphic | 1024×500 PNG | from pre-flight |
| Phone screenshots | 4–8 images | reuse iOS set |
| Video (optional) | YouTube URL | skip for v1 |

After saving English, click the language dropdown at the top → **Add language** → `Français (France)` → paste from `store-listing-fr.md`. Repeat for `Nederlands (Belgium)` from `store-listing-nl.md`.

⚠ **Common gotcha:** Play Console silently truncates the short description at 80 chars. The drafted "Swap books with readers nearby" is 30 chars — fine.

#### 1.2 App access (~5 min)

Navigate: *Test and release* → *App content* → *App access*.

- Select **All or some functionality is restricted** (login required for most features).
- Provide demo credentials so Google's reviewer can sign in:
  - Username: `reviewer@bookswaps.com`
  - Password: *(the same password you gave Apple — ASC reviewer notes should still have it)*
  - Instructions: *"Email/password login. After login, the home tab shows nearby books; tap any book → Request Swap to test the exchange flow. The reviewer account has 1 listed book and 1 saved book."*

#### 1.3 Ads (~1 min)

Navigate: *App content* → *Ads*.

- Select **No, my app does not contain ads.**

#### 1.4 Content rating (~10 min)

Navigate: *App content* → *Content rating* → *Start questionnaire*.

- Email: your dev account email.
- Category: **Social** (or *Reference, News, or Educational* — Social is the closer fit for swap/messaging).
- Walk through the IARC questionnaire. For BookSwap, all answers should be **No** to violence, sexual content, profanity, drugs, gambling, user-generated content moderation concerns, etc. — *except* "Does your app allow users to interact?" → **Yes** (chat + exchanges).
- Result will be **Everyone** / **PEGI 3** / **ESRB Everyone** — same as Apple's 4+ rating.
- Click *Submit*.

#### 1.5 Target audience (~5 min)

Navigate: *App content* → *Target audience and content*.

- Target age groups: **18 and over** (matches the iOS 17+ rating you set, and avoids COPPA/Family Policy complications).
- Appeals to children: **No**.

#### 1.6 News app declaration (~30 sec)

Navigate: *App content* → *News apps*.

- Select **No, my app is not a news app.**

#### 1.7 COVID-19 contact tracing (~30 sec)

Navigate: *App content* → *COVID-19 contact tracing and status apps*.

- Select **My app is not a publicly available COVID-19 contact tracing or status app.**

#### 1.8 Data safety (~30 min — most fiddly)

Navigate: *App content* → *Data safety*.

This is the Play equivalent of the Apple Privacy Labels you filled out. Play's UI is more granular but covers the same data. Walk through each section:

| Section | Answer |
|---|---|
| Does your app collect or share user data? | **Yes** |
| Is all data collected encrypted in transit? | **Yes** (HTTPS everywhere) |
| Do you provide a way for users to request data deletion? | **Yes** — `Profile → Delete account` (matches GDPR / DPIA) |

Then for each data type, declare collection / sharing / purpose. Use this table — derived directly from the iOS App Privacy answers + DPIA:

| Data type | Collected? | Shared? | Purpose | Linked to user? |
|---|---|---|---|---|
| Name | Yes | No | App functionality | Yes |
| Email address | Yes | No | App functionality, Account management | Yes |
| User IDs | Yes | No | App functionality | Yes |
| Approximate location | Yes | No | App functionality (find nearby books) | Yes |
| Precise location | Yes | No | App functionality (`ACCESS_FINE_LOCATION` is requested for accurate map pinning) | Yes |
| Photos | Yes | No | App functionality (book covers, avatars) | Yes |
| Messages (in-app chat) | Yes | No | App functionality | Yes |
| Crash logs | Yes | No | Analytics | No (Sentry PII scrub) |
| Diagnostics (performance) | Yes | No | Analytics | No |
| Device or other IDs (push token) | Yes | No | App functionality (push notifications) | Yes |

⚠️ **Manifest permissions actually requested by the AAB** (verified from `mobile/app.json`): `CAMERA`, `READ_MEDIA_IMAGES`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `USE_BIOMETRIC`, `USE_FINGERPRINT`. Background location is **NOT** requested — confirm by saying "Foreground only" in the location justification. Camera + media library are for ISBN scanning + book photo upload — both linkable to the user's own listings.

Save and complete. Play then auto-generates a "data safety" public summary on your store page.

#### 1.9 Government apps (~30 sec)

Navigate: *App content* → *Government apps*.

- Select **My app is not made on behalf of a government.**

#### 1.10 Financial features (~30 sec)

Navigate: *App content* → *Financial features*.

- Select **My app does not provide any financial features.**

#### 1.11 Health (~30 sec)

Navigate: *App content* → *Health*.

- Select **No** to all health/medical questions.

#### 1.12 Trader status (DSA — required for EU launches) (~5 min)

Navigate: *App content* → *Trader status*.

- Select **Yes, I am a trader** (same as the App Store DSA disclosure).
- Provide:
  - Legal name: same legal entity used in App Store DSA.
  - Address: same.
  - Email: contact email used for ASC trader info.
  - Phone: same.
  - Website: `https://book-swaps.com`

#### 1.13 Privacy policy URL (~30 sec)

Navigate: *Grow* → *Store presence* → *Main store listing* → scroll to *Privacy policy*.

- URL: `https://book-swaps.com/en/privacy-policy/`
- ⚠️ **Use `book-swaps.com`, NOT `bookswap.app`** — the latter does not resolve and was the same bug we hit on the App Store.

### Phase 2 — Promote the internal AAB to Production (~10 min)

Navigate: *Test and release* → *Production* → *Create new release*.

#### 2.1 Pull the existing AAB from the Internal track

- Click **Add from library** at the top right of the Releases section.
- Select the AAB version **1.0.0 (9)** — this is the same one currently on Internal testing. Play makes you do this explicitly because it's a one-way promotion (you can't move it back to Internal once it's gone to Production).
- Confirm.

#### 2.2 Release name & notes

- **Release name** auto-fills as `1.0 (9)` — leave it.
- **What's new in this release** — paste the localised release notes from `docs/launch/launch-announcements.md` (the EN/FR/NL release notes section). Play has a 500-char limit per language, so keep it short. Suggested first-version copy:
  ```
  Welcome to BookSwap — the easiest way to swap books with readers nearby.
  Browse books on a map, request swaps, chat with the owner, and meet up. Free, no ads, no tracking.
  ```

#### 2.3 Countries / regions

- Default is "all countries" — same intent as the iOS "GLOBAL minus problem countries" choice.
- Click *Manage countries* → ensure that **China, Russia, North Korea, Iran, Cuba, Syria** are excluded (same list as App Store; Play will pre-exclude some of these by default).
- Save.

#### 2.4 Rollout %

- Set rollout to **100%** (full release). For a v1.0 launch with no installed userbase, gradual rollout adds no value — the userbase is empty.
- Alternative if you're nervous: 20% rollout for 24h, then bump to 100%. Reasonable but pointless when no one has the app yet.

#### 2.5 Review & submit

- Click *Save* → *Review release*.
- Play will validate:
  - All required listing items complete ✓ (you just filled them)
  - AAB has correct signing ✓
  - Permissions match data safety form
- If anything is missing it'll show a yellow warning per item — fix and retry.
- Click *Send for review* (the actual submit button is on the *Publishing overview* page that appears after *Review release*).

You're done. The app is now in Google's review queue.

---

## What happens after submit

### Status flow

| Play Console status | Meaning | Typical time |
|---|---|---|
| `In review` | Google is automatically + manually checking the AAB | 1h – 7 days (median ~24h) |
| `Pending publication` | Approved, propagating to global servers | 30 min – 4h |
| `Published` | Live on Play Store | — |
| `Rejected` | Action required | — |

### Where you'll find out

- **Email:** Google sends a status email per transition (better than Apple's — more granular).
- **Telegram:** ⚠️ The current Pi monitoring loop only watches the **App Store** side (`bookswap-asc-review-monitor.sh`). There is no Play-side equivalent yet. Two options:
  - Just check Play Console manually each morning during the review window.
  - (Future) Add a `bookswap-play-monitor.sh` using the Google Play Developer Reporting API. Out of scope for tomorrow.

### When approved

1. Click *Release* on the *Publishing overview* page (only required if you have manual publishing turned on; default is auto-publish on approval).
2. Wait ~30 min – 4h for `Pending publication` → `Published`.
3. Run a **public availability check**: search for "BookSwap" in the Play Store on a real Android device.
4. Run the launch-day announcements (`docs/launch/launch-announcements.md`) — replace the App Store URL placeholder in each post with both stores once both are live, or post the iOS link first and edit the post later when Android lands.
5. The shareable Play URL is `https://play.google.com/store/apps/details?id=com.gnimoh.bookswap`.

### Rollback / pulling the release

If something blows up post-launch:

```
Play Console → Production → "Halt rollout"
```

This stops new downloads but doesn't uninstall from existing users' devices. To push a fix:
- For JS-only fixes: `eas update --branch production` (same as iOS — same caveat about "don't OTA mid-review").
- For native fixes: bump versionCode → `eas build` → `eas submit` → re-promote.

---

## Common rejection reasons (Google-specific)

These are the rejection patterns first-time Play apps hit most often:

| Reason | Fix |
|---|---|
| **Data safety form mismatch with manifest permissions** | Most common. The AAB declares permissions (camera, location, notifications, contacts) the form doesn't list. Cross-check `mobile/app.json` `permissions:` array against the data safety table above. |
| **Privacy policy URL not reachable / doesn't mention all collected data types** | Same gate as ASC. Verify the privacy policy at `book-swaps.com/en/privacy-policy/` lists everything in the data safety table. |
| **Account creation but no account deletion in-app** | Required since 2024. BookSwap has it (`Profile → Delete account`). Mention this explicitly in *App access* reviewer notes. |
| **Trader status not declared (DSA)** | EU-specific. Always declare trader status — Google rejects EU launches without it now. |
| **Misleading metadata** | Don't claim features you don't have ("AI-powered", "OCR", "ChatGPT integration"). Stick to the drafted copy. |
| **Background location** | If the app requests `ACCESS_BACKGROUND_LOCATION` Google requires extensive justification + a video walkthrough. BookSwap should NOT need this — verify `mobile/app.json` doesn't request it. (Foreground location is fine.) |
| **API target level** | Play requires apps to target Android 14 (API 34) or higher as of August 2024. EAS should already be on this — verify in `mobile/app.json` `android.targetSdkVersion` if anything is flagged. |

---

## Per-row mapping: iOS App Store Connect → Play Console

For items where you already filled an iOS equivalent, here's the direct mapping so you can copy-paste:

| App Store Connect | Google Play Console |
|---|---|
| App name | App name |
| Subtitle | Short description (Play allows 80 chars vs iOS's 30 — can be more descriptive) |
| Promotional Text | (none — Play's "What's new in this release" is the closest analog) |
| Description | Full description |
| Keywords | (none — Play uses ML on the description; sprinkle relevant words naturally) |
| App Privacy data types | Data safety form |
| Age Rating questionnaire | Content rating questionnaire (IARC) |
| Demo Account | App access → Demo credentials |
| Privacy Policy URL | Privacy policy URL |
| Trader info (DSA) | Trader status |
| Localizations (en, fr, nl) | Add language (en-US, fr-FR, nl-BE) |

---

## Useful URLs

- Play Console — BookSwap: https://play.google.com/console/u/0/developers
- App's public listing (post-launch): https://play.google.com/store/apps/details?id=com.gnimoh.bookswap
- Play Developer Policy Center: https://support.google.com/googleplay/android-developer/topic/9858052
- Data Safety form requirements: https://support.google.com/googleplay/android-developer/answer/10787469
- Submit a question to Google review (after rejection): Play Console → Policy status → tap the rejection → *Contact support*

---

## What's NOT needed (despite what older docs say)

A few things older docs in this repo mention that are not blockers:

- **`eas submit` from CLI** — only needed if you want to upload a *new* AAB. We're promoting an *existing* internal-track AAB, which is a Play Console UI operation. No CLI needed.
- **`google-service-account.json`** — only used by `eas submit`. Safe to keep on disk for future submissions; not used for this promotion.
- **Internal app sharing** — that's the developer-only sideload mechanism, not required for production.
- **Bundle ID change** — your package is `com.gnimoh.bookswap`, locked since the first AAB upload. Cannot be changed; don't try.
- **Production track AAB upload** — the AAB is already uploaded to Internal Testing. Promotion uses the same AAB, no rebuild.

---

**Source:** This runbook lives at `docs/store-submission/GOOGLE-PLAY-PROMOTION.md`. Update with rejection reasons and remediation steps after the first review cycle so the second time is faster.
