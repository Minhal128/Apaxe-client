# APK Build Instructions

## Fixes Applied for APK Crashes

The following fixes have been applied to resolve APK crashes:

### 1. Network Security Configuration
- Added `network_security_config.xml` to allow HTTPS connections
- Configured proper trust anchors for production domains
- Enabled cleartext traffic for localhost (development only)

### 2. ProGuard Rules
- Added keep rules for Clerk SDK
- Added keep rules for AsyncStorage
- Added keep rules for React Native core libraries
- Preserved crash reporting attributes

### 3. Error Handling
- Added ErrorBoundary component to catch runtime errors
- Improved error handling in AuthContext
- Added proper timeout handling in API service

### 4. Android Manifest
- Added `usesCleartextTraffic` for development
- Added `networkSecurityConfig` reference

## Building the APK

### Option 1: EAS Build (Recommended)
```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Build for Android
eas build --platform android --profile production

# Or build a preview APK for testing
eas build --platform android --profile preview
```

### Option 2: Local Build
```bash
# Clean previous builds
cd android
./gradlew clean
cd ..

# Build release APK
npx expo run:android --variant release

# Or build using Gradle directly
cd android
./gradlew assembleRelease
cd ..

# APK will be at: android/app/build/outputs/apk/release/app-release.apk
```

## Testing the APK

1. **Install on device:**
   ```bash
   adb install android/app/build/outputs/apk/release/app-release.apk
   ```

2. **Check logs if it crashes:**
   ```bash
   adb logcat | grep -i "apex-trading"
   ```

3. **Common issues to check:**
   - Network connectivity
   - Backend API availability
   - Clerk authentication keys
   - Permissions granted

## Debugging APK Crashes

If the APK still crashes:

1. **Enable USB debugging** on your Android device
2. **Connect device** and run:
   ```bash
   adb logcat *:E
   ```
3. **Look for errors** related to:
   - Network requests
   - Authentication
   - Missing permissions
   - ProGuard obfuscation issues

## Production Checklist

Before releasing to production:

- [ ] Test on multiple Android versions (8.0+)
- [ ] Test on different screen sizes
- [ ] Verify all API endpoints are accessible
- [ ] Test with slow/no internet connection
- [ ] Verify Clerk authentication works
- [ ] Test deep linking
- [ ] Check app permissions
- [ ] Verify signing configuration
- [ ] Test crash reporting

## Environment Variables

Make sure these are properly configured in `src/constants/api.js`:
- `PRODUCTION_URL` - Your backend URL
- `API_CONFIG.BASE_URL` - API endpoint
- `API_CONFIG.WS_URL` - WebSocket endpoint

## Support

If you encounter issues:
1. Check the error logs using `adb logcat`
2. Verify backend is accessible from mobile network
3. Check ProGuard rules if specific libraries are failing
4. Ensure all required permissions are in AndroidManifest.xml
