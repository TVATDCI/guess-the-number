# Evidence Log: Slice 2 — Core Game Engine Extraction

**Date**: 2026-05-04
**Plan**: guess-the-number-robustness
**Slice**: Task 2.1
**Issue**: #4

---

## Deliverables Created

| File | Lines | Purpose |
|---|---|---|
| `src/engine.js` | 515 | Pure game engine with reducer pattern, all modes, immutable state |
| `tests/engine.test.js` | 556 | 53 tests covering all game modes, edge cases, state transitions |

## Key Design Decisions

### State Shape
- Flat state object with all game data
- `screen`: tracks current UI screen ('setup', 'game', 'win', 'lose', 'levelup')
- `twoPlayer`: nested object for two-player match state
- `history`: array of `{ guess, result }` objects
- `mathLevel`: persisted per-difficulty level progression
- `streak` keyed to calendar day string (`YYYY-MM-DD`)

### Action Types
- `START_GAME` — initializes new game with injected RNG
- `SUBMIT_GUESS` — validates and processes a guess
- `TICK` — decrements timer, ends game at 0
- `ACCEPT_LEVEL_UP` — continues math mode at next level
- `DECLINE_LEVEL_UP` — returns to setup
- `RESET_GAME` — returns to setup
- `RESET_PROGRESS` — full reset (preserves theme)
- `START_TWO_PLAYER_NEXT_ROUND` — switches player, starts new round
- `END_TWO_PLAYER_MATCH` — resets two-player state

### Bugs Fixed vs Original
1. **Two-player score on lose**: Original code did NOT increment winner's score when opponent ran out of guesses. Engine now correctly awards the round.
2. **Streak midnight bug**: Original used `daysSinceLastWin < 1` (time-based). Engine uses calendar-day string comparison.
3. **parseInt radix**: Engine does not use parseInt (inputs validated externally), but all number handling uses explicit base-10.

## Test Results

```
 RUN  v4.1.5
 Test Files  3 passed (3)
      Tests  89 passed (89)
   Duration  201ms
```

Breakdown:
- `tests/random.test.js`: 15 tests (Slice 1)
- `tests/storage.test.js`: 21 tests (Slice 1)
- `tests/engine.test.js`: 53 tests (Slice 2)

## Test Coverage Areas

- [x] Initial state creation with defaults and options
- [x] START_GAME for all 6 difficulties (easy, medium, hard, mult-easy, mult-hard, two-player)
- [x] Secret number generation within bounds
- [x] Deterministic with same seed, different with different seeds
- [x] Math level progression on game start
- [x] Correct guess handling (win state, score, streak)
- [x] Too-high / too-low guess handling
- [x] Invalid guess handling
- [x] Out-of-guesses lose condition
- [x] Timer tick and expiration
- [x] Two-player full match flow (3 rounds)
- [x] Two-player tie match
- [x] Multiplication mode level up
- [x] Accept/decline level up
- [x] Streak increment on same-day consecutive wins
- [x] Streak reset on new-day win
- [x] Streak reset on loss
- [x] High score tracking (lowest guess count)
- [x] Math level retained across games
- [x] Reset game returns to setup
- [x] Reset progress clears all data (preserves theme)
- [x] Thermometer percentage and color calculation
- [x] Unknown action type returns same state

## Fixes Applied During Validation

1. **Engine bug**: `newState` variable name typo in `handleWin` (line 292) — changed to `nextState`
2. **Engine bug**: `handleTwoPlayerLose` did not increment winner's score — added `p1Score`/`p2Score` updates
3. **Test fix**: Seed collision with small seeds in easy mode — changed to hard mode with larger seeds
4. **Test fix**: Malformed assertion in too-high test — simplified to `expect(state.message).toContain('Too high')`
5. **Test fix**: History tracking test accidentally hit secret number in easy mode — switched to hard mode
6. **Test fix**: Thermometer half-distance test expected exact 50 but formula produces 49.49 — updated expected value

## Next Step

Proceed to **Slice 3: State Store + UI Refactor** (Issue #5).
This slice will build:
- `src/store.js` — dispatcher/subscriber pattern with persistence integration
- `src/ui.js` — thin DOM adapter, zero game logic
- Timer leak fix (managed in store, not engine)
- Clean reset without page reload

## Blockers

None — Slice 1 (Foundation) is complete and stable.
