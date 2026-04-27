# Google Maps API Key Setup for BookSwap Mobile

## 1. Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown at the top left
3. Click **New Project**
4. Name it `BookSwap` and click **Create**
5. Make sure the new project is selected in the dropdown

## 2. Enable Billing

Google requires a billing account for Maps APIs (you get **$200/month free credit**, which covers ~28,000 map loads — more than enough for development and small-scale production).

1. Go to **Billing** in the left sidebar
2. Click **Link a billing account**
3. Follow the prompts to add a payment method

## 3. Enable Required APIs

Go to **APIs & Services → Library** and enable each of these:

- [Maps SDK for Android](https://console.cloud.google.com/apis/library/maps-android-backend.googleapis.com)
- [Maps SDK for iOS](https://console.cloud.google.com/apis/library/maps-ios-backend.googleapis.com)

Click each link → click **Enable**.

## 4. Create an API Key

1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → API Key**
3. Copy the generated key

## 5. Add the Key to Your Project

Paste the key into `mobile/.env`:

```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...your_key_here
```

## 6. Restrict the Key (Do This Before Going to Production)

For **development**, you can skip restrictions and come back to this later. For production, restrict the key to prevent unauthorized usage.

### Find Your SHA-1 Fingerprint (Android)

Run this from the `mobile/` directory:

```bash
# Debug keystore (local development builds)
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android 2>/dev/null | grep SHA1

# If using EAS Build, get the fingerprint from EAS:
eas credentials --platform android
# Look for "SHA1 Fingerprint" in the output
```

### Apply Restrictions

1. Go to **APIs & Services → Credentials**
2. Click on your API key
3. Under **Application restrictions**:
   - **Android**: Select "Android apps" → Add:
     - Package name: `com.gnimoh.bookswap`
     - SHA-1: (paste from the command above)
   - **iOS**: Select "iOS apps" → Add:
     - Bundle ID: `com.gnimoh.bookswap`
4. Under **API restrictions**: Select "Restrict key" → check:
   - Maps SDK for Android
   - Maps SDK for iOS
5. Click **Save**

> **Tip**: You can create two separate keys — one for Android and one for iOS — each with its own platform restriction. This is more secure but optional.

## 7. Rebuild the App

The Google Maps key is embedded in the native build, so a JS-only reload won't pick it up. You need to rebuild:

```bash
cd mobile

# Clean prebuild and rebuild
npx expo prebuild --clean
npx expo run:ios
# or
npx expo run:android
```

## 8. Verify It Works

1. Open the app and go to the **Browse** tab
2. The map should now render with Google Maps (you'll notice the Google logo in the bottom left)
3. The custom dark green / light map style should be applied
4. Book markers should appear as golden circles with book icons
5. Changing the distance filter should show/hide the radius circle on the map

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Map shows grey tiles | Key is invalid or APIs not enabled — check the Cloud Console |
| Map works on iOS but not Android | SHA-1 restriction doesn't match your debug keystore |
| Map works on Android but not iOS | Bundle ID restriction doesn't match `com.gnimoh.bookswap` |
| Changes not taking effect | You need to rebuild (`npx expo prebuild --clean`) — env changes aren't hot-reloaded |
| `PROVIDER_GOOGLE` not recognized | Make sure `react-native-maps` is installed and you rebuilt the native app |
