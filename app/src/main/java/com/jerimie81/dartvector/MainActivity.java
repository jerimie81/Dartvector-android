package com.jerimie81.dartvector;

import android.annotation.SuppressLint;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Menu;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.ImageButton;
import android.widget.PopupMenu;
import android.widget.ProgressBar;
import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import java.util.List;

import com.google.android.material.button.MaterialButton;
import com.jerimie81.dartvector.ui.NavigationAction;
import com.jerimie81.dartvector.web.AssetWebViewClient;

public final class MainActivity extends AppCompatActivity {
    private WebView webView;
    private ProgressBar pageProgressBar;
    private MaterialButton[] primaryNavigationButtons;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        getWindow().setStatusBarColor(Color.parseColor("#09090B"));
        getWindow().setNavigationBarColor(Color.parseColor("#09090B"));

        webView = findViewById(R.id.webView);
        pageProgressBar = findViewById(R.id.pageProgressBar);

        ImageButton menuButton = findViewById(R.id.menuButton);
        menuButton.setContentDescription("Open app menu");
        menuButton.setOnClickListener(this::showPopupMenu);

        configureWebView();
        configurePrimaryNavigation();

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });

        if (savedInstanceState == null) {
            webView.loadUrl(AssetWebViewClient.ENTRY);
        } else {
            webView.restoreState(savedInstanceState);
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);

        webView.setBackgroundColor(Color.parseColor("#09090B"));
        webView.setWebViewClient(new AssetWebViewClient(this));

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                super.onProgressChanged(view, newProgress);
                if (newProgress >= 100) {
                    pageProgressBar.setVisibility(View.GONE);
                    pageProgressBar.setProgress(0);
                } else {
                    if (pageProgressBar.getVisibility() != View.VISIBLE) {
                        pageProgressBar.setVisibility(View.VISIBLE);
                    }
                    pageProgressBar.setProgress(newProgress);
                }
            }
        });
    }

    private void configurePrimaryNavigation() {
        int[] buttonIds = {
                R.id.navScoreboardButton,
                R.id.navSetupButton,
                R.id.navAnalyticsButton,
                R.id.navMultiplayerButton
        };

        List<NavigationAction> actions = NavigationAction.primaryActions();
        int count = Math.min(buttonIds.length, actions.size());
        primaryNavigationButtons = new MaterialButton[count];

        for (int i = 0; i < count; i++) {
            NavigationAction action = actions.get(i);
            MaterialButton button = findViewById(buttonIds[i]);
            primaryNavigationButtons[i] = button;
            button.setTag(action.getElementId());
            button.setContentDescription(action.getDescription());
            button.setOnClickListener(v -> {
                setSelectedNavigationButton((MaterialButton) v);
                clickElementById(String.valueOf(v.getTag()));
            });
        }

        if (count > 0) {
            setSelectedNavigationButton(primaryNavigationButtons[0]);
        }
    }

    private void setSelectedNavigationButton(MaterialButton selectedButton) {
        if (primaryNavigationButtons == null) {
            return;
        }
        for (MaterialButton button : primaryNavigationButtons) {
            boolean selected = button == selectedButton;
            button.setSelected(selected);
            button.setBackgroundTintList(
                    android.content.res.ColorStateList.valueOf(
                            selected ? Color.parseColor("#F59E0B") : Color.parseColor("#18181B")
                    )
            );
            button.setTextColor(selected ? Color.parseColor("#09090B") : Color.parseColor("#A1A1AA"));
        }
    }

    private enum MenuAction {
        SCOREBOARD("🎯  Scoreboard", NavigationAction.ACTION_SCOREBOARD),
        NEW_MATCH("🎮  New Match", NavigationAction.ACTION_SETUP),
        MATCH_VAULT("📊  Match Vault", NavigationAction.ACTION_ANALYTICS),
        ONLINE_HUB("📡  Online Hub", NavigationAction.ACTION_MULTIPLAYER),
        LEAGUE_NIGHT("🍺  League Night", "nav-league-night-btn"),
        GUIDE("❓  Interactive Guide", "nav-guide-btn"),
        CALLER_FX("🔊  Caller FX", "audio-settings-toggle-btn"),
        CHALKBOARD("🍻  Chalkboard Mode", null),
        RELOAD("🔄  Reload Page", null);

        final String title;
        final String elementId;

        MenuAction(String title, String elementId) {
            this.title = title;
            this.elementId = elementId;
        }
    }

    private void showPopupMenu(View anchor) {
        PopupMenu popup = new PopupMenu(this, anchor);
        Menu menu = popup.getMenu();

        MenuAction[] actions = MenuAction.values();
        for (int i = 0; i < actions.length; i++) {
            menu.add(0, i + 1, i, actions[i].title);
        }

        popup.setOnMenuItemClickListener(item -> {
            int index = item.getItemId() - 1;
            if (index < 0 || index >= actions.length) {
                return false;
            }
            MenuAction action = actions[index];
            if (action == MenuAction.RELOAD) {
                webView.reload();
            } else if (action == MenuAction.CHALKBOARD) {
                clickChalkboardMode();
            } else {
                clickElementById(action.elementId);
            }
            return true;
        });

        popup.show();
    }

    private void clickElementById(String elementId) {
        if (webView == null || elementId == null || elementId.isEmpty()) return;
        String jsonId = toJsonStringLiteral(elementId);
        String escapedAttr = elementId
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("]", "\\]")
                .replace("\n", "\\a")
                .replace("\r", "\\d");
        String js = "(function() {" +
                "  var el = document.getElementById(" + jsonId + ");" +
                "  if (el) { el.click(); }" +
                "  else { var b = document.querySelector('[id*=\"" + escapedAttr + "\"]'); if (b) b.click(); }" +
                "})();";
        webView.evaluateJavascript(js, null);
    }

    private static String toJsonStringLiteral(String value) {
        StringBuilder sb = new StringBuilder("\"");
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            switch (c) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
            }
        }
        return sb.append('"').toString();
    }

    private void clickChalkboardMode() {
        if (webView == null) return;
        String js = "(function() {" +
                "  var btns = Array.from(document.querySelectorAll('button'));" +
                "  var chalk = btns.find(function(b) { return b.textContent.indexOf('Chalkboard') !== -1; });" +
                "  if (chalk) chalk.click();" +
                "})();";
        webView.evaluateJavascript(js, null);
    }

    @Override
    protected void onSaveInstanceState(@NonNull Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.stopLoading();
            webView.loadUrl("about:blank");
            ViewGroup parent = (webView.getParent() instanceof ViewGroup) ? (ViewGroup) webView.getParent() : null;
            if (parent != null) {
                parent.removeView(webView);
            }
            webView.setWebChromeClient(null);
            webView.destroy();
            webView = null;
        }
        primaryNavigationButtons = null;
        super.onDestroy();
    }
}
