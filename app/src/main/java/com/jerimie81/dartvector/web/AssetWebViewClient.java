package com.jerimie81.dartvector.web;

import android.content.Context;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.widget.Toast;
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
        } catch (ActivityNotFoundException e) {
            Toast.makeText(v.getContext(), "No app can open " + u.getScheme() + " links", Toast.LENGTH_SHORT).show();
        } catch (SecurityException e) {
            Toast.makeText(v.getContext(), "Not allowed to open that link", Toast.LENGTH_SHORT).show();
        }
        return true;
    }

    private static final String STYLE_HREF = "https://" + HOST + "/mobile-fit.css";

    @Override
    public void onPageFinished(WebView view, String url) {
        super.onPageFinished(view, url);
        if (!STYLE_HREF.equals(url)) {
            return;
        }
        String js = "(function() {" +
                "  if (document.getElementById('mobile-fit-style')) return;" +
                "  var meta = document.querySelector('meta[name=viewport]');" +
                "  if (!meta) { meta = document.createElement('meta'); meta.name = 'viewport'; document.head.appendChild(meta); }" +
                "  meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');" +
                "  var link = document.createElement('link');" +
                "  link.id = 'mobile-fit-style';" +
                "  link.rel = 'stylesheet';" +
                "  link.href = '" + STYLE_HREF + "';" +
                "  document.head.appendChild(link);" +
                "})()";
        view.evaluateJavascript(js, null);
    }

}
