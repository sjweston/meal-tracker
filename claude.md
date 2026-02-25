# Meal Tracker

## Project Goal

A Progressive Web App for parents managing picky eating in children. Built on the research-backed "15-try rule" — that children need roughly 15 exposures to a food before accepting it — the app tracks meal plans, eating history, and food preferences to help parents stay consistent and see progress over time.

The app is designed to be fast, thumb-friendly, and work offline. It runs entirely in the browser with IndexedDB for persistence, no backend required.

## Tech Stack

- **Framework:** React 18 (functional components, hooks, useReducer)
- **Structure:** Single-file PWA (`index.html`, ~2,300 lines)
- **Styling:** Tailwind CSS
- **Icons:** Phosphor Icons
- **Storage:** IndexedDB (foods, plans, servings, combos, children, settings, memory)
- **Offline:** Service Worker with cache-first strategy
- **Hosting:** GitHub Pages at `/meal-tracker/`

## Current Features

### Core Data Model
- **Foods** are household-shared with name, categories (carb/protein/fruit/veggie/snack), stock level, and optional notes
- **Meal Plans** are per-child, per-date, per-meal (breakfast/lunch/dinner/snack)
- **Servings** record per-child eating outcomes (none/some/all) — preferences are computed dynamically from serving history, not stored as static ratings
- **Combos** are reusable meal templates (e.g. "The Usual") that can be applied with one tap
- **Children** have name, emoji avatar, and display order

### Screens
- **Today:** Daily dashboard with meal check-ins, exposure progress (foods approaching 15 tries), accepted foods count, planning nudges, and shopping urgency alerts
- **Pantry:** Active inventory filtered to in-stock and low-stock items
- **Library:** Master database of all foods ever added, with batch operations (merge, bulk categorize, multi-delete)
- **Planner:** Daily and weekly views with per-child meal planning, combo support, and a category coverage heatmap
- **Shopping:** Auto-generated list grouped by aisle (produce, meat/dairy, pantry, snacks) with dismiss and copy-to-AnyList support
- **Family:** Child management, settings, data export/import

### Key Interactions
- **Meal Check-In:** After a meal, tap through each food and log whether the child ate none/some/all. Multi-child mode shows per-child toggles
- **Quick Sort:** Card-stack interface to rapidly categorize uncategorized foods
- **Food Discovery:** Log a new food tried at a restaurant with one action (creates food + plan + serving)
- **Preference Badges:** Each food shows per-child preference icons (loves/likes/meh/dislikes) computed from the last 6 months of servings

### Multi-Child Support
- Full per-child data for plans, servings, and preferences
- Shared household data for foods, combos, and shopping
- "Same meal" toggle to plan one meal for all children at once (independently editable per child)
- Auto-migration from single-child to multi-child data format

### Balance & Streaks
- A "balanced day" requires at least one carb, protein, fruit, and veggie across all meals
- Balanced meal streak counter on the Today screen
- Exposure tracking toward the 15-try acceptance threshold

## Architecture Notes

- All state managed through a single `useReducer` with ~20 action types
- Expensive computations (exposures, streaks, stats) wrapped in `useMemo`
- Two-tier migration system runs on app start: rating-to-serving migration and single-to-multi-child migration
- Service worker versioned at `meal-tracker-v17.8`, pre-caches app shell and CDN resources
- Date handling uses `toLocaleDateString('en-CA')` to avoid UTC timezone displacement

## Planned Features

- **Dedicated daily check-in flow:** A fast end-of-day "How'd it go?" screen to rate each food from today's meals, designed to feel routine and game-like
- **More personality and motivation:** Streak counters, "new foods tried this month" stats, progress visualizations
- **Stock check during meal check-in:** When logging how much the children ate, also prompt about remaining stock for each food (e.g. "running low?" / "out?"). Keeps the pantry accurate without a separate step.
- **Two-parent data sync:** A free mechanism for two parents to share the same household data across phones. Needs to be zero-cost — possible approaches include a shared cloud document (e.g. JSON in Google Drive/iCloud), peer-to-peer sync via WebRTC, or a lightweight free-tier service like Firebase Realtime Database or Supabase. Requires further research.
- **UI polish:** Continued refinement of the bottom tab bar and mobile-first interactions

## Decision Log

### Two-parent data sync — chose Firebase Realtime Database (2025-02-24)

**Options evaluated:**
1. **Shared JSON file (Google Drive/iCloud)** — Simple concept, but PWAs can't auto-read from cloud folders. Would require a manual file picker tap each sync, adding friction. iCloud has no web API at all.
2. **Free paste endpoint (jsonbin.io / Cloudflare Worker)** — Simpler to build, no OAuth, but requires a manual "Push" / "Pull" tap per sync. Not ideal for a daily-habit app.
3. **Firebase Realtime Database** — More setup upfront, but real-time auto-sync after initial pairing. Free Spark plan is more than sufficient (1GB storage, 10GB/month transfer). Best long-term UX.

**Decision:** Firebase. The automatic sync is worth the setup cost for an app meant to be used daily by two parents.

**Firebase concern — API keys in public repo:** Firebase web config keys are designed to be public (client-side identifiers, not secrets). Security comes from Firebase Security Rules (server-side) and API key domain restrictions (Google Cloud Console). Google's automated repo scanning sends warning emails, but this is a false alarm when the key is properly restricted. Domain-restrict the key to the GitHub Pages URL.

**Setup status (in progress):**
- [x] Firebase project created: `cd-meal-tracker`
- [x] Web app registered
- [x] Realtime Database created (`https://cd-meal-tracker-default-rtdb.firebaseio.com`)
- [ ] Security rules published
- [ ] Google Sign-In enabled in Authentication
- [ ] API key restricted to GitHub Pages domain
- [ ] Code integration into `index.html`

**Firebase config (already generated):**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCWPs2eVMJSCzG3f0YLMjL_PCT7ozYnCjM",
  authDomain: "cd-meal-tracker.firebaseapp.com",
  databaseURL: "https://cd-meal-tracker-default-rtdb.firebaseio.com",
  projectId: "cd-meal-tracker",
  storageBucket: "cd-meal-tracker.firebasestorage.app",
  messagingSenderId: "263676843677",
  appId: "1:263676843677:web:caba9df37c4ff11c67e674",
  measurementId: "G-LKC3LDHSXV"
};
```

**Next steps for code integration:**
- Add Firebase SDK CDN imports (firebase-app, firebase-auth, firebase-database)
- Build auth flow: Google Sign-In button in Family/Settings
- Build household pairing: create household → share code → join household
- Build sync logic: on state change write to Firebase, on app open read and merge
- Conflict resolution: per-record timestamp merge (newer version of each food/plan/serving wins)
