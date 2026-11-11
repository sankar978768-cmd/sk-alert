import fs from 'fs';
import path from 'path';

const manifestPath = process.argv[2] || 'sk_alert_app/platforms/android/app/src/main/AndroidManifest.xml';

if (!fs.existsSync(manifestPath)) {
  console.error(`AndroidManifest.xml not found at: ${manifestPath}`);
  process.exit(1);
}

let content = fs.readFileSync(manifestPath, 'utf8');

const permissionsToAdd = [
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.VIBRATE',
  'android.permission.WAKE_LOCK',
  'android.permission.SCHEDULE_EXACT_ALARM',
  'android.permission.USE_EXACT_ALARM',
  'android.permission.RECEIVE_BOOT_COMPLETED',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.ACCESS_NETWORK_STATE'
];

let addedPerms = '';
permissionsToAdd.forEach(perm => {
  if (!content.includes(perm)) {
    addedPerms += `    <uses-permission android:name="${perm}" />\n`;
  }
});

if (addedPerms) {
  content = content.replace('<application', `${addedPerms}    <application`);
}

// Add BroadcastReceiver inside application tag
const receiverTag = '    <receiver android:name="com.sk.alert.NotificationReceiver" android:exported="false" />\n';
if (!content.includes('com.sk.alert.NotificationReceiver')) {
  content = content.replace('</application>', `${receiverTag}    </application>`);
}

fs.writeFileSync(manifestPath, content, 'utf8');
console.log('Successfully patched AndroidManifest.xml with notification permissions and receiver!');
