# Android and iOS builds

The same Flutter code runs on Android and iOS. **Not built here**: the build environment has no Android SDK and iOS needs a Mac with Xcode.
The workflow `.github/workflows/mobile.yml` builds both on GitHub (Actions → Mobile builds → Run workflow, or push a tag `v1.0.0`).

Before you build
- Set the repository variable `CA7_API` (Settings → Secrets and variables → Actions → Variables) to your backend address, e.g. `https://cloud.ca7.io`. The app needs it: a phone has no "own address".
- Backend: add the app to `CA7_APP_ORIGINS` is only needed for web; the phone app calls `/api` directly (CORS does not apply).
- The Android app id is `io.ca7.ca7_app`, the iOS bundle id `io.ca7.ca7App` (change both before publishing). The app name is "CA7".

Android (on your own computer)
```bash
cd flutter_app
flutter build apk --release --dart-define=CA7_API=https://cloud.ca7.io        # build/app/outputs/flutter-apk/app-release.apk
flutter build appbundle --release --dart-define=CA7_API=https://cloud.ca7.io  # for Google Play
```
For Google Play you must sign the bundle with your own key (flutter.dev → "Build and release an Android app"); the workflow output is signed with the debug key and is only good for testing.

iOS (needs a Mac, Xcode and an Apple developer account)
```bash
cd flutter_app && flutter build ios --release --dart-define=CA7_API=https://cloud.ca7.io
```
Open `ios/Runner.xcworkspace` in Xcode, choose your team, then Archive and upload to App Store Connect. The workflow makes an unsigned build to prove it compiles.

Known limits: card payments and the camera agent link open in the browser; push notifications and app icons/splash screens are the Flutter defaults (put your own in `android/app/src/main/res` and `ios/Runner/Assets.xcassets`).
