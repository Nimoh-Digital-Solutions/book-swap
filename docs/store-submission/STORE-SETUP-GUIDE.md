# BookSwap — Store Setup Guide

Step-by-step instructions for registering BookSwap in Apple App Store Connect
and Google Play Console. Follow each section in order.

---

## 1. Apple App Store Connect

### 1a. Register the App ID

1. Go to <https://developer.apple.com/account/resources/identifiers/list>
2. Click **+** to register a new identifier
3. Select **App IDs** → **App**
4. Fill in:
   - **Description:** BookSwap
   - **Bundle ID (Explicit):** `com.gnimoh.bookswap`
5. Under **Capabilities**, enable:
   - **Sign In with Apple**
   - **Push Notifications**
   - **Associated Domains** (for future deep links)
6. Click **Continue** → **Register**

### 1b. Create the App in App Store Connect

1. Go to <https://appstoreconnect.apple.com/apps>
2. Click **+** → **New App**
3. Fill in:
   - **Platforms:** iOS
   - **Name:** BookSwap
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** Select `com.gnimoh.bookswap` from the dropdown
   - **SKU:** `bookswap-ios`
   - **User Access:** Full Access
4. Click **Create**

### 1c. Generate an App Store Connect API Key

This is needed for `eas submit` to upload builds automatically.

1. Go to <https://appstoreconnect.apple.com/access/integrations/api>
2. Click **Generate API Key**
3. Name: `EAS Submit`
4. Access: **App Manager** (minimum needed for uploads)
5. Download the `.p8` file — you can only download it once
6. Note the **Key ID** and **Issuer ID** shown on the page
7. Store as EAS secrets:

```bash
cd mobile
eas secret:create --scope project --name ASC_API_KEY_ID --value "<your-key-id>"
eas secret:create --scope project --name ASC_API_KEY_ISSUER_ID --value "<your-issuer-id>"
# The .p8 key is passed via eas.json ascApiKeyPath or interactively
```

### 1d. Push Notification Certificate (APNs)

EAS manages this automatically when you run your first iOS build. During the
build, EAS will prompt to create the APNs key if one doesn't exist. No manual
action needed — just confirm when prompted.

---

## 2. Google Play Console

### 2a. Create the App

1. Go to <https://play.google.com/console>
2. Click **All apps** → **Create app**
3. Fill in:
   - **App name:** BookSwap
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free
4. Accept the declarations and click **Create app**

### 2b. Set Up a Service Account (for automated uploads)

1. Go to <https://console.cloud.google.com/iam-admin/serviceaccounts>
2. Select the project linked to your Play Console (or create one)
3. Click **Create Service Account**
   - Name: `eas-play-submit`
   - Role: skip for now (permissions come from Play Console)
4. Click **Done**
5. Click on the new service account → **Keys** → **Add Key** → **Create new key** → **JSON**
6. Download the JSON file. Keep it safe.
7. Go back to Play Console: **Setup** → **API access**
8. Link the Google Cloud project if not already linked
9. Find the service account → click **Manage Play Console permissions**
10. Grant: **Releases** → all sub-permissions (create/edit/release)
11. Click **Invite user** → **Done**
12. Store as EAS secret:

```bash
cd mobile
eas secret:create --scope project --name GOOGLE_SERVICE_ACCOUNT_KEY \
  --type file --value ./path-to-service-account.json
```

### 2c. Complete the App Dashboard Checklist

Google requires these before you can publish any release:

- [ ] **Privacy policy** — URL to your privacy policy (see Section 4 below)
- [ ] **App access** — Does your app need login? If yes, provide test credentials
- [ ] **Ads** — Does your app contain ads? (No for BookSwap)
- [ ] **Content rating** — Complete the IARC questionnaire
- [ ] **Target audience** — Select age group (13+ for BookSwap — social features)
- [ ] **Data safety** — Declare what data you collect (see Section 5 below)
- [ ] **Government apps** — Not a government app
- [ ] **Financial features** — No financial features

---

## 3. Google Sign-In OAuth Setup

### 3a. Create OAuth Credentials

1. Go to <https://console.cloud.google.com/apis/credentials>
2. Click **Create Credentials** → **OAuth client ID**
3. Create **three** client IDs:

**Web client** (used by the backend):
- Application type: Web application
- Authorized redirect URIs: `https://api.bookswap.app/api/v1/auth/google/callback/`

**iOS client:**
- Application type: iOS
- Bundle ID: `com.gnimoh.bookswap`
- Note the **Client ID** — you need the reversed version for `iosUrlScheme`
  - If client ID is `123456789-abcdef.apps.googleusercontent.com`
  - The reversed URL scheme is `com.googleusercontent.apps.123456789-abcdef`

**Android client:**
- Application type: Android
- Package name: `com.gnimoh.bookswap`
- SHA-1 fingerprint: get this from EAS:
  ```bash
  eas credentials --platform android
  # Look for the SHA-1 certificate fingerprint
  ```

### 3b. Update app.json

Replace the placeholder in `mobile/app.json`:
```json
["@react-native-google-signin/google-signin", {
  "iosUrlScheme": "com.googleusercontent.apps.<YOUR-ACTUAL-IOS-CLIENT-ID>"
}]
```

### 3c. Store Client IDs as Environment Variables

```bash
cd mobile
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "<web-client-id>"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value "<ios-client-id>"
```

---

## 4. Privacy Policy

A privacy policy URL is required by both stores. The privacy policy for
BookSwap is available at:

**URL:** `https://bookswap.app/privacy`

If you haven't deployed it yet, you can use:
- A page on your website
- A GitHub Pages URL
- A Notion public page (temporary)

The privacy policy must cover:
- What data you collect (email, name, location, photos, device info)
- How you use it (matching users for book swaps, communication)
- Third-party services (Sentry, Expo push, Google Sign-In, Apple Sign-In)
- Data retention and deletion (account deletion feature exists)
- Contact information

---

## 5. Google Play Data Safety Declarations

For the Data Safety form in Google Play Console, here's what BookSwap collects:

| Data type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| Email address | Yes | No | Account creation, notifications |
| Name | Yes | Yes (other users see it) | User profile |
| User IDs | Yes | No | Authentication |
| Approximate location | Yes | Yes (city-level to other users) | Finding nearby books |
| Precise location | Yes | No | Map features (not shared) |
| Photos | Yes | Yes (book photos, avatar) | Book listings, profile |
| App interactions | Yes | No | Analytics, crash reports |
| Crash logs | Yes | No | Sentry error tracking |
| Device identifiers | Yes | No | Push notifications |

**Encryption in transit:** Yes (HTTPS)
**Deletion mechanism:** Yes (in-app account deletion)

---

## 6. Build and Submit Commands

Once all the above is set up:

```bash
cd mobile

# iOS: Build → Submit to TestFlight
yarn build:ios:prod
eas submit --platform ios --profile production --latest

# Android: Build → Submit to Internal Testing
yarn build:android:prod
eas submit --platform android --profile production --latest
```

The `--latest` flag picks up the most recent production build automatically.
