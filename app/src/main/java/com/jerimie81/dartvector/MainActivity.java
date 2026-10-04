package com.jerimie81.dartvector;

import android.annotation.SuppressLint;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Menu;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.ImageButton;
import android.widget.PopupMenu;
import android.widget.ProgressBar;
import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
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
        MaterialButton scoreboardButton = findViewById(R.id.navScoreboardButton);
        MaterialButton setupButton = findViewById(R.id.navSetupButton);
        MaterialButton analyticsButton = findViewById(R.id.navAnalyticsButton);
        MaterialButton multiplayerButton = findViewById(R.id.navMultiplayerButton);

        primaryNavigationButtons = new MaterialButton[] {
                scoreboardButton,
                setupButton,
                analyticsButton,
                multiplayerButton
        };

        String[] tagIds = new String[] {
                NavigationAction.ACTION_SCOREBOARD,
                NavigationAction.ACTION_SETUP,
                NavigationAction.ACTION_ANALYTICS,
                NavigationAction.ACTION_MULTIPLAYER
        };

        for (int i = 0; i < primaryNavigationButtons.length; i++) {
            MaterialButton button = primaryNavigationButtons[i];
            button.setTag(tagIds[i]);
            button.setContentDescription(NavigationAction.fromId(tagIds[i]).getDescription());
            button.setOnClickListener(v -> {
                String elementId = String.valueOf(v.getTag());
                setSelectedNavigationButton((MaterialButton) v);
                clickElementById(elementId);
            });
        }

        setSelectedNavigationButton(scoreboardButton);
    }

    private void setSelectedNavigationButton(MaterialButton selectedButton) {
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

    private void showPopupMenu(View anchor) {
        PopupMenu popup = new PopupMenu(this, anchor);
        Menu menu = popup.getMenu();

        menu.add(0, 1, 0, "🎯  Scoreboard");
        menu.add(0, 2, 1, "🎮  New Match");
        menu.add(0, 3, 2, "📊  Match Vault");
        menu.add(0, 4, 3, "📡  Online Hub");
        menu.add(0, 5, 4, "🍺  League Night");
        menu.add(0, 6, 5, "❓  Interactive Guide");
        menu.add(0, 7, 6, "🔊  Caller FX");
        menu.add(0, 8, 7, "🍻  Chalkboard Mode");
        menu.add(0, 9, 8, "🔄  Reload Page");

        popup.setOnMenuItemClickListener(item -> {
            switch (item.getItemId()) {
                case 1:
                    clickElementById(NavigationAction.ACTION_SCOREBOARD);
                    return true;
                case 2:
                    clickElementById(NavigationAction.ACTION_SETUP);
                    return true;
                case 3:
                    clickElementById(NavigationAction.ACTION_ANALYTICS);
                    return true;
                case 4:
                    clickElementById(NavigationAction.ACTION_MULTIPLAYER);
                    return true;
                case 5:
                    clickElementById("nav-league-night-btn");
                    return true;
                case 6:
                    clickElementById("nav-guide-btn");
                    return true;
                case 7:
                    clickElementById("audio-settings-toggle-btn");
                    return true;
                case 8:
                    clickChalkboardMode();
                    return true;
                case 9:
                    webView.reload();
                    return true;
                default:
                    return false;
            }
        });

        popup.show();
    }

    private void clickElementById(String elementId) {
        if (webView == null || elementId == null || elementId.isEmpty()) return;
        String escapedId = elementId.replace("\\", "\\\\").replace("'", "\\'");
        String js = "(function() {" +
                "  var el = document.getElementById('" + escapedId + "');" +
                "  if (el) { el.click(); }" +
                "  else { var b = document.querySelector('[id*=\"" + escapedId + "\"]'); if (b) b.click(); }" +
                "})();";
        webView.evaluateJavascript(js, null);
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
            webView.destroy();
        }
        super.onDestroy();
    }
}
