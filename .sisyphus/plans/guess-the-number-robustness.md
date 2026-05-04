# Execution Plan: Guess the Number — Robustness & Daily Challenge

**Plan file**: `.sisyphus/plans/guess-the-number-robustness.md`  
**PRD**: `.sisyphus/prds/guess-the-number-robustness-prd.md`  
**Started**: 2026-05-04

---

## TL;DR

Transform an 800-line vanilla JS game monolith into a layered, testable architecture. Phase 1 establishes a pure game engine with Vitest tests, a subscriber-based state store, and a thin DOM adapter. Phase 2 adds a Daily Challenge mode on the stabilized foundation. Five vertical slices, end-to-end testable, preserving all existing child-facing UI behavior.

---

## Waves

### Wave 1: Foundation + Engine (Slices 1–2)
**Goal**: Pure modules with test coverage before touching UI.

- **Slice 1**: Test runner + randomness + storage (enabling slice)
- **Slice 2**: Core game engine extraction (all modes, pure functions, ≥ 80% coverage)

### Wave 2: UI Refactor + Integration (Slices 3–4)
**Goal**: Replace monolith with store-driven UI, verify zero regression.

- **Slice 3**: State store + UI adapter (dispatcher/subscriber, action-driven DOM)
- **Slice 4**: Final integration, manual QA, cleanup

### Wave 3: New Feature (Slice 5)
**Goal**: First new feature on stabilized foundation.

- **Slice 5**: Daily Challenge Mode (date-seeded randomness, shareable results, 7-day calendar)

---

## Slices

### Task 1.1: Slice 1 — Foundation (Enabling Slice)
**GitHub Issue**: [#3](https://github.com/TVATDCI/guess-the-number/issues/3)

- **What**: Install Vitest; create `src/random.js` (default, seeded, daily randomness); create `src/storage.js` (localStorage wrapper with error handling, schema versioning, mock backend support)
- **Output**: `src/random.js`, `src/storage.js`, `tests/random.test.js`, `tests/storage.test.js`, `package.json` updated
- **Acceptance**: `npm test` runs; all new modules have unit tests; no changes to `game.js`
- **Blockers**: None
- **Evidence path**: `.sisyphus/evidence/guess-the-number-robustness-task-1-tdd-log.md`

### Task 2.1: Slice 2 — Core Game Engine
**GitHub Issue**: [#4](https://github.com/TVATDCI/guess-the-number/issues/4)

- **What**: Extract pure game logic from `game.js` into `src/engine.js`; support all modes; injectable randomness; immutable state; fix parseInt radix and math level persistence
- **Output**: `src/engine.js`, `tests/engine.test.js` (≥ 80% coverage, ≥ 20 tests total across all test files)
- **Acceptance**: All game modes unit-testable; streak keyed to calendar day; timer as explicit `tick()` action
- **Blockers**: Task 1.1
- **Evidence path**: `.sisyphus/evidence/guess-the-number-robustness-task-2-tdd-log.md`

### Task 3.1: Slice 3 — State Store + UI Refactor
**GitHub Issue**: [#5](https://github.com/TVATDCI/guess-the-number/issues/5)

- **What**: Create `src/store.js` (dispatcher/subscriber, auto-persistence); rewrite `src/ui.js` as thin action adapter; fix timer leak and reset jank; preserve all animations, sounds, screen flows
- **Output**: `src/store.js`, `src/ui.js`, `tests/store.test.js`, `tests/ui.test.js` (where feasible)
- **Acceptance**: Zero game logic in UI layer; all existing screens/animations functional; timer stops cleanly; reset does not reload page
- **Blockers**: Task 2.1
- **Evidence path**: `.sisyphus/evidence/guess-the-number-robustness-task-3-tdd-log.md`

### Task 4.1: Slice 4 — Final Integration & Verification
**GitHub Issue**: [#6](https://github.com/TVATDCI/guess-the-number/issues/6)

- **What**: Wire modules in `src/main.js`; update `index.html`; delete `game.js`; run full test suite; manual QA; update README
- **Output**: `src/main.js`, updated `index.html`, updated `README.md`, `package.json` scripts
- **Acceptance**: `npm test` passes with ≥ 20 tests; all 13 manual QA items verified; no console errors
- **Blockers**: Task 3.1
- **Evidence path**: `.sisyphus/evidence/guess-the-number-robustness-task-4-tdd-log.md`

### Task 5.1: Slice 5 — Daily Challenge Mode
**GitHub Issue**: [#7](https://github.com/TVATDCI/guess-the-number/issues/7)

- **What**: Add daily challenge button; date-seeded deterministic number; one-attempt limit; rotating difficulty; share result; 7-day calendar; schema v2
- **Output**: Daily challenge UI screens, new actions, updated storage schema, tests
- **Acceptance**: Same date = same number globally; attempt limit enforced; share text correct; calendar grid visible
- **Blockers**: Task 4.1
- **Evidence path**: `.sisyphus/evidence/guess-the-number-robustness-task-5-tdd-log.md`

---

### Task 6.1: Integration + Final Verification (blocked by all above)
- **What**: End-to-end verification after all slices complete
- **Output**: Final sign-off that all PRD acceptance criteria are met
- **Verify**:
  - [ ] `src/engine.js` exists with pure functions and ≥ 80% test coverage
  - [ ] `src/store.js` dispatches actions and notifies subscribers
  - [ ] `src/storage.js` wraps `localStorage` with error handling and schema versioning
  - [ ] `src/random.js` provides default, seeded, and daily modes
  - [ ] `src/ui.js` contains zero game logic, only event wiring and rendering
  - [ ] All existing game modes (easy, medium, hard, mult-easy, mult-hard, two-player) function identically
  - [ ] `npm test` passes with ≥ 20 tests
  - [ ] README updated with new project structure
  - [ ] Daily Challenge mode accessible from setup screen
  - [ ] Same date produces same secret number across devices
  - [ ] One attempt per day enforced
  - [ ] Share result generates emoji summary
  - [ ] Past 7 days calendar visible
  - [ ] No debug code or TODO markers left
  - [ ] Build/lint/type-check commands pass (if applicable)

---

## Dependency Graph

```
Task 1.1 (Foundation)
    │
    ▼
Task 2.1 (Engine)
    │
    ▼
Task 3.1 (Store + UI)
    │
    ▼
Task 4.1 (Integration)
    │
    ▼
Task 5.1 (Daily Challenge)
    │
    ▼
Task 6.1 (Final Verification)
```

No cycles. Linear dependency chain by design — each slice builds on the prior foundation.

---

## Ready Queue

| Ready Now | Blocked |
|---|---|
| Task 1.1 | Task 2.1, 3.1, 4.1, 5.1, 6.1 |

---

## Progress Tracking

- [x] Task 1.1: Slice 1 — Foundation (36 tests passing, Vitest + random.js + storage.js)
- [x] Task 2.1: Slice 2 — Core Game Engine (53 tests passing, pure reducer, all modes)
- [x] Task 3.1: Slice 3 — Store + UI Refactor (16 integration tests, timer leak fixed, reset jank fixed)
- [x] Task 4.1: Slice 4 — Integration & Verification (105 tests, old monolith deleted, README updated)
- [x] Task 5.1: Slice 5 — Daily Challenge Mode (13 new tests, deterministic dates, calendar, share)
- [x] Task 6.1: Integration + Final Verification (118 tests, 0 debug markers, 100% acceptance)

---

## Notepad

- Decisions: `.sisyphus/notepads/guess-the-number-robustness/decisions.md`
- Problems: `.sisyphus/notepads/guess-the-number-robustness/problems.md`
- Learnings: `.sisyphus/notepads/guess-the-number-robustness/learnings.md`

---

## Completion Summary

**Completed**: 2026-05-04
**Outcome**: All 5 vertical slices implemented, tested, and verified. 118 tests passing. Phase 1 (robustness foundation) and Phase 2 (Daily Challenge Mode) fully delivered per PRD acceptance criteria.

**Key Achievements**:
- Transformed 802-line monolith into 6-module layered architecture
- 118 automated tests covering all game modes, state transitions, storage, and randomness
- Zero game logic in UI layer (pure rendering + event wiring)
- Injectable randomness enables deterministic testing and Daily Challenge
- Storage wrapper with graceful degradation for private browsing
- Timer leak and reset jank bugs fixed
- Calendar-day based streak tracking (fixed midnight bug)
- Daily Challenge mode with deterministic daily numbers, rotating difficulty, share results, 7-day calendar

**Deferred**: None

**Evidence**: `.sisyphus/evidence/guess-the-number-robustness-task-6-tdd-log.md`
