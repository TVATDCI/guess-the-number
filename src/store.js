import { createInitialState, gameReducer } from './engine.js';
import { createRandom } from './random.js';

const PERSIST_KEYS = [
  'theme',
  'streak',
  'lastWinDate',
  'totalWins',
  'highScore',
  'hasPlayedBefore',
  'mathLevel',
  'timerEnabled',
  'dailyChallenge',
];

export function createStore(storage, options = {}) {
  const rng = options.rng || createRandom();
  let state = createInitialState();
  let listeners = [];
  let timerId = null;

  function loadPersisted() {
    if (!storage) return;
    const persisted = {};
    let hasData = false;
    for (const key of PERSIST_KEYS) {
      const value = storage.get(`gtn_${key}`);
      if (value !== null) {
        persisted[key] = value;
        hasData = true;
      }
    }
    if (hasData) {
      state = createInitialState(persisted);
    }
  }

  function persist(slice) {
    if (!storage) return;
    for (const key of PERSIST_KEYS) {
      if (key in slice) {
        storage.set(`gtn_${key}`, slice[key]);
      }
    }
  }

  function clearTimer() {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function startTimer() {
    clearTimer();
    timerId = setInterval(() => {
      dispatch({ type: 'TICK' });
    }, 1000);
  }

  function dispatch(action) {
    const prevState = state;
    state = gameReducer(state, action, rng);

    if (state.screen === 'game' && state.timerEnabled && !prevState.timerEnabled && !timerId) {
      startTimer();
    }

    if ((state.isGameOver || state.screen !== 'game') && timerId) {
      clearTimer();
    }

    if (state.screen === 'game' && state.timerEnabled && state.timerValue !== prevState.timerValue && !timerId) {
      startTimer();
    }

    const changed = {};
    for (const key of PERSIST_KEYS) {
      if (state[key] !== prevState[key]) {
        changed[key] = state[key];
      }
    }
    if (Object.keys(changed).length > 0) {
      persist(changed);
    }

    for (const listener of listeners) {
      listener(state, prevState);
    }

    return state;
  }

  function subscribe(listener) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }

  function getState() {
    return state;
  }

  loadPersisted();

  return {
    dispatch,
    subscribe,
    getState,
    _clearTimer: clearTimer,
  };
}
