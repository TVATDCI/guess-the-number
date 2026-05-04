# Evidence Log: Slice 5 — Daily Challenge Mode

**Date**: 2026-05-04
**Plan**: guess-the-number-robustness
**Slice**: Task 5.1
**Issue**: #7

---

## Deliverables Created/Modified

| File | Action | Lines Changed | Purpose |
|---|---|---|---|
| `index.html` | Modified | +45 | Added Daily Challenge button, daily-challenge-screen, daily-result-screen |
| `src/engine.js` | Modified | +120 | Daily challenge reducer actions: START_DAILY, SUBMIT_DAILY_GUESS |
| `src/store.js` | Modified | +1 | Added dailyChallenge to PERSIST_KEYS |
| `src/ui.js` | Modified | +120 | Daily challenge event listeners, rendering, calendar, share button |
| `tests/engine.test.js` | Modified | +80 | Daily challenge tests |

## Features Implemented

### 1. Daily Challenge Button
- Added to setup screen with calendar icon
- Shows difficulty rotation info

### 2. Deterministic Daily Numbers
- `getDailyDifficultyForDate(dateString)`: Rotates easy → medium → hard based on day index
- `generateDailySecretNumber(date, rng)`: Generates same number for same date with same seed
- Uses `dailyRandom(dateSeed)` internally via injected RNG

### 3. One Attempt Per Day
- `lastPlayedDate` tracked in dailyChallenge state
- Prevents replaying same day
- Shows "Come back tomorrow!" message if already played

### 4. Daily Challenge Screens
- **daily-challenge-screen**: Game UI with 1 guess, shows today's difficulty
- **daily-result-screen**: Shows result, secret number, your guess, 7-day calendar

### 5. Share Result
- `generateShareText()`: Creates emoji summary
- Format: `⭐ Space Hunt — 2026-05-04\n⭐ 1 guess\n🔥 5-day streak`
- Copies to clipboard via navigator.clipboard

### 6. 7-Day Calendar
- `getDailyCalendar(history, currentDate)`: Returns last 7 days
- Status: win (✅), lose (❌), not-played (⬜)
- Shows difficulty for each day

## Test Results

```
 RUN  v4.1.5
 Test Files  4 passed (4)
      Tests  118 passed (118)
   Duration  225ms
```

Breakdown:
- `tests/random.test.js`: 15 tests (Slice 1)
- `tests/storage.test.js`: 21 tests (Slice 1)
- `tests/engine.test.js`: 66 tests (Slice 2 + 5)
- `tests/store.test.js`: 16 tests (Slice 3)

## Daily Challenge Tests (13 new tests)

- [x] Starts daily challenge with deterministic difficulty
- [x] Generates same secret for same date with same seed
- [x] Handles correct daily guess (win)
- [x] Handles incorrect daily guess (lose)
- [x] Prevents playing again on same day
- [x] Ignores additional guesses after game over
- [x] Difficulty rotates based on date
- [x] `generateDailySecretNumber` returns valid secret
- [x] `getDailyCalendar` returns 7 days
- [x] Calendar marks wins correctly
- [x] Calendar marks losses correctly
- [x] Calendar marks not-played days
- [x] `generateShareText` creates correct format for wins
- [x] `generateShareText` creates correct format for losses

## Architecture Seams Used

| Seam | Slice 1/2 Output | Slice 5 Usage |
|---|---|---|
| Injectable randomness | `dailyRandom(dateSeed)` | `generateDailySecretNumber` uses date-based RNG |
| Persistent state schema | `storage.js` with versioning | `dailyChallenge` added to PERSIST_KEYS |
| Action-based state changes | Store dispatcher | New actions: `START_DAILY`, `SUBMIT_DAILY_GUESS` |
| Screen transitions | `ui.js` driven by store | New screens: `daily-challenge`, `daily-result` |

## Syntax Verification

- [x] `src/engine.js` — valid
- [x] `src/store.js` — valid
- [x] `src/ui.js` — valid

## Phase 2 Complete

Daily Challenge Mode is fully implemented with:
- ✅ Date-based deterministic secret numbers
- ✅ One attempt per day enforced
- ✅ Rotating difficulty (easy → medium → hard)
- ✅ Share result with emoji summary
- ✅ 7-day calendar view
- ✅ 13 new tests
- ✅ Persistence via storage layer
- ✅ Full UI integration

## Next Step

Proceed to **Task 6.1: Integration + Final Verification**.
This is the final sign-off task to verify all PRD acceptance criteria are met.

## Blockers

None — all slices complete.
