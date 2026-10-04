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
}
