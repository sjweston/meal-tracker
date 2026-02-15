# Meal Tracker

A PWA for tracking pantry foods, planning balanced weekly meals, and remembering what your kid likes.

## First-time setup (iPhone)

1. Open Terminal on your Mac
2. `cd` into this folder
3. Run `python3 -m http.server 8080`
4. On your iPhone (same Wi-Fi), open Safari and go to `http://YOUR-MAC-IP:8080/meal-tracker.html`
   - To find your Mac's IP: **System Settings → Wi-Fi → Details** next to your network, or run `ipconfig getifaddr en0` in Terminal
5. Tap the **Share** button → **Add to Home Screen**
6. You can now stop the server (`Ctrl+C` in Terminal). The app works offline.

## Updating the app after making changes

When you (or Claude) edit the code and you want your phone to pick up the changes:

1. Open `sw.js` in a text editor
2. Find the line near the top that says `const CACHE_VERSION = 'meal-tracker-v1';`
3. Bump the version (e.g., change `v1` to `v2`, `v2` to `v3`, etc.)
4. Save the file
5. Start the server: `python3 -m http.server 8080`
6. Open the app on your phone (just tap the home screen icon)
7. The service worker will detect the new version and re-download everything
8. **Close and reopen the app** — the new version loads on the second open
9. Stop the server. You're done.

**Why the close-and-reopen?** The service worker downloads the update in the background while you're using the current version. It activates on the next launch so you're never interrupted mid-use.

## File overview

| File | What it does |
|---|---|
| `meal-tracker.html` | The entire app (React + Tailwind, single file) |
| `manifest.json` | PWA config (app name, icons, display mode) |
| `sw.js` | Service worker for offline caching |
| `icon-192.png` | App icon (192×192) |
| `icon-512.png` | App icon (512×512) |
| `apple-touch-icon.png` | iOS home screen icon (180×180) |

## Data

All data lives in your browser's localStorage under three keys: `mealTracker_foods`, `mealTracker_plans`, and `mealTracker_foodMemory`. Use the **Export** button in the app header to download a JSON backup anytime. Use **Import** to restore from a backup.

Food memory means if you delete a food and re-add it later, it remembers the categories, rating, and notes from before.
