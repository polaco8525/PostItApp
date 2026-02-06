# PostItApp

A React Native mobile application for creating and managing digital Post-It notes with Google Drive synchronization support.

[![Open in IDX](https://cdn.idx.dev/btn/open_dark_32.svg)](https://idx.google.com/import?url=https://github.com/your-username/PostItApp)

## Features

- Create, edit, and delete digital Post-It notes
- Multiple note colors and customization options
- Google Drive backup and sync
- Offline-first architecture
- Clean and intuitive user interface
- Dark mode support

## Requirements

- Node.js 18 or higher
- JDK 17
- Android SDK (API 33 recommended)
- React Native CLI

## Quick Start with Project IDX

The easiest way to get started is using Google Project IDX:

1. Click the **"Open in IDX"** button above
2. Wait for the environment to initialize
3. The Metro bundler will start automatically
4. Use the Android emulator preview to run the app

### IDX Environment Includes

- Node.js 18
- JDK 17
- Android SDK with Pixel 5 emulator (API 33)
- Pre-configured development environment
- Auto-install of dependencies

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/PostItApp.git
cd PostItApp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Android Environment

Ensure you have Android Studio installed with:
- Android SDK Platform 33
- Android SDK Build-Tools
- Android Emulator
- Android SDK Platform-Tools

Create `android/local.properties`:
```properties
sdk.dir=/path/to/your/Android/Sdk
```

### 4. Start the Development Server

```bash
# Start Metro bundler
npm start

# In a new terminal, run on Android
npm run android
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Metro bundler |
| `npm run android` | Run on Android device/emulator |
| `npm run ios` | Run on iOS simulator (macOS only) |
| `npm test` | Run test suite |
| `npm run lint` | Run ESLint |
| `npm run clean` | Clean Android build |
| `npm run build:android` | Build Android release APK |

## Project Structure

```
PostItApp/
├── .idx/                    # Project IDX configuration
│   └── dev.nix              # IDX development environment
├── android/                 # Android native code
├── ios/                     # iOS native code
├── src/                     # Source code
│   ├── components/          # React components
│   ├── screens/             # Screen components
│   ├── services/            # API and services
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Utility functions
│   └── types/               # TypeScript types
├── assets/                  # Static assets
├── App.tsx                  # App entry point
├── index.js                 # React Native entry
├── package.json             # Dependencies
└── tsconfig.json            # TypeScript config
```

## Google Drive Integration

To enable Google Drive sync:

1. Create a project in Google Cloud Console
2. Enable Google Drive API
3. Configure OAuth 2.0 credentials
4. Add your credentials to the app configuration

See [GOOGLE_DRIVE_SETUP.md](./GOOGLE_DRIVE_SETUP.md) for detailed instructions.

## Running on Physical Device

### Android

1. Enable USB debugging on your device
2. Connect via USB
3. Run `npm run android`

### Wireless Debugging (Android 11+)

1. Enable wireless debugging in developer options
2. Pair your device using `adb pair <ip>:<port>`
3. Connect using `adb connect <ip>:<port>`
4. Run `npm run android`

## Building for Production

### Android APK

```bash
npm run build:android
```

The APK will be generated at:
`android/app/build/outputs/apk/release/app-release.apk`

### Android App Bundle (AAB)

```bash
cd android
./gradlew bundleRelease
```

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## Troubleshooting

### Metro bundler issues

```bash
# Clear Metro cache
npx react-native start --reset-cache
```

### Android build issues

```bash
# Clean and rebuild
npm run clean
npm run android
```

### Gradle issues

```bash
cd android
./gradlew clean
./gradlew --stop
cd ..
npm run android
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [React Native](https://reactnative.dev/)
- [Google Project IDX](https://idx.dev/)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
