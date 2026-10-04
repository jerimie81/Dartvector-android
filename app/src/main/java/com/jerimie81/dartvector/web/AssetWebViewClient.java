package com.jerimie81.dartvector.web;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.webkit.WebViewAssetLoader;

public final class AssetWebViewClient extends WebViewClient {
    public static final String HOST = "appassets.androidplatform.net";
    public static final String ENTRY = "https://" + HOST + "/index.html";

    private final WebViewAssetLoader loader;

    public AssetWebViewClient(Context ctx) {
        loader = new WebViewAssetLoader.Builder()
                .setDomain(HOST)
                .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(ctx))
                .build();
    }

    @Override
    public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
        Uri u = r.getUrl();
        if (HOST.equals(u.getHost()) && "/".equals(u.getPath())) {
            u = Uri.parse(ENTRY);
        }
        return loader.shouldInterceptRequest(u);
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
        Uri u = r.getUrl();
        if (HOST.equals(u.getHost())) return false;
        try {
            v.getContext().startActivity(new Intent(Intent.ACTION_VIEW, u));
        } catch (Exception ignored) {
        }
        return true;
    }

    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        String js = "(function() {" +
                "  var meta = document.querySelector('meta[name=viewport]');" +
                "  if (!meta) { meta = document.createElement('meta'); meta.name = 'viewport'; document.head.appendChild(meta); }" +
                "  meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');" +
                "  var style = document.getElementById('mobile-fit-style');" +
                "  if (!style) { style = document.createElement('style'); style.id = 'mobile-fit-style'; document.head.appendChild(style); }" +
                "  style.innerHTML = '" +
                "    header { display: none !important; }" +
                "    html, body { max-width: 100vw !important; overflow-x: hidden !important; margin: 0 !important; padding: 0 !important; }" +
                "    .flex.items-center.justify-between.border-b { flex-wrap: wrap !important; gap: 8px !important; }" +
                "    .flex.bg-zinc-950 { flex-wrap: wrap !important; gap: 4px !important; max-width: 100% !important; }" +
                "    #tab-house-quick-btn, #tab-keypad-btn, #tab-dart-btn, #voice-mic-btn {" +
                "      font-size: 11px !important; padding: 6px 10px !important; white-space: nowrap !important; border-radius: 10px !important;" +
                "      display: inline-flex !important; align-items: center !important; justify-content: center !important; gap: 4px !important;" +
                "    }" +
                "    #end-turn-btn, #scoreboard-end-turn-btn, button[title*=\"turn\"], button[title*=\"Turn\"] {" +
                "      white-space: nowrap !important; font-size: 12px !important; padding: 8px 12px !important;" +
                "      display: inline-flex !important; align-items: center !important; justify-content: center !important; gap: 6px !important;" +
                "    }" +
                "    #toggle-dartbot-btn, #toggle-heatmap-btn {" +
                "      font-size: 11px !important; padding: 6px 10px !important; min-height: 32px !important;" +
                "      display: inline-flex !important; align-items: center !important; justify-content: center !important;" +
                "      border-radius: 8px !important; white-space: nowrap !important;" +
                "    }" +
                "    [id^=\"house-quick-\"] {" +
                "      min-height: 48px !important; padding: 6px !important; display: flex !important;" +
                "      flex-direction: column !important; align-items: center !important; justify-content: center !important;" +
                "      border-radius: 12px !important;" +
                "    }" +
                "    html, body { background: radial-gradient(circle at top, rgba(245, 158, 11, 0.14), transparent 26%), #09090b !important; color: #f4f4f5 !important; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif !important; }" +
                "    body { padding: 12px 12px 18px !important; }" +
                "    body * { box-sizing: border-box !important; }" +
                "    [class*='bg-zinc-950'], [class*='bg-zinc-900'], [class*='bg-zinc-800'], [class*='bg-black'], [class*='bg-slate-950'] {" +
                "      background: linear-gradient(180deg, rgba(24, 24, 27, 0.98), rgba(9, 9, 11, 0.98)) !important;" +
                "      border: 1px solid rgba(255,255,255,0.06) !important;" +
                "      box-shadow: 0 18px 46px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255,255,255,0.03) !important;" +
                "    }" +
                "    [class*='rounded-2xl'], [class*='rounded-xl'], [class*='rounded-lg'] { border-radius: 18px !important; }" +
                "    [class*='text-zinc-400'], [class*='text-zinc-500'], [class*='text-zinc-600'], [class*='text-slate-400'] { color: #a1a1aa !important; }" +
                "    [class*='text-white'], [class*='text-zinc-100'], [class*='text-zinc-50'] { color: #f4f4f5 !important; }" +
                "    [class*='border-zinc-800'], [class*='border-zinc-700'], [class*='border-slate-800'] { border-color: rgba(255,255,255,0.08) !important; }" +
                "    button, [role='button'], [type='button'] { border-radius: 14px !important; transition: transform 0.16s ease, box-shadow 0.16s ease, background-color 0.16s ease, border-color 0.16s ease !important; touch-action: manipulation !important; }" +
                "    button:hover, [role='button']:hover, [type='button']:hover { transform: translateY(-1px) !important; box-shadow: 0 10px 22px rgba(0, 0, 0, 0.22) !important; }" +
                "    #tab-house-quick-btn, #tab-keypad-btn, #tab-dart-btn, #voice-mic-btn, #toggle-dartbot-btn, #toggle-heatmap-btn, #scoreboard-end-turn-btn, #end-turn-btn { background: rgba(24, 24, 27, 0.94) !important; border: 1px solid rgba(255,255,255,0.08) !important; color: #f4f4f5 !important; }" +
                "    [class*='from-amber-500'], [class*='to-amber-400'], [class*='bg-amber-500'], [class*='bg-amber-400'] { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%) !important; }" +
                "    [class*='text-amber-400'], [class*='text-amber-300'] { color: #fbbf24 !important; }" +
                "    [id^='house-quick-'] { background: linear-gradient(180deg, rgba(24,24,27,0.94), rgba(9,9,11,0.94)) !important; border: 1px solid rgba(255,255,255,0.08) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,0.03) !important; }" +
                "    [id^='house-quick-'] > div:first-child { font-size: 1.1rem !important; font-weight: 700 !important; color: #fbbf24 !important; }" +
                "    [id^='house-quick-'] > div:last-child { color: #d4d4d8 !important; font-size: 0.7rem !important; text-transform: uppercase !important; letter-spacing: 0.08em !important; }" +
                "    [class*='bg-amber-500/10'], [class*='bg-amber-400/10'], [class*='bg-amber-300/10'] { background: rgba(245, 158, 11, 0.12) !important; border-color: rgba(245, 158, 11, 0.25) !important; }" +
                "    [data-state='active'], .ring-amber-400, .ring-1 { box-shadow: 0 0 0 1px rgba(245,158,11,0.55), 0 12px 24px rgba(245,158,11,0.12) !important; }" +
                "    button:focus-visible, [role='button']:focus-visible { outline: 2px solid rgba(251,191,36,0.9) !important; outline-offset: 2px !important; }" +
                "    button { box-sizing: border-box !important; touch-action: manipulation !important; }" +
                "  ';" +
                "})()";
        view.evaluateJavascript(js, null);
    }
}
