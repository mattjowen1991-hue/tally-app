package com.tally.billtracker;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().getDecorView().post(() -> applyThemeFromPrefs());
    }

    private void applyThemeFromPrefs() {
        try {
            // Capacitor Preferences stores data in a SharedPreferences file named "_cap_prefs"
            SharedPreferences prefs = getSharedPreferences("CapacitorStorage", MODE_PRIVATE);
            String theme = prefs.getString("_tally_theme_native", "dark");
            Window window = getWindow();
            boolean isLight = "light".equals(theme);
            int color = isLight ? Color.parseColor("#f1f5f9") : Color.parseColor("#0a0e27");
            window.setStatusBarColor(color);
            View decorView = window.getDecorView();
            WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(window, decorView);
            controller.setAppearanceLightStatusBars(isLight);
        } catch (Exception e) {
            // Safe fallback — dark mode is the default
        }
    }
}