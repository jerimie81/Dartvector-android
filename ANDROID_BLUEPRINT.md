# DartVector → Android APK Blueprint

Audited against `main` @ `bfb4dac` ("feat(android): add native WebView wrapper").

## 1. Current state

| Layer | State |
|---|---|
| Web | Next.js 15 / React 19 SPA, single route (`__PAGE__`), `output: 'standalone'`, `images.unoptimized` already set |
| `android/` | Gradle KTS project, AGP 8.13.2, Gradle 9.3.0, `compileSdk/targetSdk 35`, `minSdk 24`, one `MainActivity.java` (bare `WebView` → `file:///android_asset/index.html`) |
| Assets | Static-export output **committed** in `android/app/src/main/assets/` (relative `./_next/...` prefix). Not reproducible from `next.config.ts` as written |
| Missing | Build script, export config, icon, signing, CI, native bridges |

## 2. Blockers (ranked)

1. **`_next/` likely dropped from the APK.** aapt2's default `ignoreAssetsPattern` contains `<dir>_*`, which skips directories starting with `_`. Result: blank WebView. Verify with `unzip -l app-release.apk | grep _next`.
2. **No export pipeline.** Config is `standalone`; `app/api/gemini/coach/route.ts` makes `output: 'export'` fail. Committed assets are stale build output.
3. **`file://` origin.** Opaque origin; breaks IndexedDB/fetch semantics and forces `allowFileAccess(true)`. Use `WebViewAssetLoader` (`https://appassets.androidplatform.net`).
4. **Google sign-in dead.** `signInWithPopup`/`Redirect` (`lib/auth-context.tsx`) don't work in WebView; Google rejects embedded user agents. Needs native Credential Manager → `signInWithCredential`.
5. **`/api/gemini/coach` unreachable.** No server in the APK, and the key must not ship in it. Needs a remote proxy; `AICoachPanel` already falls back to canned text on failure.
6. **`webkitSpeechRecognition` is not implemented in Android WebView** (`InputPad.tsx`, `HouseLeagueGuideModal.tsx`). Needs native `SpeechRecognizer` bridge + `RECORD_AUDIO`.
7. **`speechSynthesis` unreliable** on stripped WebViews (already in `TODO.md`). Bundle fallback clips.
8. **targetSdk 35 enforces edge-to-edge.** `setStatusBarColor` is ignored on Android 15+; content draws under system bars.
9. **Back handling.** `onBackPressed()` is bypassed under predictive back.
10. **Hardening gaps.** No `shouldOverrideUrlLoading` (external links navigate inside the app), `allowFileAccess(true)`, `allowBackup="true"` (backs up Firebase tokens/IndexedDB), no launcher icon, no `signingConfig`.
11. **Unverified:** AGP 8.13.2 ↔ Gradle 9.3.0 compatibility. Check the AGP compatibility table on first CI run; JDK 17+ required.

## 3. Target layout

```
scripts/build-android-web.sh            # export → android assets (assets gitignored)
lib/platform.ts                         # isNative(), endpoint resolution
lib/native-bridge.ts                    # speech + auth adapters over window.DartNative
android/app/src/main/java/com/jerimie81/dartvector/
  MainActivity.java                     # lifecycle, insets, back, wiring only
  web/AssetWebViewClient.java           # loader + URL policy
  bridge/SpeechBridge.java              # SpeechRecognizer
  bridge/AuthBridge.java                # Credential Manager → idToken
.github/workflows/android.yml
```

## 4. Phase 1 — Export pipeline

`next.config.ts`:
```ts
const isAndroid = process.env.BUILD_TARGET === 'android';
const nextConfig: NextConfig = {
  output: isAndroid ? 'export' : 'standalone',
  // ...rest unchanged
};
```

`scripts/build-android-web.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
ASSETS=android/app/src/main/assets
STASH="$(mktemp -d)"
restore() { [ -d "$STASH/api" ] && mv "$STASH/api" app/api; rm -rf "$STASH"; }
trap restore EXIT
[ -d app/api ] && mv app/api "$STASH/api"
rm -rf .next out
BUILD_TARGET=android npx next build
find "$ASSETS" -mindepth 1 ! -name .gitkeep -delete
cp -a out/. "$ASSETS/"
```

`package.json` scripts:
```json
"build:android-web": "bash scripts/build-android-web.sh",
"build:apk": "npm run build:android-web && cd android && ./gradlew assembleRelease"
```

`.gitignore` append (then `git rm -r --cached android/app/src/main/assets/_next android/app/src/main/assets/*.html android/app/src/main/assets/index.txt`):
```
android/app/src/main/assets/*
!android/app/src/main/assets/.gitkeep
android/app/build/
android/.gradle/
```

## 5. Phase 2 — Gradle

`android/app/build.gradle.kts`:
```kotlin
plugins { id("com.android.application") }

android {
    namespace = "com.jerimie81.dartvector"
    compileSdk = 35
    defaultConfig {
        applicationId = "com.jerimie81.dartvector"
        minSdk = 24; targetSdk = 35
        versionCode = 1; versionName = "1.0.0"
        buildConfigField("String", "GOOGLE_WEB_CLIENT_ID",
            "\"${System.getenv("GOOGLE_WEB_CLIENT_ID") ?: ""}\"")
    }
    buildFeatures { buildConfig = true }

    // Default pattern contains <dir>_* which strips assets/_next
    androidResources {
        ignoreAssetsPattern = "!.svn:!.git:!.ds_store:!*.scc:.*:!CVS:!thumbs.db:!picasa.ini:!*~"
    }

    signingConfigs {
        if (System.getenv("KS_PATH") != null) create("release") {
            storeFile = file(System.getenv("KS_PATH"))
            storePassword = System.getenv("KS_PASS")
            keyAlias = System.getenv("KS_ALIAS")
            keyPassword = System.getenv("KS_KEY_PASS")
        }
    }
    buildTypes {
        release {
            isMinifyEnabled = true
            signingConfigs.findByName("release")?.let { signingConfig = it }
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
}

dependencies {
    implementation("androidx.activity:activity:1.9.3")
    implementation("androidx.webkit:webkit:1.12.1")
    implementation("androidx.credentials:credentials:1.5.0")
    implementation("androidx.credentials:credentials-play-services-auth:1.5.0")
    implementation("com.google.android.libraries.identity.googleid:googleid:1.1.1")
}
```
Pin to current releases when you bump; versions above are placeholders to verify.

`proguard-rules.pro` (bridges are reflection-visible):
```
-keepclassmembers class com.jerimie81.dartvector.bridge.* {
    @android.webkit.JavascriptInterface <methods>;
}
```

`AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<queries><intent><action android:name="android.speech.RecognitionService" /></intent></queries>
<application
    android:allowBackup="false"
    android:enableOnBackInvokedCallback="true"
    android:icon="@mipmap/ic_launcher"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:usesCleartextTraffic="false" ...>
```
Generate icons from `build/icon.ico` source art via Android Studio Image Asset (adaptive, amber `#F59E0B` on `#09090B`).

`res/values/styles.xml` — add inside `AppTheme`:
```xml
<item name="android:windowBackground">#09090B</item>
```

## 6. Phase 3 — Native shell

`web/AssetWebViewClient.java`:
```java
package com.jerimie81.dartvector.web;

import android.content.Intent;
import android.net.Uri;
import android.webkit.*;
import androidx.webkit.WebViewAssetLoader;

public final class AssetWebViewClient extends WebViewClient {
    public static final String HOST = "appassets.androidplatform.net";
    public static final String ENTRY = "https://" + HOST + "/index.html";

                .setDomain(HOST)
                .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(ctx))
                .build();
    }

    @Override
    public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
        Uri u = r.getUrl();
        if (HOST.equals(u.getHost()) && "/".equals(u.getPath())) u = Uri.parse(ENTRY);
        return real.shouldInterceptRequest(u);
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
        Uri u = r.getUrl();
        if (HOST.equals(u.getHost())) return false;
        try { v.getContext().startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) {}
        return true;
    }
}
```
`MainActivity.java`:
```java
package com.jerimie81.dartvector;

import android.annotation.SuppressLint;
import android.graphics.Color;
import android.os.Bundle;
import android.webkit.*;
import androidx.activity.ComponentActivity;
import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.graphics.Insets;
import androidx.core.view.*;
import com.jerimie81.dartvector.bridge.*;
import com.jerimie81.dartvector.web.AssetWebViewClient;

public final class MainActivity extends ComponentActivity {
    private WebView web;
    private SpeechBridge speech;
    private ActivityResultLauncher<String> micPermission;

    @SuppressLint({"SetJavaScriptEnabled", "JavascriptInterface"})
    @Override protected void onCreate(Bundle s) {
        super.onCreate(s);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        web = new WebView(this);
        WebSettings ws = web.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setMediaPlaybackRequiresUserGesture(false);
        ws.setAllowFileAccess(false);
        ws.setAllowContentAccess(false);
        web.setBackgroundColor(Color.rgb(9, 9, 11));
        web.setWebViewClient(new AssetWebViewClient(this));
        web.setWebChromeClient(new WebChromeClient());

        micPermission = registerForActivityResult(
                new ActivityResultContracts.RequestPermission(),
                granted -> { if (speech != null) speech.onPermissionResult(granted); });
        speech = new SpeechBridge(this, web, micPermission);
        web.addJavascriptInterface(speech, "DartNativeSpeech");
        web.addJavascriptInterface(new AuthBridge(this, web), "DartNativeAuth");

        ViewCompat.setOnApplyWindowInsetsListener(web, (v, i) -> {
            Insets b = i.getInsets(WindowInsetsCompat.Type.systemBars()
                    | WindowInsetsCompat.Type.displayCutout()
                    | WindowInsetsCompat.Type.ime());
            v.setPadding(b.left, b.top, b.right, b.bottom);
            return WindowInsetsCompat.CONSUMED;
        });

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override public void handleOnBackPressed() {
                if (web.canGoBack()) web.goBack();
                else { setEnabled(false); getOnBackPressedDispatcher().onBackPressed(); }
            }
        });

        setContentView(web);
        if (s == null) web.loadUrl(AssetWebViewClient.ENTRY); else web.restoreState(s);
    }

    @Override protected void onSaveInstanceState(Bundle o) { super.onSaveInstanceState(o); web.saveState(o); }
    @Override protected void onDestroy() { if (speech != null) speech.destroy(); web.destroy(); super.onDestroy(); }
}
```

## 7. Phase 4 — Bridges

**Contract** (native → web via `evaluateJavascript`, web → native via `@JavascriptInterface`):

| Bridge | Web → native | Native → web |
|---|---|---|
| Speech | `DartNativeSpeech.start(lang)`, `.stop()` | `window.__dvSpeech({type:'partial'\|'final'\|'error', text})` |
| Auth | `DartNativeAuth.signIn()` | `window.__dvAuth({idToken}\|{error})` |

`bridge/SpeechBridge.java`:
```java
package com.jerimie81.dartvector.bridge;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.speech.*;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.activity.ComponentActivity;
import androidx.activity.result.ActivityResultLauncher;
import java.util.ArrayList;
import org.json.JSONObject;

public final class SpeechBridge {
    private final ComponentActivity act; private final WebView web;
    private final ActivityResultLauncher<String> perm;
    private SpeechRecognizer rec; private String pendingLang;

    public SpeechBridge(ComponentActivity a, WebView w, ActivityResultLauncher<String> p) { act = a; web = w; perm = p; }

    @JavascriptInterface public void start(String lang) {
        act.runOnUiThread(() -> {
            pendingLang = lang;
            if (act.checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) begin();
            else perm.launch(Manifest.permission.RECORD_AUDIO);
        });
    }
    @JavascriptInterface public void stop() { act.runOnUiThread(() -> { if (rec != null) rec.stopListening(); }); }

    public void onPermissionResult(boolean ok) { if (ok) begin(); else emit("error", "permission_denied"); }
    public void destroy() { if (rec != null) { rec.destroy(); rec = null; } }

    private void begin() {
        if (!SpeechRecognizer.isRecognitionAvailable(act)) { emit("error", "unavailable"); return; }
        destroy();
        rec = SpeechRecognizer.createSpeechRecognizer(act);
        rec.setRecognitionListener(new RecognitionListener() {
            public void onResults(Bundle b) { emit("final", first(b)); }
            public void onPartialResults(Bundle b) { emit("partial", first(b)); }
            public void onError(int e) { emit("error", String.valueOf(e)); }
            public void onReadyForSpeech(Bundle b) {} public void onBeginningOfSpeech() {}
            public void onRmsChanged(float v) {} public void onBufferReceived(byte[] b) {}
            public void onEndOfSpeech() {} public void onEvent(int t, Bundle b) {}
        });
        Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
                .putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                .putExtra(RecognizerIntent.EXTRA_LANGUAGE, pendingLang == null ? "en-US" : pendingLang)
                .putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        rec.startListening(i);
    }
    private static String first(Bundle b) {
        ArrayList<String> l = b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        return l == null || l.isEmpty() ? "" : l.get(0);
    }
    private void emit(String type, String text) {
        String js = "window.__dvSpeech&&window.__dvSpeech(" + new JSONObject(java.util.Map.of("type", type, "text", text)) + ")";
        act.runOnUiThread(() -> web.evaluateJavascript(js, null));
    }
}
```

`bridge/AuthBridge.java`:
```java
package com.jerimie81.dartvector.bridge;

import android.os.CancellationSignal;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.activity.ComponentActivity;
import androidx.credentials.*;
import androidx.credentials.exceptions.GetCredentialException;
import com.google.android.libraries.identity.googleid.*;
import com.jerimie81.dartvector.BuildConfig;
import org.json.JSONObject;
import java.util.Map;

public final class AuthBridge {
    private final ComponentActivity act; private final WebView web;
    public AuthBridge(ComponentActivity a, WebView w) { act = a; web = w; }

    @JavascriptInterface public void signIn() {
        act.runOnUiThread(() -> {
            GetGoogleIdOption opt = new GetGoogleIdOption.Builder()
                    .setServerClientId(BuildConfig.GOOGLE_WEB_CLIENT_ID)
                    .setFilterByAuthorizedAccounts(false).build();
            GetCredentialRequest req = new GetCredentialRequest.Builder().addCredentialOption(opt).build();
            CredentialManager.create(act).getCredentialAsync(act, req, new CancellationSignal(),
                act.getMainExecutor(), new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                    public void onResult(GetCredentialResponse r) {
                        try {
                            String t = GoogleIdTokenCredential.createFrom(r.getCredential().getData()).getIdToken();
                            emit(Map.of("idToken", t));
                        } catch (Exception e) { emit(Map.of("error", String.valueOf(e.getMessage()))); }
                    }
                    public void onError(GetCredentialException e) { emit(Map.of("error", e.getType())); }
                });
        });
    }
    private void emit(Map<String, String> m) {
        web.evaluateJavascript("window.__dvAuth&&window.__dvAuth(" + new JSONObject(m) + ")", null);
    }
}
```
Firebase console prerequisites: add the **release and debug keystore SHA-1** to an Android OAuth client; `GOOGLE_WEB_CLIENT_ID` is the *Web* client ID of the same project.

### Web adapters

`lib/platform.ts`:
```ts
export const isNative = () =>
  typeof window !== 'undefined' && 'DartNativeSpeech' in window;
export const COACH_ENDPOINT =
  process.env.NEXT_PUBLIC_COACH_ENDPOINT || '/api/gemini/coach';
```

`lib/native-bridge.ts`:
```ts
type SpeechEvt = { type: 'partial' | 'final' | 'error'; text: string };
declare global {
  interface Window {
    DartNativeSpeech?: { start(lang: string): void; stop(): void };
    DartNativeAuth?: { signIn(): void };
    __dvSpeech?: (e: SpeechEvt) => void;
    __dvAuth?: (r: { idToken?: string; error?: string }) => void;
  }
}

export function nativeListen(lang: string, onEvt: (e: SpeechEvt) => void) {
  window.__dvSpeech = onEvt;
  window.DartNativeSpeech!.start(lang);
  return () => window.DartNativeSpeech!.stop();
}

export function nativeGoogleIdToken(): Promise<string> {
  return new Promise((res, rej) => {
    window.__dvAuth = (r) => (r.idToken ? res(r.idToken) : rej(new Error(r.error ?? 'auth_failed')));
    window.DartNativeAuth!.signIn();
  });
}
```

Integration points (exact functions):
- `InputPad.tsx` / `HouseLeagueGuideModal.tsx`: where `new SpeechRecognition()` is constructed, branch `if (window.DartNativeSpeech) return nativeListen(...)` and route `final` text into the existing `voice-parser.ts` entry point.
- `auth-context.tsx` → `signInWithGoogle`: at the top, `if (isNative()) { const idToken = await nativeGoogleIdToken(); await signInWithCredential(auth, GoogleAuthProvider.credential(idToken)); return; }`. Skips both popup and redirect paths.
- `lib/firebase.ts`: when `BUILD_TARGET==='android'` replace `getAuth(app)` with `initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] })` (no `popupRedirectResolver`), so the SDK doesn't proactively load the gapi iframe on mobile UAs. Remove the separate `setPersistence` call in that branch. Note `getAuth` + HMR double-init: keep the existing `getApps()` guard.
- `AICoachPanel.tsx` → `fetchAnalysis`: change `fetch('/api/gemini/coach', …)` to `fetch(COACH_ENDPOINT, …)` and attach `Authorization: Bearer ${await auth?.currentUser?.getIdToken()}` when signed in.

## 8. Phase 5 — Coach proxy

Port `app/api/gemini/coach/route.ts` to a Cloud Run / Firebase Function (or the Tailscale-reachable home box) that: verifies the Firebase ID token (`firebase-admin`), rate-limits per `uid`, holds `GEMINI_API_KEY` server-side, and keeps the existing prompt and fallback strings. Set `NEXT_PUBLIC_COACH_ENDPOINT` at build time (inlined by Next). Anonymous/offline users get the existing canned fallback; no key ever ships in the APK.

## 9. Phase 6 — CI

`.github/workflows/android.yml`:
```yaml
name: android
on: { push: { branches: [main] }, workflow_dispatch: {} }
jobs:
  apk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: .nvmrc, cache: npm }
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: 21 }
      - uses: gradle/actions/setup-gradle@v4
      - run: npm ci
      - run: npm test
      - name: Build web (static export)
        run: npm run build:android-web
        env:
          NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.FB_API_KEY }}
          NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${{ secrets.FB_AUTH_DOMAIN }}
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.FB_PROJECT_ID }}
          NEXT_PUBLIC_FIREBASE_APP_ID: ${{ secrets.FB_APP_ID }}
          NEXT_PUBLIC_COACH_ENDPOINT: ${{ secrets.COACH_ENDPOINT }}
      - name: Decode keystore
        run: echo "${{ secrets.KS_B64 }}" | base64 -d > "$RUNNER_TEMP/release.jks"
      - name: Assemble
        working-directory: android
        run: chmod +x gradlew && ./gradlew assembleRelease
        env:
          KS_PATH: ${{ runner.temp }}/release.jks
          KS_PASS: ${{ secrets.KS_PASS }}
          KS_ALIAS: ${{ secrets.KS_ALIAS }}
          KS_KEY_PASS: ${{ secrets.KS_KEY_PASS }}
          GOOGLE_WEB_CLIENT_ID: ${{ secrets.GOOGLE_WEB_CLIENT_ID }}
      - uses: actions/upload-artifact@v4
        with: { name: dartvector-apk, path: android/app/build/outputs/apk/release/*.apk }
```
Local keystore: `keytool -genkeypair -v -keystore release.jks -alias dartvector -keyalg RSA -keysize 4096 -validity 10000`. Keep it out of the repo.

## 10. Verification gates

1. `unzip -l app-release.apk | grep -c '_next/static'` > 0.
2. Cold start offline (airplane mode): setup → match → scoreboard renders; history persists after force-stop (IndexedDB/localStorage under the `appassets` origin).
3. External link opens in the system browser; back button pops WebView history then exits.
4. Status/nav bars don't overlap header on Android 15 emulator; keyboard doesn't cover `InputPad`.
5. Mic: first press prompts, deny → `permission_denied` handled, grant → partial/final events reach `voice-parser`.
6. Google sign-in via Credential Manager succeeds, Firestore sync round-trips (`cloud-sync.ts`).
7. Announcer: if `speechSynthesis.getVoices().length === 0`, bundled clips play (TODO.md item).
8. `npm run build` (standalone) and Electron path still work, since export is gated on `BUILD_TARGET`.

## 11. Migration note

Local-only data lives in the `https://appassets.androidplatform.net` origin; it does not carry over from any APK built with the current `file://` loader. Ship Phase 3 before distributing builds to real users.
