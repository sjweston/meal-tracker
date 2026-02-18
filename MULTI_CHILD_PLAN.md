# Multi-Child Support: Implementation Plan

## The Big Picture

Right now the app assumes one kid. Every food, meal plan, serving record, and preference score lives in a single flat namespace. To support families with multiple children, we need to answer one core question for every piece of data: **is this shared across the household, or specific to a child?**

Here's the split:

| Shared (Household-level) | Per-Child |
|---|---|
| Foods (pantry + library) | Meal plans |
| Food categories & notes | Servings (eating records) |
| Stock levels | Preference scores (computed from servings) |
| Combos (meal templates) | Exposure counts (computed from servings) |
| Shopping list | Streaks & stats |
| Food memory | |

This aligns with your spec: one pantry, one library, but each child has their own relationship with food.

---

## Data Model Changes

### New: `children` array

Stored as a new IndexedDB key. Minimal shape:

```js
// New top-level state field: children
{
  id: 'ch_abc123',
  name: 'Milo',
  emoji: '🦊',        // optional avatar — quick visual ID in the UI
  order: 0,           // display order
  createdAt: '2026-02-18'
}
```

### New: `settings` object

```js
{
  sameMealDefault: true,  // when true, planning a meal auto-copies to all children
  activeChildId: null,    // last-viewed child (for restoring state on app reopen)
}
```

### Modified: `MealPlan`

Currently:
```js
{ id, date, meal, foodIds }
```

Becomes:
```js
{ id, date, meal, childId, foodIds }
```

The `childId` field ties a meal plan to a specific child. When `sameMealDefault` is on and a user plans a meal, we create one MealPlan record per child — but each is independently editable afterward. This is key to supporting "same base meal, but Johnny doesn't get the broccoli."

### Modified: `Serving`

Currently:
```js
{ id, foodId, date, meal, eaten }
```

Becomes:
```js
{ id, foodId, date, meal, childId, eaten }
```

This is the most important change. Preferences are *computed from servings*, so making servings per-child automatically makes the entire preference/rating system per-child. No changes needed to the `getPreferenceScore()` function itself — it just needs to receive child-filtered servings.

### Unchanged: `Food`, `Combo`, `FoodMemory`

These stay exactly as they are. The pantry is the pantry. A food's categories, notes, and stock level are household facts, not opinions. Combos (meal templates) are also household-level — though when applied, they create per-child meal plans.

---

## Migration Strategy

This needs to be seamless for existing single-child users.

**On first load after the update:**

1. Detect: no `children` array exists in IndexedDB
2. Auto-create a single default child: `{ id: 'default', name: 'My Child', order: 0 }`
3. Backfill `childId: 'default'` onto every existing MealPlan and Serving record
4. Set `settings.sameMealDefault = true`
5. Prompt the user (gently, not blocking) to name their child and optionally add more

This means existing users see zero disruption. Their data just works. The child selector only becomes prominent once they add a second child.

**Export/Import format bumps to v4**, adding `children` and `settings` fields. v3 imports would go through the same migration path.

---

## UI Changes

### 1. Child Selector (Header Bar)

When 2+ children exist, show a horizontal pill selector in the header area:

```
[ 🦊 Milo ]  [ 🐸 Ellie ]  [ + ]
```

Tapping a name switches the "active child" context. Everything below — meals, check-ins, stats — filters to that child. The pantry and library views remain unfiltered (they're household-level).

For single-child families: the selector is hidden entirely. No clutter.

**Where it lives:** Directly below the top nav / above the view content. Sticky so it's always visible when scrolling. Alternatively, if the bottom tab bar from your CLAUDE.md roadmap is implemented, the child selector could sit in the header area that's freed up.

### 2. Meal Planner Changes

**With `sameMealDefault: ON` (default):**

- User plans a meal the same way they do now — open the picker, toggle foods
- Behind the scenes, this creates/updates a MealPlan for *every* child
- The planner shows the "base meal" by default
- A small per-child modification affordance appears: tap a child's avatar next to the meal card to see/edit their specific version
- Removing a food from one child's version doesn't affect others

Visual concept for the daily planner:

```
┌─────────────────────────────┐
│  Lunch                      │
│  🍗 Chicken  🥦 Broccoli   │
│  🍚 Rice     🍎 Apple      │
│                             │
│  🦊 ✓   🐸 -🥦            │  ← child status row
└─────────────────────────────┘
```

The child status row shows: Milo has the full meal (checkmark), Ellie has the same meal minus broccoli. Tapping a child's icon opens their specific version for editing.

**With `sameMealDefault: OFF`:**

- Each child gets their own meal card in the planner
- Planning is fully independent per child
- More work for the parent, but necessary for families with very different eaters (e.g., different age groups)

### 3. Meal Check-In Changes

The "How was lunch?" flow now needs a child dimension. Two approaches, depending on `sameMealDefault`:

**Same meal mode:** Show all children together in one check-in flow. For each food, show a row of child avatars with eaten toggles:

```
Chicken 🍗
  🦊 Milo:  [None] [Some] [All ✓]
  🐸 Ellie: [None] [Some ✓] [All]

Broccoli 🥦
  🦊 Milo:  [None ✓] [Some] [All]
  (Ellie didn't have this — skip)
```

This is fast because you're looking at the same meal and just noting differences per kid.

**Independent meal mode:** Check in one child at a time. Show a child selector at the top of the check-in modal, same flow as today per child.

### 4. Today View / Stats

Stats become per-child by default:

- **Balanced streak**: calculated per child (each child's meals assessed independently)
- **Accepted foods**: per child (based on their servings)
- **New foods tried**: per child

But we could also add a **household summary** card:
- "3 new foods tried across both kids this week"
- "Milo: 14-day balanced streak 🔥 | Ellie: 3-day streak"

### 5. Pantry & Library

These stay global. No child filtering. But there's one useful addition:

**Per-child preference badges on food cards.** When viewing a food in the pantry, show each child's preference as small icons:

```
┌────────────────────────────┐
│  Broccoli        🥦 Veggie │
│  🦊❤️  🐸👎               │  ← Milo loves it, Ellie dislikes it
│  In stock                  │
└────────────────────────────┘
```

This is pure UI — the preference data is already per-child (computed from child-filtered servings). We just display multiple badges.

### 6. Shopping List

Stays household-level. One potential enhancement: if a food is disliked by *all* children (not just one), exclude it. Currently it excludes foods disliked by "the child" — we'd change this to exclude only if universally disliked.

### 7. Settings Screen

New section: **Family**

- List of children (reorderable, editable name/emoji)
- Add child button
- Remove child (with confirmation and clear warning about data loss)
- Toggle: "Plan the same meal for all kids by default"

---

## Reducer / Action Changes

Most existing actions stay the same. Key changes:

| Action | Change |
|---|---|
| `TOGGLE_FOOD_IN_MEAL` | Accepts `childId`. When `sameMealDefault` is on, the UI dispatches this once per child. |
| `LOG_SERVING` | Requires `childId` |
| `LOG_SERVINGS_BATCH` | Each entry includes `childId` |
| `DISCOVER_FOOD` | Creates servings for the active child (or prompts which child tried it) |
| `APPLY_COMBO` | When `sameMealDefault` is on, applies to all children |
| New: `ADD_CHILD` | Adds a child to the children array |
| New: `UPDATE_CHILD` | Updates name, emoji, order |
| New: `REMOVE_CHILD` | Removes child + all their meal plans and servings |
| New: `UPDATE_SETTINGS` | Updates settings object |
| New: `COPY_MEAL_TO_CHILD` | Copies one child's meal plan to another for a given date+meal |

### Helper function changes:

```js
// Before:
getPreferenceScore(foodId, servings)

// After — just filter before calling:
getPreferenceScore(foodId, servings.filter(s => s.childId === activeChildId))
```

Same pattern for exposure count, streak calculation, etc. The functions themselves don't change — they just receive pre-filtered data.

---

## Implementation Order

I'd break this into 4 phases to keep each one shippable and testable:

### Phase 1: Data layer + migration (no UI changes yet)
- Add `children` and `settings` to state
- Write migration function (auto-create default child, backfill childId)
- Update export/import to v4 format
- Add `childId` to MealPlan and Serving in the reducer
- All existing behavior still works — single child, no visible changes

### Phase 2: Child management UI
- Settings screen: add/edit/remove children
- Child selector bar (appears when 2+ children exist)
- `activeChildId` in state, filters views accordingly
- Today view, planner, and check-in filter by active child

### Phase 3: Same-meal-default workflow
- Implement the "plan once, create for all" behavior
- Per-child modification UI on meal cards
- Multi-child check-in flow
- Combo application creates per-child plans

### Phase 4: Polish & household insights
- Per-child preference badges in pantry/library
- Household summary stats on Today view
- Shopping list logic update (exclude only universally disliked)
- Edge cases: what happens when you add a new child mid-week? (Backfill empty plans? Leave blank? Probably leave blank.)

---

## Edge Cases & Design Decisions

**Q: What if a parent removes a child?**
Soft-delete is tempting but overkill for this app. Hard delete the child, their meal plans, and their servings. Confirm with a serious modal. The food library is unaffected.

**Q: What about the weekly heatmap?**
Show it per active child. The heatmap colors reflect that child's category coverage. Could add a "combined" view later but it's not essential for v1.

**Q: Can children share a serving record?**
No. Even if both kids ate the same meal, they get separate serving records. This is important because one might eat "all" of the broccoli and the other "none." The whole point is per-child preference tracking.

**Q: What about the QuickSort view (categorizing uncategorized foods)?**
Stays global. Categories are a property of the food, not the child.

**Q: Max number of children?**
No hard limit, but the UI works best with 2-4. The horizontal pill selector would get cramped beyond that. Cross that bridge if someone actually has 6 kids.

**Q: What's the default child name?**
For existing single-child users migrating: "My Child" with a prompt to rename. For new users: require a name during onboarding (or first-run setup if we add that).
