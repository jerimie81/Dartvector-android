# DartVector Android

Native Android client application for [DartVector](https://github.com/jerimie81/DartVector).

## Project Overview

DartVector Android wraps the DartVector web interface into a native Android application with embedded WebView and native integration capabilities.

- **Package Name:** `com.jerimie81.dartvector`
- **Target SDK:** 35 (Android 15)
- **Min SDK:** 24 (Android 7.0)
- **Build System:** Gradle (Kotlin DSL)

## Architecture & Blueprint

For full architectural details, roadmap, native bridges, asset loading strategies, and implementation status, refer to [ANDROID_BLUEPRINT.md](file:///home/redrum/.gemini/projects/Dartvector-android/ANDROID_BLUEPRINT.md).

## Building locally

Make sure you have Android SDK installed (specified in `local.properties`).

```bash
# Build Debug APK
./gradlew assembleDebug

# Output APK path:
# app/build/outputs/apk/debug/app-debug.apk
```

## Integration with Web App

Web assets from DartVector static export (`out/`) are copied to `app/src/main/assets/` before building the APK.
