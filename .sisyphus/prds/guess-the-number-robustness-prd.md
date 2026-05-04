# PRD: Guess the Number — Robustness & Daily Challenge

## 1. Overview

### 1.1 Project
- **Repository**: `/home/vladi/projects/GitHub/guess-the-number`
- **Type**: Vanilla HTML/CSS/JS browser game + Node.js console companion
- **Target Audience**: Children (ages 5–10) and their parents
- **Current State**: 800-line `game.js` monolith with no tests, tightly coupled state/DOM/randomness/persistence

### 1.2 Approved Direction
**Direction B: Code quality and robustness first, then Daily Challenge Mode.**

The project will undergo a two-phase stabilization before new feature work:
1. **Phase 1: Robustness Foundation** — extract testable core engine, add tests, refactor browser layer
2. **Phase 2: Daily Challenge Mode** — build on stabilized foundation

### 1.3 Core Decision Log
| Decision | Rationale |
|---|---|
| Robustness before new modes | Current 800-line monolith has hidden bugs; adding modes compounds technical debt |
| Daily Challenge as first post-stabilization feature | It is the highest-value child-requested feature; requires injectable randomness and date-based generation, which forces clean seams |
| Optimize for maintainability over performance | This is a turn-based children's game; clarity > micro-optimizations |
| Keep vanilla JS (no framework) | Project is intentionally simple; framework would raise the contribution barrier for a 7-year-old co-author |

---

## 2. Current State Analysis

### 2.1 Architecture
```
┌─────────────────────────────────────────────┐
│              game.js (monolith)              │
│  ┌─────────┐ ┌─────────┐ ┌───────────────┐ │
│  │  State  │ │   DOM   │ │  Randomness   │ │
│  │(mutable │ │(direct  │ │(Math.random)  │ │
│  │  let)   │ │querySel)│ │               │ │
│  └────┬────┘ └────┬────┘ └───────┬───────┘ │
│       └─────────────┴─────────────┘         │
│                 ┌─────────┐                   │
│                 │localStorage│                  │
│                 │(persistence)│               │
│                 └─────────┘                   │
└─────────────────────────────────────────────┘
```

### 2.2 Identified Coupling Issues
1. **State ↔ DOM**: `gameState` mutations directly trigger `element.textContent` updates inline
2. **State ↔ Randomness**: `Math.random()` calls embedded in `startGame()`; no way to seed or mock
3. **State ↔ Persistence**: `localStorage` reads/writes scattered across win/lose/reset handlers
4. **Timer ↔ State**: `timerInterval` stored in `gameState`; `stopTimer()` mutates global state as side effect
5. **Two-player ↔ Global**: `twoPlayerState` is a separate global object with no clear lifecycle

### 2.3 Robustness Gaps
| Area | Issue | Risk |
|---|---|---|
| **Timers** | `timerInterval` not cleared on rapid start/restart; potential leak | Memory leak, multiple intervals running |
| **Storage** | `localStorage` access not wrapped; can throw in private mode | Crashes game in Safari private browsing |
| **Reset** | Page reload on reset instead of clean state teardown | UX jank, state inconsistency during transition |
| **Score/Streak** | Streak reset logic has `daysSinceLastWin < 1` which is fragile | Playing at 11:59 PM then 12:01 AM loses streak |
| **Input** | `parseInt` without radix; `NaN` check only catches `isNaN(guess)` | `"08"` parsed as octal in some engines (legacy) |
| **Math levels** | `mathLevel` state cloned with spread but `gameState` reassigned wholesale | Previous math level state lost on new game start |

### 2.4 Testability
- **No test runner configured** (package.json has `"test": "echo \"Error: no test specified\" && exit 1"`)
- **No pure functions** — every meaningful behavior mutates globals or touches DOM
- **No dependency injection** — `Math.random`, `localStorage`, `document`, `AudioContext` are hard-coded

---

## 3. Phase 1: Robustness Foundation (MVP)

### 3.1 Objective
Transform the monolith into a layered architecture where core game rules are pure, testable, and independent of the browser environment.

### 3.2 Target Architecture
```
┌─────────────────────────────────────────────┐
│              Browser Layer                   │
│         (DOM, events, animations)              │
│                   │                           │
│         ┌─────────┐                           │
│         │  Facade │  ← thin adapter           │
│         │ (ui.js) │    converts DOM → actions │
│         └────┬────┘                           │
│              │                                │
│    ┌─────────┐    ┌───────────────┐        │
│    │  State  │◄───│  Persistence   │        │
│    │ (store) │    │  (storage.js)   │        │
│    └────┬────┘    └───────────────┘        │
│         │                                    │
│    ┌─────────┐    ┌───────────────┐        │
│    │  Engine  │◄───│  Randomness   │        │
│    │(engine.js)│   │  (random.js)   │        │
│    └─────────┘    └───────────────┘        │
│         │                                    │
│    ┌─────────┐                              │
│    │  Tests  │  ← Jest/Vitest unit tests     │
│    └─────────┘                              │
└─────────────────────────────────────────────┘
```

### 3.3 Deliverables & Acceptance Criteria

#### D1. Core Game Engine (`src/engine.js`)
- **Pure functions only** — no DOM, no storage, no `Math.random` directly
- **Injectable randomness** — `createGame(config, randomFn)` accepts a `() => number` generator
- **Immutable state transitions** — each action returns new state, never mutates
- **Game modes supported**: number-guess, multiplication, two-player
- **Timer modeled as state** — `timerRemaining` decremented by explicit `tick()` action, not side effects

**Acceptance**:
```js
// Example: deterministic test
const deterministicRandom = seedRandom(42);
const game = createGame(DIFFICULTIES.easy, deterministicRandom);
const afterGuess = game.handleGuess(5);
assert(afterGuess.state.guessesUsed === 1);
assert(afterGuess.state.history[0].guess === 5);
```

#### D2. State Store (`src/store.js`)
- **Centralized mutable state** (only layer allowed to mutate)
- **Subscribable** — UI layer registers listener for state changes
- **Actions dispatched** — `dispatch(action)` pattern, actions are plain objects
- **Persistence integration** — auto-saves relevant slices to `localStorage` on change

**Acceptance**:
```js
store.dispatch({ type: 'START_GAME', difficulty: 'easy' });
store.subscribe((state, prevState) => {
  render(state); // UI re-renders on every state change
});
```

#### D3. Persistence Layer (`src/storage.js`)
- **Wraps `localStorage`** — all access goes through this module
- **Graceful degradation** — catches `QuotaExceededError` and `SecurityError`, falls back to in-memory
- **Schema versioning** — stores `__version` key; migrates data on load if schema changes
- **Testable** — accepts a storage backend (defaults to `window.localStorage`)

**Acceptance**:
```js
const storage = createStorage(window.localStorage); // real
const mockStorage = createStorage(new MapStorage());  // test
```

#### D4. Randomness Abstraction (`src/random.js`)
- **Default**: `Math.random`
- **Seeded mode**: for Daily Challenge and tests
- **Date-based**: `dailyRandom(dateSeed)` produces deterministic sequence for a given date

**Acceptance**:
```js
const rng = dailyRandom('2026-05-04'); // same sequence for everyone on that day
const game = createGame(DIFFICULTIES.hard, rng);
```

#### D5. Browser UI Layer (`src/ui.js`)
- **Event wiring only** — reads DOM, dispatches actions to store, never mutates game logic
- **Animations delegated** — confetti, dance, shake triggered by comparing `prevState → state`
- **Screen transitions** — `showScreen(screenName)` driven by store state, not direct calls

**Acceptance**: All current UI behavior preserved; no game logic embedded in event handlers.

#### D6. Test Foundation
- **Test runner**: Vitest (fast, ESM-native, zero-config for vanilla JS)
- **Coverage target**: Core engine ≥ 80% line coverage
- **Test categories**:
  - Unit: engine state transitions
  - Unit: storage with mock backend
  - Unit: randomness determinism
  - Integration: store → engine → storage round-trip

**Acceptance**: `npm test` passes with ≥ 20 meaningful test cases.

### 3.4 Refactoring Plan

| Step | File | Action | Risk |
|---|---|---|---|
| 1 | `package.json` | Add Vitest dev dependency, update test script | Low |
| 2 | `src/random.js` | Extract `Math.random` wrapper + seeded variant | Low |
| 3 | `src/storage.js` | Wrap `localStorage` with error handling | Low |
| 4 | `src/engine.js` | Extract pure game logic from `game.js` | **High** — must preserve all modes |
| 5 | `src/store.js` | Build dispatcher + subscriber pattern | Medium |
| 6 | `src/ui.js` | Rewrite DOM layer as action dispatchers | **High** — behavior preservation |
| 7 | `game.js` | Delete; replace with `src/main.js` entry point | Medium |
| 8 | `tests/` | Write tests for engine, storage, random | Low |

### 3.5 Robustness Fixes (Bundled with Refactor)

| Issue | Fix | Verification |
|---|---|---|
| Timer leak | Timer ID stored in closure, cleared on `STOP_GAME` action | Test: rapid start/stop/start doesn't create multiple intervals |
| Private mode crash | `storage.js` catches `SecurityError`, uses memory fallback | Test: mock `localStorage` that throws on `setItem` |
| Reset jank | `RESET_PROGRESS` action clears store state + storage, no reload | Manual: click reset, verify no page reload |
| Streak midnight bug | Streak keyed to calendar day (UTC date string), not `Date.now()` diff | Test: simulate win at 23:59 and 00:01 next day |
| `parseInt` radix | `parseInt(value, 10)` everywhere | Lint rule + test |
| Math level reset | `mathLevel` persisted separately, merged into state on game start | Test: start mult-easy, win, start again, level retained |

---

## 4. Phase 2: Daily Challenge Mode

### 4.1 Objective
Add a "Daily Challenge" game mode where every player in the world gets the same secret number for a given day, enabling friendly competition.

### 4.2 Requirements
- **Same number, same day**: All players see identical secret number on `YYYY-MM-DD`
- **Single daily attempt**: One guess per day per device (stored locally)
- **Difficulty**: Fixed per day, rotates easy → medium → hard
- **Share result**: Generate emoji-based summary for clipboard
- **Calendar view**: Show past 7 days with win/loss/attempted status

### 4.3 Architecture Seams (Enabled by Phase 1)
| Seam | Phase 1 Output | Phase 2 Usage |
|---|---|---|
| Injectable randomness | `dailyRandom(dateSeed)` | `createGame(config, dailyRandom(today))` |
| Persistent state schema | `storage.js` with versioning | Add `dailyChallenge` slice to schema v2 |
| Action-based state changes | Store dispatcher | New action types: `START_DAILY`, `SUBMIT_DAILY_GUESS` |
| Screen transitions | `ui.js` driven by store | Add `daily-screen`, `daily-result-screen` |

### 4.4 Acceptance Criteria
1. Playing Daily Challenge on May 4 produces same number on all devices
2. After submitting one guess, "Play Daily Challenge" button shows "Come back tomorrow!"
3. Share button copies: `🚀 Space Hunt — May 4\n⭐ 3 guesses\n🔥 5-day streak`
4. Past 7 days shown as grid: ✅ (win), ❌ (lose), ⬜ (not played)

---

## 5. Non-Functional Requirements

### 5.1 Performance
- **Bundle size**: No bundler required; keep under 50KB total JS (current is ~35KB)
- **First paint**: `< 1s` on 3G (already met; verify after refactor)
- **Animation**: 60fps on mid-range mobile (CSS transforms only, no JS layout thrashing)

### 5.2 Accessibility
- **Keyboard navigation**: All buttons focusable, Enter submits guess
- **Color contrast**: WCAG AA for all text (already mostly met; audit after theme changes)
- **Screen reader**: `aria-live="polite"` on message area

### 5.3 Browser Support
- **Target**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Graceful degradation**: Timer mode disabled if `requestAnimationFrame` unavailable (unlikely)

### 5.4 Offline
- **Service worker**: Out of scope for this PRD
- **localStorage**: Works offline; no network dependency for core game

---

## 6. Open Questions & Assumptions

| Question | Assumption (if not answered) |
|---|---|
| Should the Node.js `main.js` console version also use the engine? | **Yes** — `main.js` should import `src/engine.js` to avoid logic duplication |
| Should themes be extracted to data files? | **No** — keep in JS for now; JSON extraction is future cleanup |
| Should we add TypeScript? | **No** — maintain vanilla JS to keep barrier low for child co-author |
| Should Daily Challenge require server/backend? | **No** — deterministic client-side generation only |
| What test runner? | **Vitest** — ESM-native, fast, familiar to modern JS devs |

---

## 7. Definition of Done

### Phase 1 Done
- [ ] `src/engine.js` exists with pure functions and ≥ 80% test coverage
- [ ] `src/store.js` dispatches actions and notifies subscribers
- [ ] `src/storage.js` wraps `localStorage` with error handling and schema versioning
- [ ] `src/random.js` provides default, seeded, and daily modes
- [ ] `src/ui.js` contains zero game logic, only event wiring and rendering
- [ ] All existing game modes (easy, medium, hard, mult-easy, mult-hard, two-player) function identically
- [ ] `npm test` passes with ≥ 20 tests
- [ ] README updated with new project structure

### Phase 2 Done
- [ ] Daily Challenge mode accessible from setup screen
- [ ] Same date produces same secret number across devices
- [ ] One attempt per day enforced
- [ ] Share result generates emoji summary
- [ ] Past 7 days calendar visible
- [ ] `npm test` passes with additional daily challenge tests

---

## 8. Out of Scope

- Service worker / PWA offline support
- Backend server or multiplayer networking
- Additional themes beyond Space/Dinosaur/Ocean
- Sound effect expansion beyond current win tone
- Mobile app wrapping (Capacitor, React Native, etc.)
- High score leaderboard (server-side)
- Internationalization (i18n)

---

**Status: APPROVED**
**Approved by: User**
**Date: 2026-05-04**
