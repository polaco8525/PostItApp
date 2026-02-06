# Google Drive Integration Setup

This document explains how to configure Google Drive sync for the PostItApp.

## Prerequisites

1. A Google Cloud Platform account
2. A project in Google Cloud Console

## Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API:
   - Go to APIs & Services > Library
   - Search for "Google Drive API"
   - Click Enable

### 2. Configure OAuth Consent Screen

1. Go to APIs & Services > OAuth consent screen
2. Select "External" user type
3. Fill in the required information:
   - App name: PostItApp
   - User support email: your email
   - Developer contact: your email
4. Add scopes:
   - `https://www.googleapis.com/auth/drive.appdata`
   - `https://www.googleapis.com/auth/drive.file`
5. Add test users if in testing mode

### 3. Create OAuth 2.0 Credentials

1. Go to APIs & Services > Credentials
2. Click "Create Credentials" > "OAuth client ID"
3. Create credentials for each platform:

#### For Android:
- Application type: Android
- Package name: `com.postitapp` (or your package name)
- SHA-1 certificate fingerprint:
  ```bash
  # Debug keystore
  keytool -keystore ~/.android/debug.keystore -list -v -alias androiddebugkey -storepass android -keypass android

  # Release keystore
  keytool -keystore your-release-key.keystore -list -v -alias your-alias
  ```

#### For iOS:
- Application type: iOS
- Bundle ID: `com.postitapp` (or your bundle ID)

#### For Web (required for some flows):
- Application type: Web application
- Authorized JavaScript origins: (leave empty for mobile)
- Authorized redirect URIs: (leave empty for mobile)

### 4. Update App Configuration

1. Open `src/services/googleAuth.ts`
2. Replace `YOUR_WEB_CLIENT_ID` with your actual Web Client ID:
   ```typescript
   GoogleSignin.configure({
     webClientId: 'YOUR_ACTUAL_WEB_CLIENT_ID.apps.googleusercontent.com',
     // ...
   });
   ```

### 5. Android Configuration

Add to `android/app/build.gradle`:
```gradle
dependencies {
    implementation 'com.google.android.gms:play-services-auth:20.7.0'
}
```

Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
```

### 6. iOS Configuration

Add to `ios/PostItApp/Info.plist`:
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>com.googleusercontent.apps.YOUR_IOS_CLIENT_ID</string>
        </array>
    </dict>
</array>
```

Run pod install:
```bash
cd ios && pod install && cd ..
```

## Features

### Auto Sync
- Automatically syncs changes when post-its are modified
- Configurable via Settings screen
- 5-second debounce to prevent excessive API calls

### Manual Sync
- Available in Settings screen
- Forces immediate sync with Google Drive

### Conflict Resolution
- Uses timestamp-based resolution
- Most recently updated version wins
- Merges unique post-its from both local and remote

### Data Storage
- Creates a "PostItApp" folder in user's Google Drive
- Stores backup as `postit_backup.json`
- Includes version info for future migrations

## Troubleshooting

### Sign-in fails
1. Verify OAuth credentials are correctly configured
2. Check SHA-1 fingerprint matches (Android)
3. Ensure Bundle ID matches (iOS)
4. Verify Google Play Services is available (Android)

### Sync fails
1. Check internet connectivity
2. Verify Drive API is enabled
3. Check OAuth scopes are correct
4. Review error messages in console

### Data not syncing
1. Ensure auto-sync is enabled
2. Try manual sync from Settings
3. Check if signed in to Google account
