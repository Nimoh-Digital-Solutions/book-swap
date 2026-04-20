# BookSwap — Build & Submit Runbook

Run these commands after completing all prerequisites in STORE-SETUP-GUIDE.md.

---

## Pre-flight Checklist

Before your first production build, verify:

- [ ] App created in App Store Connect with bundle ID `com.gnimoh.bookswap`
- [ ] App created in Google Play Console with package `com.gnimoh.bookswap`
- [ ] `eas.json` → `submit.production.ios.ascAppId` — set (`6762515297`)
- [ ] `eas.json` → `submit.production.ios.appleTeamId` — set (`Z68MT647CX`)
- [ ] Google service account JSON at `mobile/google-service-account.json` (gitignored)
- [ ] ASC API key `.p8` file stored or EAS credentials configured
- [ ] Google Sign-In OAuth client IDs created and set via `eas env:create --environment production`
- [ ] `mobile/app.json` version number is correct (`1.0.0` for first release)
- [ ] Privacy policy deployed at https://bookswap.app/en/privacy-policy

---

## Step 1: Build for Production

```bash
cd mobile

# iOS — builds IPA signed for App Store distribution
yarn build:ios:prod

# Android — builds AAB (Android App Bundle)
yarn build:android:prod
```

EAS manages signing automatically. First-time iOS build will prompt to
create distribution certificates and provisioning profiles.

Monitor builds at: https://expo.dev/accounts/info_nimoh/projects/bookswap/builds

---

## Step 2: Submit to Stores

### iOS → TestFlight

```bash
cd mobile
yarn submit:ios
# Uploads the latest production iOS build to App Store Connect
```

Alternative: download the .ipa from expo.dev and upload via the
[Transporter](https://apps.apple.com/app/transporter/id1450874784) macOS app.

After upload:
1. Go to App Store Connect → TestFlight
2. Wait for build processing (~5-15 minutes)
3. If prompted, answer the export compliance question (select "No" — we set
   `ITSAppUsesNonExemptEncryption: false` in app.json)
4. Add the build to an Internal Testing group
5. Invite testers by Apple ID email

### Android → Internal Testing

```bash
cd mobile
yarn submit:android
# Uploads the latest production AAB to Google Play Console (internal track)
```

Alternative: download the .aab from expo.dev and upload manually in Play Console.

After upload:
1. Go to Play Console → Testing → Internal testing
2. Create a new release if one wasn't auto-created
3. Add testers (by email list or Google Group)
4. Click "Start rollout to Internal testing"

---

## Step 3: Promote to Production

### iOS

1. In App Store Connect → App Store tab
2. Click **+** next to iOS App to create a new version
3. Fill in:
   - What's New text
   - Select the build from TestFlight
   - Upload screenshots for all required device sizes
   - Fill in description, keywords, support URL, privacy policy URL
   - Complete the age rating questionnaire
4. Click **Submit for Review**
5. Apple reviews typically take 24-48 hours

### Android

1. In Play Console → Production → Create new release
2. "Add from library" — select the AAB from internal testing
3. Fill in release notes
4. Ensure all store listing info is complete:
   - Main store listing (description, screenshots, feature graphic)
   - Content rating (IARC questionnaire)
   - Data safety form
   - Target audience
   - App category
5. Click **Start rollout to Production**
6. Google reviews typically take a few hours to 7 days for first-time apps

---

## Step 4: Post-Launch OTA Updates

For JavaScript-only changes (no new native modules or permissions):

```bash
cd mobile

# Push to staging first
yarn update:staging "fix: description of change"

# After testing, push to production
yarn update:production "fix: description of change"
```

Native changes require a full build + store review cycle.

---

## Troubleshooting

### iOS build fails with signing error
```bash
eas credentials --platform ios
# Re-configure certificates and provisioning profiles
```

### Android build fails with keystore error
```bash
eas credentials --platform android
# EAS manages the keystore automatically; re-generate if needed
```

### Submit rejected: missing compliance
Ensure `ITSAppUsesNonExemptEncryption` is set to `false` in `app.json`
(already configured).

### Submit rejected: missing privacy policy
Deploy the privacy policy page and verify the URL is accessible.
