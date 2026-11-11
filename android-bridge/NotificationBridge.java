package com.sk.alert;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Vibrator;
import android.webkit.JavascriptInterface;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

/**
 * Native Android Notification Bridge for SK Alert.
 * Exposes methods to JavaScript WebView for instant Android system notifications,
 * status bar alerts, sound, vibration, and background AlarmManager scheduling.
 */
public class NotificationBridge {
    public static final String CHANNEL_ID = "sk_alert_channel";
    public static final String CHANNEL_NAME = "SK Alert Notifications";
    private MainActivity activity;

    public NotificationBridge(MainActivity activity) {
        this.activity = activity;
    }

    /**
     * Creates high-priority notification channel in Android.
     * This registers the notification category in Android Settings and turns on alerts.
     */
    public void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = (NotificationManager) activity.getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Critical IST Alarm and Cricket/Sports Match Notifications");
                channel.enableLights(true);
                channel.enableVibration(true);
                channel.setVibrationPattern(new long[]{0, 500, 200, 500, 200, 800});
                channel.setShowBadge(true);
                channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);

                Uri alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                if (alarmSound == null) {
                    alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
                }
                AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT)
                    .build();
                channel.setSound(alarmSound, audioAttributes);

                manager.createNotificationChannel(channel);
            }
        }
    }

    @JavascriptInterface
    public boolean hasPermission() {
        if (Build.VERSION.SDK_INT >= 33) {
            return ContextCompat.checkSelfPermission(activity, "android.permission.POST_NOTIFICATIONS") == PackageManager.PERMISSION_GRANTED;
        }
        return true;
    }

    @JavascriptInterface
    public void requestPermission() {
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                activity.requestNotificationPermission();
            }
        });
    }

    @JavascriptInterface
    public boolean postNotification(String title, String message, String tag) {
        try {
            NotificationManager manager = (NotificationManager) activity.getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager == null) return false;

            createNotificationChannels();

            Intent intent = new Intent(activity, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pendingIntent = PendingIntent.getActivity(activity, 0, intent, flags);

            Uri defaultSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            if (defaultSound == null) {
                defaultSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            }

            NotificationCompat.Builder builder = new NotificationCompat.Builder(activity, CHANNEL_ID)
                .setSmallIcon(activity.getApplicationInfo().icon)
                .setContentTitle(title != null ? title : "⏰ SK Alert")
                .setContentText(message != null ? message : "IST Alarm arrived!")
                .setStyle(new NotificationCompat.BigTextStyle().bigText(message != null ? message : ""))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setAutoCancel(true)
                .setSound(defaultSound)
                .setVibrate(new long[]{0, 500, 200, 500, 200, 800})
                .setContentIntent(pendingIntent);

            int notificationId = (int) (System.currentTimeMillis() % 1000000);
            manager.notify(tag != null && !tag.isEmpty() ? tag : "sk_alert", notificationId, builder.build());

            vibrate(800);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    @JavascriptInterface
    public void vibrate(long milliseconds) {
        try {
            Vibrator vibrator = (Vibrator) activity.getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                vibrator.vibrate(milliseconds);
            }
        } catch (Exception ignored) {}
    }

    @JavascriptInterface
    public boolean scheduleAlarm(int id, String title, String message, long triggerAtMillis) {
        try {
            AlarmManager alarmManager = (AlarmManager) activity.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return false;

            Intent intent = new Intent(activity, NotificationReceiver.class);
            intent.putExtra("title", title);
            intent.putExtra("message", message);
            intent.putExtra("id", id);

            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pendingIntent = PendingIntent.getBroadcast(activity, id, intent, flags);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            }
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    @JavascriptInterface
    public void cancelAlarm(int id) {
        try {
            AlarmManager alarmManager = (AlarmManager) activity.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return;

            Intent intent = new Intent(activity, NotificationReceiver.class);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pendingIntent = PendingIntent.getBroadcast(activity, id, intent, flags);
            alarmManager.cancel(pendingIntent);
        } catch (Exception ignored) {}
    }
}
