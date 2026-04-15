package com.tally.billtracker;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.View;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.appcompat.app.AppCompatDelegate;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.webkit.WebSettingsCompat;
import androidx.webkit.WebViewFeature;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private String lastAppliedTheme = null;

    /** Wrap the base Context so its Configuration.uiMode matches the saved
     *  in-app theme. This is what Chromium WebView reads to decide dark/light
     *  for native popups (date picker, text-selection handle backdrop). */
    @Override
    protected void attachBaseContext(Context newBase) {
        String theme = readTheme(newBase);
        boolean isLight = "light".equals(theme);
        int oldUiMode = newBase.getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        Configuration config = new Configuration(newBase.getResources().getConfiguration());
        config.uiMode = (config.uiMode & ~Configuration.UI_MODE_NIGHT_MASK)
                       | (isLight ? Configuration.UI_MODE_NIGHT_NO : Configuration.UI_MODE_NIGHT_YES);
        Log.d("TallyNative", "attachBaseContext: theme=" + theme + " systemUiMode=" + oldUiMode + " forcedUiMode=" + (config.uiMode & Configuration.UI_MODE_NIGHT_MASK));
        super.attachBaseContext(newBase.createConfigurationContext(config));
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        applyNightModeFromPrefs();
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        applyStatusBarFromPrefs();
        registerNativeBridge();
    }

    @Override
    public void onResume() {
        super.onResume();
        applyStatusBarFromPrefs();
    }

    private static String readTheme(Context ctx) {
        try {
            SharedPreferences prefs = ctx.getSharedPreferences("CapacitorStorage", MODE_PRIVATE);
            String theme = prefs.getString("_tally_theme_native", "dark");
            return theme != null ? theme : "dark";
        } catch (Exception e) {
            return "dark";
        }
    }

    private String readThemeFromPrefs() { return readTheme(this); }

    private void applyNightModeFromPrefs() { applyNightMode(readThemeFromPrefs()); }

    private void applyNightMode(String theme) {
        if (theme.equals(lastAppliedTheme)) return;
        boolean isLight = "light".equals(theme);
        getDelegate().setLocalNightMode(
            isLight ? AppCompatDelegate.MODE_NIGHT_NO : AppCompatDelegate.MODE_NIGHT_YES
        );
        lastAppliedTheme = theme;
        // Also tell Chromium WebView not to dark-ify its native popups
        applyWebViewForceDark(isLight);
    }

    /** Tell Chromium WebView whether to apply dark theming to the date picker,
     *  text-selection popup window, etc. FORCE_DARK_OFF = always render light.
     *  FORCE_DARK_ON = always render dark. */
    private void applyWebViewForceDark(boolean isLight) {
        try {
            WebView webView = getBridge() != null ? getBridge().getWebView() : null;
            if (webView == null) return;
            if (WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK)) {
                WebSettingsCompat.setForceDark(
                    webView.getSettings(),
                    isLight ? WebSettingsCompat.FORCE_DARK_OFF : WebSettingsCompat.FORCE_DARK_ON
                );
            }
            if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
                // We handle dark mode ourselves via CSS — never let Chromium auto-darken
                WebSettingsCompat.setAlgorithmicDarkeningAllowed(webView.getSettings(), false);
            }
        } catch (Exception e) {
            Log.e("TallyNative", "applyWebViewForceDark failed: " + e.getMessage());
        }
    }

    private void applyStatusBarFromPrefs() { applyStatusBar(readThemeFromPrefs()); }

    private void applyStatusBar(String theme) {
        try {
            boolean isLight = "light".equals(theme);
            Window window = getWindow();
            int color = isLight ? Color.parseColor("#f1f5f9") : Color.parseColor("#0a0e27");
            window.setStatusBarColor(color);
            View decorView = window.getDecorView();
            WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(window, decorView);
            controller.setAppearanceLightStatusBars(isLight);
        } catch (Exception e) {
            // Safe fallback
        }
    }

    private void registerNativeBridge() {
        try {
            WebView webView = getBridge().getWebView();
            if (webView == null) {
                new Handler(Looper.getMainLooper()).postDelayed(this::registerNativeBridge, 50);
                return;
            }
            // Apply force-dark setting now that the WebView is available
            applyWebViewForceDark("light".equals(readThemeFromPrefs()));
            webView.addJavascriptInterface(new Object() {
                @JavascriptInterface
                public void setTheme(String theme) {
                    runOnUiThread(() -> {
                        applyNightMode(theme);
                        applyStatusBar(theme);
                    });
                }
                @JavascriptInterface
                public boolean isReady() { return true; }
            }, "TallyNative");
        } catch (Exception e) {
            new Handler(Looper.getMainLooper()).postDelayed(this::registerNativeBridge, 100);
        }
    }
}
