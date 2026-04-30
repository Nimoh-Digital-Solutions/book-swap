# Android Google Sign-In Setup — Google Play App Signing

## The Core Concept

When you distribute via Google Play, there are **two different signing keys**:

| Key | SHA-1 source | What it signs |
|---|---|---|
| **Upload key** | Your EAS keystore (`eas credentials`) | What you upload to Google Play |
| **App signing key** | Google's managed key (Play Console) | What gets installed on user devices |

Google Play **re-signs your APK** with their own key before distributing it. This means the SHA-1 on a user's installed app is **Google's SHA-1**, not your EAS keystore SHA-1.

**Google OAuth Sign-In validates against the installed certificate.** So you must register Google's SHA-1 — not the EAS one.

---

## Where to Find the Correct SHA-1

1. Go to [Google Play Console](https://play.google.com/console) → your app
2. Left menu → **Test and release** → **App integrity**
3. Click **Settings** next to "Play app signing"
4. Copy the **App signing key certificate → SHA-1 certificate fingerprint**

This is the SHA-1 to register in Google Cloud Console for Google Sign-In.

> The **Upload key certificate** SHA-1 is only used to register the upload key with API providers that need to verify updates come from you — it is NOT used for Google Sign-In on production Play Store builds.

---

## BookSwap SHA-1 Reference

| Key | SHA-1 |
|---|---|
| App signing key (Google — use for OAuth) | `49:5B:84:9A:95:15:7A:57:2A:36:62:12:27:30:25:CE:93:A7:5E:C6` |
| Upload key (EAS keystore) | `55:8D:92:CD:E9:4B:C0:5D:5B:08:EC:6D:94:71:E1:EC:0B:E2:C6:D1` |

---

## Google Cloud Console Setup

For every Android app using Google Sign-In distributed via Google Play, you need **two Android OAuth 2.0 clients** in Google Cloud Console:

| Client name | SHA-1 | Purpose |
|---|---|---|
| `BookSwap - Android - OAuth` (dev) | Debug/EAS dev keystore SHA-1 | Development and staging builds |
| `BookSwap - Android OAuth - Production` | Google Play app signing SHA-1 | Production Play Store builds |

### Steps
1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. **+ Create Credentials** → OAuth 2.0 Client ID
3. Application type: **Android**
4. Package name: `com.gnimoh.bookswap`
5. SHA-1: paste the **App signing key** SHA-1 from Play Console
6. Save

The app code uses only the **Web Client ID** (`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`). The Android client IDs are purely server-side whitelisting — they never appear in your app code.

---

## OAuth Consent Screen

The OAuth consent screen must be set to **"In production"** for any user to sign in. If left in **"Testing"** mode, only manually added test users can authenticate — everyone else gets a silent failure.

- Go to [Google Cloud Console → Auth → Audience](https://console.cloud.google.com/auth/audience)
- Publishing status must be **"In production"**
- For apps using only `email` and `profile` scopes: Google approves instantly, no review needed

---

## Checklist for a New App

- [ ] Build and submit to Google Play (any track)
- [ ] Go to Play Console → App integrity → Settings → copy **App signing key SHA-1**
- [ ] Create Android OAuth 2.0 client in Google Cloud Console with that SHA-1
- [ ] Set OAuth consent screen to **"In production"**
- [ ] Set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` to the **Web Application** client ID in EAS env
- [ ] Wait 5–10 minutes for propagation, then test

---

## Debugging Sign-In Failures

| Symptom | Cause | Fix |
|---|---|---|
| "Sign in failed" — no backend logs | SHA-1 mismatch or consent screen in Testing | Check both |
| Error before account picker appears | Wrong or missing SHA-1 | Register correct SHA-1 |
| Works on staging, fails on production | EAS SHA-1 registered instead of Google Play SHA-1 | Use App signing key SHA-1 from Play Console |
| Works for some users, fails for others | Consent screen in Testing mode | Publish the OAuth app |
| Backend returns error | SHA-1 is fine, backend rejected the ID token | Check backend Google auth config |
