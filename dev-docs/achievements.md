# Achievement System Architecture

This document provides comprehensive documentation for the achievement system, covering architecture, configuration, and extension patterns.

## Table of Contents

1. [System Overview](#system-overview)
2. [Achievement Definitions](#achievement-definitions)
3. [Condition Evaluators](#condition-evaluators)
4. [Grid System](#grid-system)
5. [Database Schema](#database-schema)
6. [Visual Effects System](#visual-effects-system)
7. [State Management](#state-management)
8. [Key Files Reference](#key-files-reference)
9. [How-To Guides](#how-to-guides)

---

## System Overview

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ACHIEVEMENT SYSTEM                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────┐    ┌──────────────────┐    ┌─────────────────┐  │
│  │  Definition   │    │     Service      │    │     Store       │  │
│  │     Layer     │───▶│      Layer       │───▶│     Layer       │  │
│  └───────────────┘    └──────────────────┘    └─────────────────┘  │
│         │                     │                       │             │
│         │                     │                       ▼             │
│         │                     │              ┌─────────────────┐    │
│         ▼                     ▼              │    UI Layer     │    │
│  ┌─────────────┐     ┌──────────────┐       │  (Grid, Modals, │    │
│  │ achievement │     │ Repository   │       │   Celebrations) │    │
│  │ Library.ts  │     │    Layer     │       └─────────────────┘    │
│  └─────────────┘     └──────────────┘                              │
│                              │                                      │
│                              ▼                                      │
│                      ┌──────────────┐                              │
│                      │   SQLite DB  │                              │
│                      └──────────────┘                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Definition** → Static achievement data in `achievementLibrary.ts`
2. **Service** → Evaluates conditions, manages unlocks (`AchievementService.ts`)
3. **Repository** → Persists unlock/progress data to SQLite
4. **Store** → Zustand state management for UI reactivity
5. **UI** → Grid display, unlock animations, celebration modals

### Key Design Patterns

| Pattern | Implementation |
|---------|----------------|
| **Event-Driven** | Achievement checks triggered by task events (completion, creation, customization) |
| **Repository Pattern** | `AchievementRepository` abstracts database operations |
| **Seeded RNG** | Deterministic grid layout using LCG algorithm with user-specific seed |
| **Observer Pattern** | Services emit unlock events; stores subscribe for updates |
| **State Machine** | Grid cells transition: locked → visible → unlocked |

---

## Achievement Definitions

### Rarity Levels

| Rarity | Color | Confetti | Toast Duration |
|--------|-------|----------|----------------|
| **common** | `#6B7280` (gray) | none | 3000ms |
| **uncommon** | `#22c55e` (green) | none | 3500ms |
| **rare** | `#3b82f6` (blue) | burst | 4000ms |
| **epic** | `#8b5cf6` (purple) | fireworks | 5000ms |
| **legendary** | `#f59e0b` (gold) | rain | 6000ms |

### Categories (9 Total)

| Category | Display Name | Description |
|----------|-------------|-------------|
| `explorer` | Explorer | First actions (create task, first completion, customize) |
| `streak` | Streak | Consecutive day streaks on any single habit |
| `perfect` | Perfect Week | Perfect weeks with no missed habits |
| `consistency` | Consistency | Complete ALL habits for X consecutive days |
| `early_bird` | Early Bird | Complete before 6 AM |
| `time_based` | Time-Based | Evening/specific time completion patterns |
| `recovery` | Recovery | Comeback achievements after streak breaks |
| `habit_mastery` | Habit Mastery | Total completions milestones on single habits |
| `special` | Special | Holiday/seasonal and special occasions |

### Complete Achievement List

#### Explorer (5 achievements)

| ID | Name | Rarity | Condition | Prerequisites |
|----|------|--------|-----------|---------------|
| `explorer_first_task` | Journey Begins | common | Create first habit | - |
| `explorer_first_completion` | First Step | common | Complete first habit | - |
| `explorer_customize` | Personal Touch | common | Customize a habit | - |
| `explorer_5_habits` | Habit Collector | uncommon | Create 5 habits | - |
| `explorer_10_habits` | Habit Hoarder | rare | Create 10 habits | `explorer_5_habits` |

#### Streak (9 achievements)

| ID | Name | Rarity | Condition | Prerequisites |
|----|------|--------|-----------|---------------|
| `streak_7` | Week Warrior | common | 7-day streak | - |
| `streak_14` | Two Week Triumph | uncommon | 14-day streak | `streak_7` |
| `streak_21` | Three Week Foundation | rare | 21-day streak | `streak_14` |
| `streak_30` | Monthly Master | uncommon | 30-day streak | `streak_21` |
| `streak_66` | Habit Formed | epic | 66-day streak | `streak_30` |
| `streak_100` | Century Club | rare | 100-day streak | `streak_66` |
| `streak_200` | Two Hundred Club | epic | 200-day streak | `streak_100` |
| `streak_365` | Year of Dedication | legendary | 365-day streak | `streak_200` |
| `streak_500` | Marathon Runner | legendary | 500-day streak | `streak_365` |

#### Perfect (2 achievements)

| ID | Name | Rarity | Condition | Prerequisites |
|----|------|--------|-----------|---------------|
| `perfect_week_1` | Perfect Week | common | All habits for 1 week | - |
| `perfect_week_4` | Month of Perfection | rare | 4 perfect weeks | `perfect_week_1` |

#### Consistency (10 achievements)

| ID | Name | Rarity | Condition | Prerequisites |
|----|------|--------|-----------|---------------|
| `consistency_7` | All-Star Week | uncommon | All habits 7 days | - |
| `consistency_14` | Perfect Fortnight | rare | All habits 14 days | `consistency_7` |
| `consistency_30` | Perfect Month | epic | All habits 30 days | `consistency_14` |
| `consistency_66` | Identity Shift | legendary | All habits 66 days | `consistency_30` |
| `habit_stacker` | Habit Stacker | uncommon | 3+ habits in one day | - |
| `daily_domination` | Daily Domination | rare | 5+ habits in one day | `habit_stacker` |
| `stack_master` | Stack Master | rare | 3+ habits daily for 7 days | `habit_stacker` |
| `routine_architect` | Routine Architect | epic | 3+ habits daily for 21 days | `stack_master` |
| `neural_network` | Neural Network | epic | 5+ habits daily for 14 days | `daily_domination` |
| `habit_ecosystem` | Habit Ecosystem | legendary | 5+ habits daily for 66 days | `neural_network` |

#### Early Bird (3 achievements)

| ID | Name | Rarity | Condition | Prerequisites |
|----|------|--------|-----------|---------------|
| `dawn_patrol` | Dawn Patrol | uncommon | Complete before 6 AM (1 day) | - |
| `early_bird_7` | Early Bird | rare | Before 6 AM for 7 days | `dawn_patrol` |
| `early_riser` | Early Riser | rare | Before 6 AM for 14 days | `early_bird_7` |

#### Time-Based (1 achievement)

| ID | Name | Rarity | Condition | Prerequisites |
|----|------|--------|-----------|---------------|
| `night_owl` | Night Owl | rare | Complete after 10 PM for 7 days | - |

#### Recovery (3 achievements)

| ID | Name | Rarity | Condition | Prerequisites |
|----|------|--------|-----------|---------------|
| `phoenix_rising` | Phoenix Rising | uncommon | Resume within 2 days of break | - |
| `comeback_kid` | Comeback Kid | rare | Rebuild 7-day streak after losing 7+ | `phoenix_rising` |
| `never_say_die` | Never Say Die | epic | Rebuild 30-day streak after losing 14+ | `comeback_kid` |

#### Habit Mastery (7 achievements)

| ID | Name | Rarity | Condition | Prerequisites |
|----|------|--------|-----------|---------------|
| `mastery_25` | Habit Apprentice | common | 25 completions (single habit) | - |
| `mastery_50` | Habit Builder | uncommon | 50 completions | `mastery_25` |
| `mastery_100` | Habit Artisan | rare | 100 completions | `mastery_50` |
| `mastery_500` | Habit Master | epic | 500 completions | `mastery_100` |
| `mastery_1000` | Habit Legend | legendary | 1000 completions | `mastery_500` |
| `mastery_2000` | Habit Grandmaster | legendary | 2000 completions | `mastery_1000` |
| `lifetime_achievement` | Lifetime Achievement | legendary | 5000 total across all habits | - |

#### Special (8 achievements)

| ID | Name | Rarity | Hidden | Condition |
|----|------|--------|--------|-----------|
| `weekend_warrior` | Weekend Warrior | rare | No | Sat+Sun for 4 consecutive weeks |
| `special_new_year` | New Year Resolution | rare | Yes | Complete on Jan 1 |
| `special_valentines` | Valentine's Dedication | rare | Yes | Complete on Feb 14 |
| `special_summer_solstice` | Summer Solstice | rare | Yes | Complete on June 21 |
| `special_winter_solstice` | Winter Solstice | rare | Yes | Complete on Dec 21 |
| `special_halloween` | Spooky Streak | rare | Yes | Complete on Oct 31 |
| `special_leap_day` | Rare Occasion | epic | Yes | Complete on Feb 29 |
| `special_anniversary` | Anniversary | epic | No | Use app for 1 year |

**Total: 48 achievements**

### Achievement Definition Schema

```typescript
interface AchievementDefinition {
  id: string;                           // Unique identifier
  name: string;                         // Display name
  description: string;                  // User-facing description
  icon: string;                         // Icon name from ICON_MAP
  rarity: AchievementRarity;            // common | uncommon | rare | epic | legendary
  category: AchievementCategory;        // Category identifier
  condition: AchievementCondition;      // Evaluation condition
  prerequisiteIds?: string[];           // Must unlock these first
  hidden?: boolean;                     // Hidden until unlocked
}
```

---

## Condition Evaluators

The `AchievementService` evaluates conditions based on type. Each evaluator has specific parameters and logic.

### Condition Types (14 Total)

| Type | Parameters | Description |
|------|------------|-------------|
| `first_action` | `action: 'create_task' \| 'complete_task' \| 'customize_task'` | Checks if trigger matches action |
| `task_count` | `value: number` | Total distinct tasks created >= value |
| `streak_days` | `value: number` | Any single task's currentStreak >= value |
| `total_completions` | `value: number` | Single task completions >= value |
| `all_habits_streak` | `value: number` | ALL non-archived tasks completed X consecutive days |
| `perfect_week` | `value: number` | Equivalent to all_habits_streak(value * 7) |
| `early_completion` | `value: number, time: string` | Complete before HH:mm for X days |
| `evening_completion` | `value: number, time: string` | Complete after HH:mm for X days |
| `date_specific` | `date: string` | Current date matches MM-DD |
| `app_anniversary` | `value: number` | Years since oldest task creation >= value |
| `multi_habit_same_day` | `value: number` | X+ distinct habits completed same day |
| `multi_habit_streak` | `value: number, days: number` | X+ habits daily for Y consecutive days |
| `streak_recovery` | `value: number, minLostStreak: number` | Rebuild X-day streak after losing Y+ |
| `weekend_streak` | `value: number` | Consecutive weekends with Sat+Sun completed |
| `total_habits_completions` | `value: number` | Sum of completions across ALL habits |

### Evaluation Context

Conditions are evaluated with a context object:

```typescript
interface AchievementCheckContext {
  trigger: 'task_completion' | 'streak_update' | 'task_created' | 'task_customized' | 'app_open';
  taskId?: string;      // The task that triggered the check
  date?: string;        // YYYY-MM-DD format
  count?: number;       // For counting-based achievements
  time?: string;        // HH:mm format for time-based checks
}
```

---

## Grid System

### Configuration

The grid uses a version-based scaling system:

| Version | Size | Max Achievements | Status |
|---------|------|------------------|--------|
| 1 | 7×7 | 49 | **Current** |
| 2 | 8×8 | 64 | Planned |
| 3 | 10×10 | 100 | Future |

```typescript
// src/services/AchievementGridService.ts
export const GRID_CONFIGS: Record<number, GridConfig> = {
  1: { version: 1, size: 7, maxAchievements: 49 },
  2: { version: 2, size: 8, maxAchievements: 64 },
  3: { version: 3, size: 10, maxAchievements: 100 },
};
```

### Grid Cell States

| State | Visibility | Display |
|-------|------------|---------|
| `locked` | Hidden until adjacent unlock | Dark shade (35% accent darkness) |
| `visible` | Adjacent to unlocked cell | Light shade (15% accent darkness) |
| `unlocked` | Always visible | Transparent window showing background |

### Adjacency Logic

Cells use **4-directional adjacency** (up, down, left, right). A cell becomes `visible` when any adjacent cell is `unlocked`.

```
    [visible]
       ↑
[visible] ← [UNLOCKED] → [visible]
       ↓
    [visible]
```

### Starter Achievement Positioning

The `explorer_first_completion` achievement is always placed at the **grid center**:

- Version 1 (7×7): Position (3, 3)
- Version 2 (8×8): Position (4, 4)
- Version 3 (10×10): Position (5, 5)

### Seeded Randomization

Grid positions are deterministic per user using seeded random number generation:

**Seed Source**: User's oldest task creation date (or current timestamp fallback)

**Algorithm**: Linear Congruential Generator (LCG)
```typescript
// glibc-compatible parameters
a = 1103515245
c = 12345
m = 2^31

next = (a * current + c) % m
```

**Shuffle**: Fisher-Yates algorithm with seeded RNG

**Purpose**: Same user always sees same grid layout, even across app reinstalls (if seed persists).

---

## Database Schema

### Tables

#### `unlocked_achievements`

Stores unlocked achievement records.

```sql
CREATE TABLE unlocked_achievements (
  id TEXT PRIMARY KEY,
  achievement_id TEXT NOT NULL UNIQUE,
  unlocked_at TEXT NOT NULL,
  task_id TEXT,           -- Optional: task that triggered unlock
  metadata TEXT,          -- Optional: JSON extra data
  viewed INTEGER DEFAULT 0
);

CREATE INDEX idx_unlocked_achievement_id ON unlocked_achievements(achievement_id);
CREATE INDEX idx_unlocked_viewed ON unlocked_achievements(viewed) WHERE viewed = 0;
CREATE INDEX idx_unlocked_at ON unlocked_achievements(unlocked_at);
```

#### `achievement_progress`

Tracks progress toward incomplete achievements.

```sql
CREATE TABLE achievement_progress (
  id TEXT PRIMARY KEY,
  achievement_id TEXT NOT NULL UNIQUE,
  current_value INTEGER NOT NULL DEFAULT 0,
  target_value INTEGER NOT NULL DEFAULT 1,
  percentage INTEGER NOT NULL DEFAULT 0,
  last_updated_at TEXT NOT NULL
);

CREATE INDEX idx_progress_achievement_id ON achievement_progress(achievement_id);
```

#### `achievement_grid`

Persists grid layout.

```sql
CREATE TABLE achievement_grid (
  id TEXT PRIMARY KEY,
  seed TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  positions TEXT NOT NULL,  -- JSON array of AchievementGridPosition
  created_at TEXT NOT NULL
);

CREATE INDEX idx_achievement_grid_seed ON achievement_grid(seed);
```

### Migration Files

- `src/database/migrations/addAchievementsSupport.ts` - Creates unlocked/progress tables
- `src/database/migrations/addAchievementGridSupport.ts` - Creates grid table

---

## Visual Effects System

### Unlock Animation Sequence

The glass break animation runs in two phases totaling ~1100ms:

```
Phase 1: STRESS (0-400ms)     Phase 2: BREAK (400-1100ms)
┌─────────────────────┐       ┌──────────────────────────┐
│  Stress Fractures   │──────▶│    Glass Break Effect    │
│  - 5 hairline cracks│       │  - Impact at 500ms       │
│  - Cell trembles    │       │  - Crack visible         │
│  - Scale pulse      │       │  - Shards fall           │
└─────────────────────┘       └──────────────────────────┘
```

### Phase 1: Stress Fractures (0-400ms)

**Component**: `StressFractures.tsx`

- 5 hairline cracks radiate from center
- Cracks staggered over 0-300ms
- Crack length: 8-18px each
- Cell scale pulse: 1.0 → 1.03 → 1.0 → 1.05

### Phase 2: Glass Break (400-1100ms)

**Component**: `GlassBreakEffect.tsx`

Timeline:
- **0-100ms**: Tension building (cell scale increasing)
- **100ms**: **IMPACT** - Simultaneous:
  - Crack pattern visible
  - Haptic feedback
  - Sound effect plays
- **100-600ms**: Shards fall with gravity physics
- **600-700ms**: Settle to clean state

### Shard Configuration by Rarity

| Rarity | Shard Count | Success Haptic |
|--------|-------------|----------------|
| common | 8 | No |
| uncommon | 10 | No |
| rare | 12 | No |
| epic | 14 | No |
| legendary | 16 | Yes |

### Shard Physics

```typescript
// Per-shard parameters
angle: 0-360° (evenly distributed with 0.4 radian variance)
speed: 60-120 px/second (outward)
size: 10-20px
gravity: ~9.8 px/ms²
rotation: random spin
delay: 80ms cascade after impact
```

### Celebration Toast (Post-Break)

**Component**: `UnlockCelebration.tsx`

**Duration**: 4500ms (`CELEBRATION_DURATION`)

Timeline:
1. **0-150ms**: Container fade in
2. **0-300ms**: Card springs in (damping: 12, stiffness: 200)
3. **100-300ms**: Icon fades in
4. **200-600ms**: Glow ring fades
5. **300-700ms**: Text reveals (staggered)
6. **400ms+**: Confetti (based on rarity)
7. **2700-3000ms**: Fade out
8. *User can dismiss early via X button*

### Confetti Types

| Rarity | Confetti Style |
|--------|---------------|
| common | None |
| uncommon | None |
| rare | Burst explosion |
| epic | Fireworks pattern |
| legendary | Confetti rain |

### Timing Constants

```typescript
// src/components/achievements/GlassBreakEffect.tsx
export const STRESS_DURATION = 400;      // Anticipation phase
export const IMPACT_DELAY = 100;         // When crack appears
export const CRACK_FADE_DURATION = 250;  // Crack visibility
export const SHARD_DURATION = 500;       // Shard falling
export const TOTAL_DURATION = 700;       // Complete animation

// src/components/achievements/UnlockCelebration.tsx
export const CELEBRATION_DURATION = 4500;
```

---

## State Management

### Achievement Store

**File**: `src/store/achievementsStore.ts`

```typescript
interface AchievementsState {
  achievements: AchievementWithStatus[];
  pendingUnlocks: AchievementUnlockEvent[];
  stats: AchievementStats | null;
  loading: boolean;
  error: string | null;
}
```

**Key Actions**:
- `loadAchievements()` - Fetch all with status
- `checkForAchievements(context)` - Trigger evaluation
- `dismissPendingUnlock()` - Remove from modal queue
- `markAsViewed(ids)` - Mark as seen in DB
- `subscribeToUnlocks()` - Subscribe to service events

### Achievement Grid Store

**File**: `src/store/achievementGridStore.ts`

```typescript
interface AchievementGridStore {
  gridData: AchievementGridData | null;
  gridState: AchievementGridState | null;
  config: GridConfig;
  loading: boolean;
  error: string | null;
}
```

**Key Actions**:
- `initializeGrid()` - Load or create grid
- `refreshGrid(unlockedIds, records, progress)` - Rebuild with new status
- `getPositionForAchievement(id)` - Lookup position
- `resetGrid()` - Delete and recreate

---

## Key Files Reference

### Core Data & Types

| File | Purpose |
|------|---------|
| `src/data/achievementLibrary.ts` | Static achievement definitions |
| `src/types/achievements.ts` | TypeScript interfaces |
| `src/theme/achievements.ts` | Colors and celebration configs |

### Services

| File | Purpose |
|------|---------|
| `src/services/AchievementService.ts` | Achievement evaluation logic |
| `src/services/AchievementGridService.ts` | Grid generation & management |

### Stores

| File | Purpose |
|------|---------|
| `src/store/achievementsStore.ts` | Achievement state management |
| `src/store/achievementGridStore.ts` | Grid state management |

### Database

| File | Purpose |
|------|---------|
| `src/database/migrations/addAchievementsSupport.ts` | Achievement tables |
| `src/database/migrations/addAchievementGridSupport.ts` | Grid table |
| `src/database/repositories/AchievementRepository.ts` | CRUD operations |
| `src/database/repositories/AchievementGridRepository.ts` | Grid persistence |
| `src/database/repositories/interfaces/IAchievementRepository.ts` | Interface |
| `src/database/repositories/interfaces/IAchievementGridRepository.ts` | Interface |

### UI Components

| File | Purpose |
|------|---------|
| `src/components/achievements/AchievementGrid.tsx` | 7×7 grid display |
| `src/components/achievements/AchievementGridCell.tsx` | Individual cell with glass break |
| `src/components/achievements/GlassBreakEffect.tsx` | Shard physics (700ms) |
| `src/components/achievements/StressFractures.tsx` | Crack anticipation (400ms) |
| `src/components/achievements/CrackPattern.tsx` | Crack rendering |
| `src/components/achievements/GlassShard.tsx` | Individual shard physics |
| `src/components/achievements/UnlockCelebration.tsx` | Post-break toast |
| `src/components/achievements/AchievementDetailPanel.tsx` | Detail view |
| `src/components/achievements/AvailableAchievementsList.tsx` | Available list |
| `src/components/achievements/CompletedAchievementsList.tsx` | Completed list |

### Screens

| File | Purpose |
|------|---------|
| `src/screens/AchievementGridScreen.tsx` | Grid viewer |
| `src/screens/AchievementLibraryScreen.tsx` | Achievement browser |

### Hooks

| File | Purpose |
|------|---------|
| `src/hooks/useAchievements.ts` | Achievement custom hook |
| `src/hooks/useAchievementGrid.ts` | Grid custom hook |

### Assets

| File | Purpose |
|------|---------|
| `assets/sounds/achievement.wav` | Unlock sound effect |

---

## How-To Guides

### Adding a New Achievement

1. **Define the achievement** in `src/data/achievementLibrary.ts`:

```typescript
// Add to the achievements array
{
  id: 'my_new_achievement',
  name: 'Achievement Name',
  description: 'What the user did to earn this',
  icon: 'star',  // Must be a valid IconName from ICON_MAP
  rarity: 'rare',
  category: 'streak',
  condition: {
    type: 'streak_days',
    value: 50,
  },
  prerequisiteIds: ['streak_30'],  // Optional: must unlock these first
  hidden: false,  // Optional: hide until unlocked
},
```

2. **Verify the condition type** exists in `AchievementService.evaluateCondition()`

3. **Test the unlock flow**:
   - Create conditions that trigger the achievement
   - Verify it appears in the grid
   - Confirm unlock animation plays

### Creating a New Condition Evaluator

1. **Add the condition type** to `AchievementConditionType` in `src/types/achievements.ts`:

```typescript
export type AchievementConditionType =
  | 'existing_type'
  | 'my_new_condition';  // Add here
```

2. **Implement the evaluator** in `AchievementService.evaluateCondition()`:

```typescript
case 'my_new_condition':
  // Get required data
  const data = await this.getRelevantData();

  // Evaluate condition
  const isMet = data >= condition.value;

  // Optional: update progress for partial achievements
  if (!isMet && condition.value > 1) {
    await this.updateProgress(achievementId, data, condition.value);
  }

  return isMet;
```

3. **Add progress tracking** if the achievement is incremental (optional):
   - Use `this.updateProgress(id, current, target)` to save progress
   - Progress is automatically deleted when achievement unlocks

### Expanding Grid Size

The grid automatically scales based on achievement count. To manually trigger an upgrade:

1. **Update the version detection logic** in `AchievementGridService.getCurrentGridVersion()`:

```typescript
getCurrentGridVersion(): number {
  const count = achievementLibrary.length;
  if (count > 64) return 3;  // 10×10
  if (count > 49) return 2;  // 8×8
  return 1;                  // 7×7
}
```

2. **Add achievements** beyond the current capacity (49 for v1)

3. **Reset the grid** (optional for testing):
   - Call `achievementGridStore.resetGrid()` to regenerate

### Debugging Unlock Issues

1. **Check prerequisites**:
   - Open `AchievementService.checkForUnlockedAchievements()`
   - Add logging before `filterByPrerequisites()`

2. **Verify condition evaluation**:
   - Add logging in `evaluateCondition()` for your condition type
   - Check that context contains expected data

3. **Inspect database state**:
   - Check `unlocked_achievements` table for existing unlocks
   - Check `achievement_progress` table for tracked progress

4. **Force re-evaluation**:
   ```typescript
   await achievementsStore.checkForAchievements({
     trigger: 'task_completion',
     taskId: 'your-task-id',
   });
   ```

---

## Unlock Flow Diagram

```
Task Completion Event
        │
        ▼
Store.checkForAchievements(context)
        │
        ▼
AchievementService.checkForUnlockedAchievements()
        │
        ▼
┌───────────────────────────────────────┐
│ Filter Candidates                     │
│ - Not already unlocked               │
│ - Prerequisites met                   │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ For Each Candidate:                   │
│ ├─ evaluateCondition()               │
│ │  ├─ Check condition type           │
│ │  ├─ Query data (tasks, logs)       │
│ │  └─ Return boolean                 │
│ │                                     │
│ └─ If Condition Met:                 │
│    ├─ recordUnlock() → DB insert     │
│    ├─ deleteProgress() → cleanup     │
│    ├─ Create AchievementUnlockEvent  │
│    └─ notifyListeners()              │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ Store Updates:                        │
│ ├─ Add to pendingUnlocks             │
│ ├─ loadAchievements()                │
│ └─ loadStats()                       │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ UI Shows Modal:                       │
│ ├─ AchievementGridCell: Glass break  │
│ │  (1100ms total)                    │
│ ├─ UnlockCelebration: Toast & confetti│
│ │  (4500ms)                          │
│ └─ Grid refreshes with new state     │
└───────────────────────────────────────┘
```

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total Achievements | 48 |
| Categories | 9 |
| Rarity Levels | 5 |
| Condition Types | 14 |
| Grid Versions | 3 (1 active) |
| Database Tables | 3 |
| UI Components | 11 |
| Services | 2 |
| Zustand Stores | 2 |
