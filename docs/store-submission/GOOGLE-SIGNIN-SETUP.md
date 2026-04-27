# BookSwap — Google Sign-In OAuth Setup

Step-by-step guide to configure Google Sign-In for the BookSwap mobile app
(iOS + Android) and backend.

---

## Prerequisites

- Access to [Google Cloud Console](https://console.cloud.google.com) for the
  **bookswap-493613** project
- An OAuth consent screen already configured (if not, do Step 0 first)
- The Android SHA-1 signing certificate fingerprint (obtained from EAS)

---

## Step 0: Configure OAuth Consent Screen (if not done)

1. Go to <https://console.cloud.google.com/apis/credentials/consent?project=bookswap-493613>
2. Select **External** user type → **Create**
3. Fill in:
   - **App name:** BookSwap
   - **User support email:** your email
   - **Developer contact email:** your email
4. Click **Save and Continue** through Scopes (defaults are fine — we only need
   `openid`, `email`, `profile`)
5. Click **Save and Continue** through Test Users (skip for now)
6. Click **Back to Dashboard**

---

## Step 1: Get the Android SHA-1 Fingerprint

Run this command to retrieve the signing certificate fingerprint that Google
needs for the Android OAuth client:

```bash
cd mobile
eas credentials --platform android
```

Look for the **SHA-1 certificate fingerprint** in the output. Copy it — you'll
need it in Step 2c.

It will look something like:
```
SHA-1 Fingerprint: AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD
```

---

## Step 2: Create OAuth 2.0 Client IDs

Go to: <https://console.cloud.google.com/apis/credentials?project=bookswap-493613>

Click **+ Create Credentials** → **OAuth client ID** for each of the three
clients below.

### 2a. Web Client (used by the backend)

| Field                      | Value                                                      |
|----------------------------|------------------------------------------------------------|
| Application type           | **Web application**                                        |
| Name                       | `BookSwap Web`                                             |
| Authorized redirect URIs   | `https://api.book-swaps.com/api/v1/auth/google/callback/`   |

After creation, note the **Client ID** and **Client secret**.

### 2b. iOS Client

| Field              | Value                     |
|--------------------|---------------------------|
| Application type   | **iOS**                   |
| Name               | `BookSwap iOS`            |
| Bundle ID          | `com.gnimoh.bookswap`     |

After creation, note the **Client ID**. It will look like:
```
123456789012-abcdefghijklmnop.apps.googleusercontent.com
```

The **reversed URL scheme** (needed for `iosUrlScheme`) is derived by taking
the part before `.apps.googleusercontent.com` and prepending
`com.googleusercontent.apps.`:
```
com.googleusercontent.apps.123456789012-abcdefghijklmnop
```

### 2c. Android Client

| Field              | Value                                          |
|--------------------|------------------------------------------------|
| Application type   | **Android**                                    |
| Name               | `BookSwap Android`                             |
| Package name       | `com.gnimoh.bookswap`                          |
| SHA-1 fingerprint  | *(paste the fingerprint from Step 1)*          |

After creation, note the **Client ID**.

---

## Step 3: Store Client IDs in EAS Environment Variables

These env vars are read at build time by `app.config.js` and at runtime by
the Google Sign-In SDK.

```bash
cd mobile

# Web client ID (used by the mobile SDK to verify tokens)
eas env:create --scope project --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID \
  --value "<WEB-CLIENT-ID>" --environment production

# iOS client ID (used to generate the iosUrlScheme)
eas env:create --scope project --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID \
  --value "<IOS-CLIENT-ID>" --environment production
```

Replace `<WEB-CLIENT-ID>` and `<IOS-CLIENT-ID>` with the actual client IDs
from Step 2a and 2b.

> **Note:** If `eas env:create` complains the variable already exists, use
> `eas env:update` instead.

---

## Step 4: Update Local `.env` File

Also add them to your local `.env` so dev builds work:

```bash
# mobile/.env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<WEB-CLIENT-ID>
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=<IOS-CLIENT-ID>
```

---

## Step 5: Update Backend Environment

The backend needs the **Web client ID** and **Client secret** to verify
Google tokens server-side:

```bash
# In your backend .env or environment config:
GOOGLE_OAUTH_CLIENT_ID=<WEB-CLIENT-ID>
GOOGLE_OAUTH_CLIENT_SECRET=<WEB-CLIENT-SECRET>
```

---

## Step 6: Verify the Configuration

After setting the env vars, `app.config.js` will automatically:
1. Read `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
2. Derive the reversed URL scheme
3. Inject it into the `@react-native-google-signin/google-signin` plugin config

You can verify it locally:

```bash
cd mobile
npx expo config --type public | grep -A2 "google-signin"
```

---

## Step 7: Rebuild and Submit

Once all credentials are in place:

```bash
cd mobile

# Rebuild with the correct Google Sign-In config baked in
eas build --platform all --profile production

# Submit after builds finish
yarn submit:ios
yarn submit:android
```

---

## Summary of Client IDs

| Client           | Where it's used                          | Env var                              |
|------------------|------------------------------------------|--------------------------------------|
| Web client ID    | Backend token verification, mobile SDK   | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`   |
| Web secret       | Backend only                             | `GOOGLE_OAUTH_CLIENT_SECRET`         |
| iOS client ID    | `iosUrlScheme` in app config             | `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`   |
| Android client   | Auto-matched by package name + SHA-1     | *(not needed as env var)*            |

---

## Troubleshooting

- **"URL schemes not in correct format"** during App Store submission →
  `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` was empty during build. Set it and rebuild.
- **Google Sign-In returns error 10** on Android → SHA-1 fingerprint mismatch.
  Re-check with `eas credentials --platform android`.
- **Google Sign-In returns error 12501** → User cancelled. Not an error.
- **"DEVELOPER_ERROR"** → Client ID mismatch between app and Google Cloud
  project. Double-check all three client IDs match.
