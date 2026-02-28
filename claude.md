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
- **Family:** Child management, settings, data export/import, and Cloudflare sync

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
- **UI polish:** Continued refinement of the bottom tab bar and mobile-first interactions

## Decision Log

### Two-parent data sync — Firebase attempted and abandoned (2026-02-24)

**Firebase was chosen initially** for automatic real-time sync, but the Google OAuth setup proved too brittle for a PWA hosted on a custom domain. Issues encountered:
- Google Sign-In popup blocked on mobile Safari/iOS PWA mode
- `signInWithRedirect` attempted but still returned "requested action is invalid"
- Root cause unclear — likely OAuth consent screen or authorized domains misconfiguration that resisted multiple fix attempts

**Firebase code was fully removed** from `index.html` (SDK scripts, init block, sync helpers, sync effects, FamilySettingsView UI). The app is back to its pre-Firebase state.

**Firebase project still exists** (`cd-meal-tracker`) and could be revisited, but the setup overhead is not justified for a personal family app.

### Two-parent data sync — Cloudflare Workers + KV implemented (2026-02-28)

**Chosen approach: Cloudflare Workers + KV** — a tiny edge Worker acts as a shared key-value store. No OAuth, no popups, no accounts beyond a free Cloudflare login.

**How it works:**
- Worker URL is hardcoded as `SYNC_WORKER_URL` constant at the top of `index.html`; deployed at `https://meal-tracker-sync.weston-sara.workers.dev`
- Both parents enter the same family code (e.g. `SMITH42`) in Family → Sync settings — that's the only setup required
- Tapping "Sync Now" fetches the remote snapshot, merges it with local data, writes the merged result back, and updates local state
- No auth required at runtime — just a fetch to a public endpoint keyed by the family code
- Entirely within Cloudflare's free tier (100k requests/day, 1k writes/day, 1GB storage)
- Multiple families can share the same Worker using different codes

**Merge strategy (union with local-wins):**
- Foods, combos, children: union by `id`, local wins on conflict
- Plans: union by `(childId, date, meal)`, food IDs merged as a set
- Servings: union by `(foodId, date, meal, childId)`, local wins on conflict
- `foodMemory`, `shoppingDismissed`: shallow merge / union
- `settings`: never synced — each parent keeps their own prefs (activeChildId, familyCode, etc.)

**Known limitation:** No conflict detection. If both parents tap Sync at the exact same moment, the second write wins (last-writer-wins). Acceptable for a 2-person household app.

**Files added:** `worker.js` (the Worker), `wrangler.toml` (deploy config). Deploy with `wrangler deploy` after creating a KV namespace and pasting its ID into `wrangler.toml`.

### Stock update during meal check-in (2026-02-28)

Added Low/Out stock toggle buttons below each food card in `MealCheckInModal`. Dispatches `UPDATE_FOOD` for changed foods on Save. Works in both single and multi-child modes. Pre-populates current stock state so already-low/out foods show as selected.

### Past-day meal editing (2026-02-28)

`MealCheckInModal` now accepts a `date` prop instead of hardcoding today. Past-day editing lives in the **Planner** tab: navigate to a prior date with the `‹ ›` arrows, then tap any meal card that has foods planned — it opens the check-in modal instead of the food picker. A ✓ or ○ indicator on each meal card shows whether servings have been logged for that day. Today and future dates still open the food picker as normal.
