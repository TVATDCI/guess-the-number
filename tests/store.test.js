import { describe, it, expect, beforeEach } from 'vitest';
import { createStore } from '../src/store.js';
import { createInitialState } from '../src/engine.js';
import { createStorage, createMemoryStorage } from '../src/storage.js';

describe('createStore', () => {
  let storage;
  let store;

  beforeEach(() => {
    storage = createStorage(createMemoryStorage());
    store = createStore(storage);
  });

  it('initializes with default state', () => {
    const state = store.getState();
    expect(state.screen).toBe('setup');
    expect(state.totalWins).toBe(0);
    expect(state.streak).toBe(0);
  });

  it('dispatches actions and updates state', () => {
    store.dispatch({ type: 'START_GAME', difficulty: 'easy' });
    expect(store.getState().screen).toBe('game');
    expect(store.getState().difficulty).toBe('easy');
  });

  it('notifies subscribers', () => {
    const calls = [];
    store.subscribe((state, prev) => {
      calls.push({ screen: state.screen, prevScreen: prev?.screen });
    });
    store.dispatch({ type: 'START_GAME', difficulty: 'easy' });
    expect(calls.length).toBe(1);
    expect(calls[0].screen).toBe('game');
    expect(calls[0].prevScreen).toBe('setup');
  });

  it('allows unsubscribing', () => {
    const calls = [];
    const unsub = store.subscribe(() => calls.push(1));
    store.dispatch({ type: 'START_GAME', difficulty: 'easy' });
    expect(calls.length).toBe(1);
    unsub();
    store.dispatch({ type: 'RESET_GAME' });
    expect(calls.length).toBe(1);
  });

  it('persists totalWins', () => {
    store.dispatch({ type: 'START_GAME', difficulty: 'easy' });
    const state = store.getState();
    store.dispatch({ type: 'SUBMIT_GUESS', guess: state.secretNumber });
    expect(store.getState().totalWins).toBe(1);
    expect(storage.get('gtn_totalWins')).toBe(1);
  });

  it('persists streak', () => {
    store.dispatch({ type: 'START_GAME', difficulty: 'easy' });
    const state = store.getState();
    store.dispatch({ type: 'SUBMIT_GUESS', guess: state.secretNumber });
    expect(storage.get('gtn_streak')).toBe(1);
  });

  it('persists highScore', () => {
    store.dispatch({ type: 'START_GAME', difficulty: 'easy' });
    const state = store.getState();
    store.dispatch({ type: 'SUBMIT_GUESS', guess: state.secretNumber });
    expect(storage.get('gtn_highScore')).toBe(1);
  });

  it('persists mathLevel', () => {
    store.dispatch({ type: 'START_GAME', difficulty: 'mult-easy' });
    const state = store.getState();
    store.dispatch({ type: 'SUBMIT_GUESS', guess: state.secretNumber });
    expect(storage.get('gtn_mathLevel')['mult-easy']).toBe(2);
  });

  it('loads persisted state on creation', () => {
    storage.set('gtn_totalWins', 5);
    storage.set('gtn_streak', 3);
    storage.set('gtn_theme', 'ocean');
    const store2 = createStore(storage);
    const state = store2.getState();
    expect(state.totalWins).toBe(5);
    expect(state.streak).toBe(3);
    expect(state.theme).toBe('ocean');
  });

  it('persists theme changes', () => {
    store.dispatch({ type: 'SET_THEME', theme: 'dinosaur' });
    expect(storage.get('gtn_theme')).toBe('dinosaur');
  });

  it('persists timerEnabled', () => {
    store.dispatch({ type: 'TIMER_TOGGLE', enabled: true });
    expect(storage.get('gtn_timerEnabled')).toBe(true);
  });

  it('does not persist game-specific state', () => {
    store.dispatch({ type: 'START_GAME', difficulty: 'easy' });
    expect(storage.get('gtn_secretNumber')).toBeNull();
    expect(storage.get('gtn_guessesLeft')).toBeNull();
    expect(storage.get('gtn_screen')).toBeNull();
  });

  it('resets progress and clears storage', () => {
    store.dispatch({ type: 'START_GAME', difficulty: 'easy' });
    const state = store.getState();
    store.dispatch({ type: 'SUBMIT_GUESS', guess: state.secretNumber });
    expect(storage.get('gtn_totalWins')).toBe(1);

    store.dispatch({ type: 'RESET_PROGRESS' });
    expect(store.getState().totalWins).toBe(0);
    expect(store.getState().streak).toBe(0);
    expect(storage.get('gtn_totalWins')).toBe(0);
  });

  it('handles timer ticks', () => {
    store.dispatch({ type: 'TIMER_TOGGLE', enabled: true });
    store.dispatch({ type: 'START_GAME', difficulty: 'easy' });
    expect(store.getState().timerEnabled).toBe(true);
    store.dispatch({ type: 'TICK' });
    expect(store.getState().timerValue).toBe(59);
  });
});

describe('createStore without storage', () => {
  it('works without storage', () => {
    const store = createStore(null);
    store.dispatch({ type: 'START_GAME', difficulty: 'easy' });
    expect(store.getState().screen).toBe('game');
  });
});

describe('createStore with deterministic rng', () => {
  it('uses injected rng', () => {
    let callCount = 0;
    const mockRng = () => {
      callCount++;
      return 0.5;
    };
    const store = createStore(null, { rng: mockRng });
    store.dispatch({ type: 'START_GAME', difficulty: 'easy' });
    expect(callCount).toBeGreaterThan(0);
    expect(store.getState().secretNumber).toBe(6);
  });
});
