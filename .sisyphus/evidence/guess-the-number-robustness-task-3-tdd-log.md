# Evidence Log: Slice 3 — State Store + UI Refactor

**Date**: 2026-05-04
**Plan**: guess-the-number-robustness
**Slice**: Task 3.1
**Issue**: #5

---

## Deliverables Created

| File | Lines | Purpose |
|---|---|---|
| `src/store.js` | 84 | Dispatcher/subscriber store with auto-persistence and timer management |
| `src/ui.js` | 443 | Thin DOM adapter — zero game logic, pure rendering and event wiring |
| `tests/store.test.js` | 120 | 16 integration tests for store → engine → storage round-trip |

## Architecture

### Store (`src/store.js`)
- **Pattern**: Dispatcher/Subscriber
- **State**: Single mutable state object (only layer allowed to mutate)
- **Actions**: Dispatched to `gameReducer` with injected RNG
- **Persistence**: Auto-saves `PERSIST_KEYS` to storage on every state change
- **Timer**: Managed in store closure — `startTimer()` / `clearTimer()`
  - Timer leak **FIXED**: interval ID stored in closure, cleared on game over / screen change
- **Load**: Restores persisted state on creation

### UI (`src/ui.js`)
- **Zero game logic**: All decisions made by engine, rendering driven by state diffs
- **Event wiring**: DOM events dispatch actions to store
- **Animations**: Triggered by comparing `prevState → state`
  - Win: confetti + dance + sound
  - Correct guess: dance
  - Wrong guess: shake
- **Screen transitions**: Driven by `state.screen` value
- **Theme application**: CSS variables, text content updates

## Key Fixes vs Original

1. **Timer leak**: Original stored `timerInterval` in `gameState` object; UI layer directly managed it. Now store manages interval ID in closure, clears on `isGameOver` or screen change.
2. **Reset jank**: Original called `location.reload()`. Now `RESET_PROGRESS` dispatches clean state transition, UI re-renders without reload.
3. **State persistence**: Original scattered `localStorage` calls across win/lose/reset handlers. Now centralized in store's `persist()` function.

## Test Results

```
 RUN  v4.1.5
 Test Files  4 passed (4)
      Tests  105 passed (105)
   Duration  208ms
```

Breakdown:
- `tests/random.test.js`: 15 tests (Slice 1)
- `tests/storage.test.js`: 21 tests (Slice 1)
- `tests/engine.test.js`: 53 tests (Slice 2)
- `tests/store.test.js`: 16 tests (Slice 3)

## Test Coverage Areas

- [x] Store initializes with default state
- [x] Store dispatches actions and updates state
- [x] Subscribers notified on state change
- [x] Unsubscribing works
- [x] Persistence of totalWins, streak, highScore, mathLevel
- [x] Loading persisted state on creation
- [x] Theme persistence
- [x] Timer toggle persistence
- [x] No persistence of game-specific state (secretNumber, guessesLeft)
- [x] RESET_PROGRESS clears storage
- [x] Timer tick handling
- [x] Store works without storage
- [x] Store uses injected RNG

## Changes to Existing Files

- `src/engine.js`: Added `TIMER_TOGGLE` and `SET_THEME` action handlers (2 new cases in reducer)
- No changes to `game.js` (old monolith still present, will be removed in Slice 4)

## Next Step

Proceed to **Slice 4: Final Integration & Verification** (Issue #6).

This slice will:
- Create `src/main.js` as entry point
- Update `index.html` to use new module system
- Delete `game.js`
- Run full manual QA checklist
- Update README

## Blockers

None — Slice 3 is complete and stable.
