# MiredGains Desktop

Runs the same React Native app as a desktop web app, plus a small local
sync server so your phone and this PC share one dataset.

## Start it

Double-click the **MiredGains** shortcut on your desktop — it starts the
sync server if it isn't running, then opens the app in its own window.
(Manual alternatives: `start-desktop.bat`, or `node server.mjs` in this
folder. Keep the server running while you're using the app or syncing.)

- Desktop app: <http://localhost:8500>
- Sync API: `http://<this-PC's-LAN-IP>:8500/api/state`
- Data file: `desktop/sync-data.json`

## Sync the phone

1. Phone and PC must be on the same Wi-Fi.
2. In the phone app, open the **Sync** tab.
3. Enter the PC's address (shown in the server window, e.g. `192.168.5.24:8500`) and tap **Sync Now**.

The desktop web app syncs automatically (it pushes changes as you make
them and adopts anything new on its next change or page reload). The
phone syncs when you tap **Sync Now**.

## How merging works

Sync is a union by record id; when the same record changed on both
sides, the newer `updatedAt` timestamp wins. Deletions do **not**
propagate — a record deleted on one device reappears after a sync from
the other. Data lives only on this PC and your phone; nothing leaves
your network.

## Rebuilding the web app

After changing app code, regenerate the web bundle and refresh the
browser:

```
npx expo export --platform web
```

Windows Firewall note: inbound TCP 8500 must be allowed for the phone
to reach this PC. A rule named "MiredGains Sync TCP 8500" is already
installed; if sync stops working after network changes, re-check it.
