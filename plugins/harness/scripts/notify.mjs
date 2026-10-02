// Notification hook: best-effort desktop notification. Never waits, never blocks, always exits 0.
// Set HARNESS_NOTIFY=off to disable (tests do).
import { spawn } from 'node:child_process';
import { readStdinJson } from './lib.mjs';

const WIN_TOAST = `
$ErrorActionPreference = 'Stop'
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
$t = [System.Security.SecurityElement]::Escape($env:HARNESS_NOTIFY_TITLE)
$b = [System.Security.SecurityElement]::Escape($env:HARNESS_NOTIFY_BODY)
$xml = New-Object Windows.Data.Xml.Dom.XmlDocument
$xml.LoadXml("<toast><visual><binding template='ToastGeneric'><text>$t</text><text>$b</text></binding></visual></toast>")
$app = '{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\\WindowsPowerShell\\v1.0\\powershell.exe'
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($app).Show([Windows.UI.Notifications.ToastNotification]::new($xml))
`;

function fire(cmd, args, env) {
  const child = spawn(cmd, args, {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
    env: { ...process.env, ...env },
  });
  child.on('error', () => {});
  child.unref();
}

try {
  if (process.env.HARNESS_NOTIFY !== 'off') {
    const input = await readStdinJson();
    const title = 'Claude Code';
    const body = String(input?.message || input?.notification_type || 'needs your attention').slice(0, 200);
    if (process.platform === 'darwin') {
      const q = (s) => JSON.stringify(s); // AppleScript string literal
      fire('osascript', ['-e', `display notification ${q(body)} with title ${q(title)}`]);
    } else if (process.platform === 'linux') {
      fire('notify-send', [title, body]);
    } else if (process.platform === 'win32') {
      fire('powershell.exe', ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', WIN_TOAST], {
        HARNESS_NOTIFY_TITLE: title,
        HARNESS_NOTIFY_BODY: body,
      });
    }
  }
} catch {
  // Notifications are best effort.
}
process.exit(0);
