# Meal Tracker App Overview

A professional-grade Progressive Web App (PWA) designed to help parents manage picky eating through data-driven exposure tracking, balanced meal planning, and streamlined grocery management.

## 🎯 The Goal
The primary objective of this app is to transform mealtime from a source of stress into a structured process. It focuses on the **"Exposure Rule"** (the idea that children need 15-20 exposures to a food before acceptance) and provides a visual way to ensure nutritional balance across the week.

---

## ✨ Feature List

### 1. Unified Dashboard (Today Tab)
*   **Balanced Streak:** A daily counter that tracks how many consecutive days your son has had a "Balanced Day" (at least one Carb, Protein, Fruit, and Veggie across his main meals).
*   **Dinner Check-in:** A fast, game-like flow triggered after meals to rate today's foods.
*   **Dining Out Discovery:** A dedicated button to log new foods tried at restaurants without adding them to your home pantry/grocery list.
*   **Quick Sort (⚡ Mode):** A "card stack" interface that surfaces any uncategorized or unrated foods, allowing you to swipe through and update your library in seconds.

### 2. Dual-Layer Inventory
*   **The Pantry:** An "Active" view showing only what is currently in your kitchen (In Stock or Low Stock).
*   **The Library:** A master database of every food ever tried.
*   **Batch Import:** Ability to paste a list of foods (comma or newline separated). The app uses **Food Memory** to automatically restore categories and preferences for items you've added in the past.

### 3. Smart Meal Planner
*   **Daily View:** Large, thumb-friendly cards for planning specific days.
*   **Weekly Grid:** A bird's-eye view heatmap that uses icons to show which nutritional categories are covered (Brand Blue) or missing (Subtle Gray) for the entire week.
*   **Combos:** Save frequent pairings (e.g., "The Usual": Chicken + Rice + Broccoli) to drop them into a meal slot with one tap.

### 4. Advanced Shopping List
*   **Automated Needs:** Generates a list based on what is "Low/Out" or required for upcoming planned meals.
*   **Aisle Sorting:** Automatically groups items by aisle (Produce, Meat/Dairy, Pantry, etc.).
*   **AnyList Bridge:** A "Copy to AnyList" button that formats the list into clean text for easy pasting into your shared grocery app.

### 5. Picky Eating Intelligence
*   **Exposure Progress:** A visual progress bar on every food item showing how close it is to the "15-try" acceptance milestone.
*   **Source Tracking:** Differentiates between "Home" preferences and "Outside" preferences.
*   **Preference Icons:** Custom Phosphor icons using a professional palette (❤️ Loves, 👍 Likes, 😐 Neutral, 👎 Dislikes).

---

## 🎨 Visual Identity (Custom Palette)
The app uses a sophisticated, non-juvenile color palette:
*   **Primary Blue (`#167188`):** Navigation, Covered categories, Positive actions.
*   **Deep Teal (`#0D4250`):** Headers, Dislikes, High-contrast text.
*   **Accent Coral (`#FF6B6B`):** Loves, Out of stock, Progress bars.
*   **Neutral Gray (`#7E7F7F`):** Secondary info, Missing categories, Meh ratings.

---

## 🛠 Technical Architecture
*   **Hosting:** GitHub Pages (Serverless).
*   **Storage:** **IndexedDB** (Professional browser database). Data is saved locally on the device and persists even if the browser cache is cleared.
*   **Offline Support:** Service Worker (Caching app shell and CDN resources).
*   **Framework:** React 18 (Functional components with Hooks).

---

## ⚠️ Known Problems & Solutions

### 1. The "White Screen of Death"
*   **The Problem:** The app fails to load, showing a blank white screen. 
*   **The Cause:** Usually caused by a "Null Pointer" error during the **Streak Calculation**. If a meal plan refers to a food ID that was deleted or has corrupted data, the logic crashes.
*   **The Status:** **Hardened.** Version v27+ includes "Safety Guards" (`?.`) that skip invalid data instead of crashing.
*   **Manual Fix:** If it persists, go to `Settings -> Safari -> Advanced -> Website Data`, find `github.io`, and delete it. (Note: This wipes your data, so use it as a last resort).

### 2. The Missing/Green Icon
*   **The Problem:** The app shows a solid green square or a generic screenshot instead of the custom icon on the iPhone home screen.
*   **The Cause:** iOS caches icons based on the URL. If the initial download fails, it stops looking. Also, GitHub Pages subfolders (e.g., `/meal-tracker/`) require absolute paths.
*   **The Status:** **Fixed in Code.** Paths have been updated to `/meal-tracker/` and the icon tags moved to the top of the file for priority loading.
*   **Manual Fix:** Delete the Home Screen icon, clear Safari Cache, refresh the URL twice, and re-add to the Home Screen.

### 3. Timezone Displacement
*   **The Problem:** App thinks it is Monday when it is actually Sunday evening.
*   **The Cause:** Use of `toISOString()`, which defaults to UTC (Greenwich Mean Time). 
*   **The Status:** **Fixed.** The app now uses `toLocaleDateString('en-CA')` to ensure "Today" always matches your phone's local clock.

### 4. Offline Access (Laptop must be open)
*   **The Problem:** App won't open if the laptop server is closed.
*   **The Cause:** The Service Worker hasn't "activated" yet.
*   **The Status:** **Resolved via GitHub Hosting.** Moving to GitHub Pages allows the phone to fetch updates independently of the laptop. **Double-reopening** the app is required to "swap" versions.