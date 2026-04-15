package com.tally.billtracker;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.appcompat.app.AppCompatDelegate;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
public class MainActivity extends BridgeActivity {
    private String lastAppliedTheme = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Apply night mode BEFORE super.onCreate so the Activity's theme context
        // is correct from the start — this controls native select dialogs, paste popup, etc.
        applyNightModeFromPrefs();

        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        applyStatusBarFromPrefs();

        // Inject JS bridge so theme changes take effect immediately without restart
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            try {
                WebView webView = getBridge().getWebView();
                webView.addJavascriptInterface(new Object() {
                    @JavascriptInterface
                    public void setTheme(String theme) {
                        runOnUiThread(() -> {
                            applyNightMode(theme);
                            applyStatusBar(theme);
                        });
                    }
                }, "TallyNative");
            } catch (Exception e) {
                // Bridge may not be ready yet
            }
        }, 1200);
    }

    @Override
    public void onResume() {
        super.onResume();
        applyStatusBarFromPrefs();
    }

    private String readThemeFromPrefs() {
        try {
            SharedPreferences prefs = getSharedPreferences("CapacitorStorage", MODE_PRIVATE);
            String theme = prefs.getString("_tally_theme_native", "dark");
            return theme != null ? theme : "dark";
        } catch (Exception e) {
            return "dark";
        }
    }

    private void applyNightModeFromPrefs() {
        applyNightMode(readThemeFromPrefs());
    }

    private void applyNightMode(String theme) {
        if (theme.equals(lastAppliedTheme)) return;
        boolean isLight = "light".equals(theme);
        getDelegate().setLocalNightMode(
            isLight ? AppCompatDelegate.MODE_NIGHT_NO : AppCompatDelegate.MODE_NIGHT_YES
        );
        lastAppliedTheme = theme;
    }

    private void applyStatusBarFromPrefs() {
        applyStatusBar(readThemeFromPrefs());
    }

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
}
