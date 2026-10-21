# Nexus Gaming Hub — MVP 0.1.0

Nexus is a responsive, installable Progressive Web App for Android and Windows. This MVP focuses on five polished screens and local-first functionality.

## Included

1. **Home dashboard** — collection overview, XP, streak, recently played games, daily quest preview.
2. **Game library** — starter collection, search, status filters, add/remove games, recent activity, store/launch links.
3. **Community** — sample activity feed and local follow toggles (clearly marked as preview/demo data).
4. **Daily quests** — daily reset, quest completion, XP rewards, streak counter.
5. **Profile** — editable local profile, accent color, lifetime stats, JSON backup and reset.

## Run it locally

The easiest way is to use Python 3 as a static web server.

1. Install Python 3 if it is not already installed.
2. Open PowerShell in this folder.
3. Run:

   ```powershell
   py -m http.server 8080
   ```

4. On the PC, open `http://localhost:8080`.
5. On an Android phone on the same Wi-Fi, open `http://YOUR-PC-LAN-IP:8080` (Windows Firewall may ask you to allow Python on private networks).

For install prompts and service-worker offline caching, browsers generally require `localhost` or HTTPS. The Android phone URL served over local HTTP is useful for testing, but installability can vary. To install across devices reliably, host this folder on an HTTPS static host. Do not expose the development server to the public internet.

## Install

- **Windows:** In a supported Chromium-based browser, open the HTTPS deployment and choose the install-app icon/menu item. If running locally, use `http://localhost:8080`.
- **Android:** Open the HTTPS deployment in Chrome and choose **Install app** or **Add to Home screen**.

This is a PWA, not a compiled native Android APK. It is the quickest shared Android + Windows MVP; a native Android wrapper can be added later if needed.

## Important MVP limitations

- Data is stored in browser local storage on each device; it does not sync between PC and phone.
- Community feed and player cards are sample data. There are no real accounts, backend, friends, messaging, or online multiplayer social features yet.
- Daily quests and XP are local progression, not verified game telemetry. Visiting Nexus counts as engagement, but it does not read gameplay from other launchers.
- Game links open in the browser. Browser security prevents web apps from launching arbitrary `.exe` files. Steam/store links are used where available; whether an installed game launches depends on browser/OS handling.
- No external libraries, tracking scripts, API keys, or external image requests are required.

## Suggested next milestone

Add a small backend for authentication and cross-device sync, then integrate official game platform APIs where available. Keep all account tokens server-side and never ask users to paste passwords or API secrets into the app.
