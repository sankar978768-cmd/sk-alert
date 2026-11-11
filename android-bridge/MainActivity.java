package com.sk.alert;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import org.apache.cordova.*;

public class MainActivity extends CordovaActivity
{
    private NotificationBridge notificationBridge;

    @Override
    public void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);

        // Enable Cordova apps to run in the background
        Bundle extras = getIntent().getExtras();
        if (extras != null && extras.getBoolean("cdvStartInBackground", false)) {
            moveTaskToBack(true);
        }

        // Set by <content src="index.html" /> in config.xml
        loadUrl(launchUrl);

        // Initialize Native Notification Bridge
        notificationBridge = new NotificationBridge(this);

        // Attach JavascriptInterface to WebView so React app can communicate with Android
        if (this.appView != null && this.appView.getEngine() != null) {
            WebView webView = (WebView) this.appView.getEngine().getView();
            webView.getSettings().setJavaScriptEnabled(true);
            webView.getSettings().setDomStorageEnabled(true);
            webView.addJavascriptInterface(notificationBridge, "AndroidNotificationBridge");
        }

        // Create Android Notification Channels (Immediately un-greys Android Notification Settings)
        notificationBridge.createNotificationChannels();

        // Request POST_NOTIFICATIONS runtime permission on Android 13+ (API 33+)
        requestNotificationPermission();
    }

    public void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= 33) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                    this,
                    new String[]{
                        Manifest.permission.POST_NOTIFICATIONS,
                        Manifest.permission.VIBRATE
                    },
                    1001
                );
            }
        }
    }
}
