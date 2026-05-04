import { describe, it, expect, beforeEach } from 'vitest';
import {
  createInitialState,
  gameReducer,
  DIFFICULTIES,
  getThermometerPercentage,
  getThermometerColor,
  getTodayDateString,
  getDailyDifficultyForDate,
  generateDailySecretNumber,
  getDailyCalendar,
  generateShareText,
} from '../src/engine.js';
import { createSeededRandom } from '../src/random.js';

function makeRng(seed) {
  return createSeededRandom(seed);
}

function startGame(state, difficulty, rng, timerEnabled = false) {
  return gameReducer(state, { type: 'START_GAME', difficulty, timerEnabled }, rng);
}

function submitGuess(state, guess) {
  return gameReducer(state, { type: 'SUBMIT_GUESS', guess }, null);
}

function tick(state) {
  return gameReducer(state, { type: 'TICK' }, null);
}

describe('createInitialState', () => {
  it('creates state with default values', () => {
    const state = createInitialState();
    expect(state.screen).toBe('setup');
    expect(state.difficulty).toBeNull();
    expect(state.guessesUsed).toBe(0);
    expect(state.isGameOver).toBe(false);
    expect(state.history).toEqual([]);
    expect(state.streak).toBe(0);
    expect(state.totalWins).toBe(0);
    expect(state.mathLevel['mult-easy']).toBe(1);
    expect(state.mathLevel['mult-hard']).toBe(1);
  });

  it('accepts options', () => {
    const state = createInitialState({
      theme: 'ocean',
      streak: 5,
      totalWins: 10,
      mathLevel: { 'mult-easy': 3, 'mult-hard': 2 },
    });
    expect(state.theme).toBe('ocean');
    expect(state.streak).toBe(5);
    expect(state.totalWins).toBe(10);
    expect(state.mathLevel['mult-easy']).toBe(3);
  });
});

describe('START_GAME', () => {
  it('transitions to game screen', () => {
    const rng = makeRng(42);
    const state = startGame(createInitialState(), 'easy', rng);
    expect(state.screen).toBe('game');
    expect(state.difficulty).toBe('easy');
    expect(state.config).toEqual(DIFFICULTIES.easy);
    expect(state.guessesUsed).toBe(0);
    expect(state.guessesLeft).toBe(Infinity);
    expect(state.isGameOver).toBe(false);
    expect(state.history).toEqual([]);
  });

  it('generates secret number within range', () => {
    const rng = makeRng(99);
    const state = startGame(createInitialState(), 'easy', rng);
    expect(state.secretNumber).toBeGreaterThanOrEqual(1);
    expect(state.secretNumber).toBeLessThanOrEqual(10);
  });

  it('generates different secret numbers with different seeds', () => {
    const rng1 = makeRng(12345);
    const rng2 = makeRng(67890);
    const state1 = startGame(createInitialState(), 'hard', rng1);
    const state2 = startGame(createInitialState(), 'hard', rng2);
    expect(state1.secretNumber).not.toBe(state2.secretNumber);
  });

  it('sets up medium difficulty with limited guesses', () => {
    const rng = makeRng(77);
    const state = startGame(createInitialState(), 'medium', rng);
    expect(state.config).toEqual(DIFFICULTIES.medium);
    expect(state.guessesLeft).toBe(10);
    expect(state.secretNumber).toBeGreaterThanOrEqual(1);
    expect(state.secretNumber).toBeLessThanOrEqual(50);
  });

  it('sets up hard difficulty', () => {
    const rng = makeRng(55);
    const state = startGame(createInitialState(), 'hard', rng);
    expect(state.guessesLeft).toBe(7);
    expect(state.secretNumber).toBeGreaterThanOrEqual(1);
    expect(state.secretNumber).toBeLessThanOrEqual(100);
  });

  it('sets up multiply easy mode', () => {
    const rng = makeRng(33);
    const state = startGame(createInitialState(), 'mult-easy', rng);
    expect(state.config.type).toBe('multiply');
    expect(state.guessesLeft).toBe(Infinity);
    expect(state.secretFactor1).toBeGreaterThanOrEqual(1);
    expect(state.secretFactor1).toBeLessThanOrEqual(10);
    expect(state.secretFactor2).toBeGreaterThanOrEqual(1);
    expect(state.secretFactor2).toBeLessThanOrEqual(10);
    expect(state.secretNumber).toBe(state.secretFactor1 * state.secretFactor2);
  });

  it('sets up multiply hard mode', () => {
    const rng = makeRng(88);
    const state = startGame(createInitialState(), 'mult-hard', rng);
    expect(state.config.type).toBe('multiply');
    expect(state.guessesLeft).toBe(10);
    expect(state.secretFactor1).toBeGreaterThanOrEqual(1);
    expect(state.secretFactor1).toBeLessThanOrEqual(20);
    expect(state.secretFactor2).toBeGreaterThanOrEqual(1);
    expect(state.secretFactor2).toBeLessThanOrEqual(10);
    expect(state.secretNumber).toBe(state.secretFactor1 * state.secretFactor2);
  });

  it('sets up two-player mode', () => {
    const rng = makeRng(44);
    const state = startGame(createInitialState(), 'two-player', rng);
    expect(state.config.type).toBe('twoplayer');
    expect(state.guessesLeft).toBe(10);
    expect(state.twoPlayer.isActive).toBe(true);
    expect(state.message).toContain("Player 1's turn");
  });

  it('preserves existing math levels', () => {
    const rng = makeRng(1);
    const initial = createInitialState({ mathLevel: { 'mult-easy': 5, 'mult-hard': 3 } });
    const state = startGame(initial, 'easy', rng);
    expect(state.mathLevel['mult-easy']).toBe(5);
    expect(state.mathLevel['mult-hard']).toBe(3);
  });

  it('preserves totalWins and streak', () => {
    const rng = makeRng(1);
    const initial = createInitialState({ totalWins: 7, streak: 3, lastWinDate: '2026-05-03' });
    const state = startGame(initial, 'easy', rng);
    expect(state.totalWins).toBe(7);
    expect(state.streak).toBe(3);
    expect(state.lastWinDate).toBe('2026-05-03');
  });

  it('enables timer when requested', () => {
    const rng = makeRng(1);
    const state = startGame(createInitialState(), 'easy', rng, true);
    expect(state.timerEnabled).toBe(true);
    expect(state.timerValue).toBe(60);
  });

  it('returns same state for invalid difficulty', () => {
    const rng = makeRng(1);
    const initial = createInitialState();
    const state = startGame(initial, 'nonexistent', rng);
    expect(state).toEqual(initial);
  });
});

describe('SUBMIT_GUESS', () => {
  it('handles correct guess in easy mode', () => {
    const rng = makeRng(42);
    let state = startGame(createInitialState(), 'easy', rng);
    const correct = state.secretNumber;
    state = submitGuess(state, correct);
    expect(state.isGameOver).toBe(true);
    expect(state.screen).toBe('win');
    expect(state.messageClass).toBe('correct');
    expect(state.totalWins).toBe(1);
    expect(state.streak).toBe(1);
    expect(state.guessesUsed).toBe(1);
  });

  it('handles too-high guess', () => {
    const rng = makeRng(42);
    let state = startGame(createInitialState(), 'easy', rng);
    state = submitGuess(state, 999);
    expect(state.isGameOver).toBe(false);
    expect(state.guessesUsed).toBe(1);
    expect(state.history[0].result).toBe('too-high');
    expect(state.message).toContain('Too high');
  });

  it('handles too-low guess', () => {
    const rng = makeRng(42);
    let state = startGame(createInitialState(), 'easy', rng);
    state = submitGuess(state, 0);
    expect(state.isGameOver).toBe(false);
    expect(state.history[0].result).toBe('too-low');
    expect(state.message).toContain('Too low');
  });

  it('tracks guess history', () => {
    const rng = makeRng(42);
    let state = startGame(createInitialState(), 'hard', rng);
    const secret = state.secretNumber;
    const wrongGuess = secret === 1 ? 2 : 1;
    state = submitGuess(state, wrongGuess);
    state = submitGuess(state, wrongGuess);
    state = submitGuess(state, wrongGuess);
    expect(state.history.length).toBe(3);
    expect(state.guessesUsed).toBe(3);
  });

  it('loses when out of guesses', () => {
    const rng = makeRng(42);
    let state = startGame(createInitialState(), 'hard', rng);
    const secret = state.secretNumber;
    for (let i = 0; i < 6; i++) {
      const guess = secret === 1 ? 2 : 1;
      state = submitGuess(state, guess);
    }
    expect(state.isGameOver).toBe(false);
    expect(state.guessesLeft).toBe(1);
    state = submitGuess(state, secret === 1 ? 2 : 1);
    expect(state.isGameOver).toBe(true);
    expect(state.screen).toBe('lose');
    expect(state.streak).toBe(0);
    expect(state.lastWinDate).toBeNull();
  });

  it('ignores guesses after game over', () => {
    const rng = makeRng(42);
    let state = startGame(createInitialState(), 'easy', rng);
    state = submitGuess(state, state.secretNumber);
    expect(state.isGameOver).toBe(true);
    const next = submitGuess(state, 1);
    expect(next.guessesUsed).toBe(state.guessesUsed);
  });

  it('handles two-player win', () => {
    const rng = makeRng(42);
    let state = startGame(createInitialState(), 'two-player', rng);
    const correct = state.secretNumber;
    state = submitGuess(state, correct);
    expect(state.isGameOver).toBe(true);
    expect(state.twoPlayer.p1Score).toBe(1);
    expect(state.twoPlayer.roundsPlayed).toBe(1);
    expect(state.message).toContain('Player 1 wins this round');
  });

  it('handles two-player out of guesses', () => {
    const rng = makeRng(42);
    let state = startGame(createInitialState(), 'two-player', rng);
    const secret = state.secretNumber;
    for (let i = 0; i < 9; i++) {
      state = submitGuess(state, secret === 1 ? 2 : 1);
    }
    expect(state.isGameOver).toBe(false);
    state = submitGuess(state, secret === 1 ? 2 : 1);
    expect(state.isGameOver).toBe(true);
    expect(state.twoPlayer.p2Score).toBe(1);
    expect(state.message).toContain('Player 2 wins');
  });

  it('handles multiplication correct guess', () => {
    const rng = makeRng(42);
    let state = startGame(createInitialState(), 'mult-easy', rng);
    const correct = state.secretNumber;
    state = submitGuess(state, correct);
    expect(state.isGameOver).toBe(true);
    expect(state.screen).toBe('levelup');
    expect(state.mathLevel['mult-easy']).toBe(2);
  });
});

describe('TICK', () => {
  it('decrements timer', () => {
    const rng = makeRng(1);
    let state = startGame(createInitialState(), 'easy', rng, true);
    state = tick(state);
    expect(state.timerValue).toBe(59);
  });

  it('does nothing when timer disabled', () => {
    const rng = makeRng(1);
    let state = startGame(createInitialState(), 'easy', rng, false);
    state = tick(state);
    expect(state.timerValue).toBe(60);
  });

  it('ends game when timer reaches 0', () => {
    const rng = makeRng(1);
    let state = startGame(createInitialState(), 'easy', rng, true);
    for (let i = 0; i < 60; i++) {
      state = tick(state);
    }
    expect(state.isGameOver).toBe(true);
    expect(state.screen).toBe('lose');
    expect(state.timerRanOut).toBe(true);
    expect(state.streak).toBe(0);
  });

  it('does not tick when game is over', () => {
    const rng = makeRng(1);
    let state = startGame(createInitialState(), 'easy', rng, true);
    state = submitGuess(state, state.secretNumber);
    state = tick(state);
    expect(state.timerValue).toBe(60);
  });
});

describe('streak handling', () => {
  it('increments streak on consecutive day wins', () => {
    const today = getTodayDateString();
    const rng = makeRng(42);
    let state = startGame(
      createInitialState({ streak: 2, lastWinDate: today }),
      'easy',
      rng
    );
    state = submitGuess(state, state.secretNumber);
    expect(state.streak).toBe(3);
    expect(state.lastWinDate).toBe(today);
  });

  it('resets streak on new day win', () => {
    const rng = makeRng(42);
    let state = startGame(
      createInitialState({ streak: 5, lastWinDate: '2026-01-01' }),
      'easy',
      rng
    );
    state = submitGuess(state, state.secretNumber);
    expect(state.streak).toBe(1);
  });

  it('resets streak on loss', () => {
    const rng = makeRng(42);
    let state = startGame(
      createInitialState({ streak: 5, lastWinDate: getTodayDateString() }),
      'hard',
      rng
    );
    const secret = state.secretNumber;
    for (let i = 0; i < 7; i++) {
      state = submitGuess(state, secret === 1 ? 2 : 1);
    }
    expect(state.streak).toBe(0);
    expect(state.lastWinDate).toBeNull();
  });
});

describe('high score', () => {
  it('sets high score on first win', () => {
    const rng = makeRng(42);
    let state = startGame(createInitialState(), 'easy', rng);
    state = submitGuess(state, state.secretNumber);
    expect(state.highScore).toBe(1);
  });

  it('updates high score when better', () => {
    const rng = makeRng(42);
    let state = startGame(createInitialState({ highScore: 5 }), 'medium', rng);
    state = submitGuess(state, state.secretNumber);
    expect(state.highScore).toBe(1);
  });

  it('preserves high score when worse', () => {
    const rng = makeRng(42);
    let state = startGame(createInitialState({ highScore: 1 }), 'medium', rng);
    state = submitGuess(state, 1);
    state = submitGuess(state, state.secretNumber);
    expect(state.highScore).toBe(1);
  });
});

describe('math level progression', () => {
  it('increments mult-easy level on win', () => {
    const rng = makeRng(42);
    let state = startGame(createInitialState(), 'mult-easy', rng);
    state = submitGuess(state, state.secretNumber);
    expect(state.mathLevel['mult-easy']).toBe(2);
    expect(state.screen).toBe('levelup');
  });

  it('increments mult-hard level on win', () => {
    const rng = makeRng(42);
    let state = startGame(createInitialState(), 'mult-hard', rng);
    state = submitGuess(state, state.secretNumber);
    expect(state.mathLevel['mult-hard']).toBe(2);
  });

  it('does not change level on loss', () => {
    const rng = makeRng(42);
    let state = startGame(createInitialState(), 'mult-hard', rng);
    const secret = state.secretNumber;
    for (let i = 0; i < 10; i++) {
      state = submitGuess(state, secret === 1 ? 2 : 1);
    }
    expect(state.mathLevel['mult-hard']).toBe(1);
  });

  it('uses existing level for harder ranges', () => {
    const rng = makeRng(42);
    let state = startGame(
      createInitialState({ mathLevel: { 'mult-easy': 5, 'mult-hard': 3 } }),
      'mult-easy',
      rng
    );
    expect(state.secretFactor1).toBeGreaterThanOrEqual(1);
    expect(state.secretFactor1).toBeLessThanOrEqual(10);
  });
});

describe('ACCEPT_LEVEL_UP', () => {
  it('starts new game at higher level', () => {
    const rng = makeRng(42);
    let state = startGame(createInitialState(), 'mult-easy', rng);
    state = submitGuess(state, state.secretNumber);
    expect(state.screen).toBe('levelup');
    expect(state.mathLevel['mult-easy']).toBe(2);

    state = gameReducer(state, { type: 'ACCEPT_LEVEL_UP' }, rng);
    expect(state.screen).toBe('game');
    expect(state.mathLevel['mult-easy']).toBe(2);
    expect(state.guessesUsed).toBe(0);
  });
});

describe('DECLINE_LEVEL_UP', () => {
  it('returns to setup', () => {
    const rng = makeRng(42);
    let state = startGame(createInitialState(), 'mult-easy', rng);
    state = submitGuess(state, state.secretNumber);
    state = gameReducer(state, { type: 'DECLINE_LEVEL_UP' }, rng);
    expect(state.screen).toBe('setup');
    expect(state.hasPlayedBefore).toBe(true);
  });
});

describe('RESET_GAME', () => {
  it('returns to setup screen', () => {
    const rng = makeRng(42);
    let state = startGame(createInitialState(), 'easy', rng);
    state = submitGuess(state, state.secretNumber);
    state = gameReducer(state, { type: 'RESET_GAME' }, rng);
    expect(state.screen).toBe('setup');
    expect(state.isGameOver).toBe(false);
    expect(state.hasPlayedBefore).toBe(true);
  });
});

describe('RESET_PROGRESS', () => {
  it('resets all progress', () => {
    const rng = makeRng(42);
    let state = createInitialState({
      streak: 5,
      totalWins: 10,
      highScore: 3,
      mathLevel: { 'mult-easy': 4 },
      theme: 'ocean',
    });
    state = startGame(state, 'easy', rng);
    state = gameReducer(state, { type: 'RESET_PROGRESS' }, rng);
    expect(state.streak).toBe(0);
    expect(state.totalWins).toBe(0);
    expect(state.highScore).toBeNull();
    expect(state.mathLevel['mult-easy']).toBe(1);
    expect(state.theme).toBe('ocean');
    expect(state.screen).toBe('setup');
  });
});

describe('two-player flow', () => {
  it('completes a full two-player match', () => {
    const rng = makeRng(42);
    let state = startGame(createInitialState(), 'two-player', rng);
    const s1 = state.secretNumber;

    // Player 1 wins round 1
    state = submitGuess(state, s1);
    expect(state.twoPlayer.p1Score).toBe(1);
    expect(state.twoPlayer.roundsPlayed).toBe(1);

    // Next round
    state = gameReducer(state, { type: 'START_TWO_PLAYER_NEXT_ROUND' }, rng);
    expect(state.twoPlayer.currentPlayer).toBe(2);
    const s2 = state.secretNumber;

    // Player 2 wins round 2
    state = submitGuess(state, s2);
    expect(state.twoPlayer.p2Score).toBe(1);
    expect(state.twoPlayer.roundsPlayed).toBe(2);

    // Next round
    state = gameReducer(state, { type: 'START_TWO_PLAYER_NEXT_ROUND' }, rng);
    expect(state.twoPlayer.currentPlayer).toBe(1);
    const s3 = state.secretNumber;

    // Player 1 wins round 3 and match
    state = submitGuess(state, s3);
    expect(state.twoPlayer.p1Score).toBe(2);
    expect(state.twoPlayer.roundsPlayed).toBe(3);
    expect(state.twoPlayer.matchWinner).toBe(1);
    expect(state.screen).toBe('win');
  });

  it('handles tie match', () => {
    const rng = makeRng(42);
    let state = startGame(createInitialState(), 'two-player', rng);
    const s1 = state.secretNumber;

    // Player 1 wins round 1
    state = submitGuess(state, s1);
    state = gameReducer(state, { type: 'START_TWO_PLAYER_NEXT_ROUND' }, rng);
    const s2 = state.secretNumber;

    // Player 2 wins round 2
    state = submitGuess(state, s2);
    state = gameReducer(state, { type: 'START_TWO_PLAYER_NEXT_ROUND' }, rng);
    const s3 = state.secretNumber;

    // Player 1 loses round 3 (out of guesses)
    for (let i = 0; i < 10; i++) {
      state = submitGuess(state, s3 === 1 ? 2 : 1);
    }
    expect(state.twoPlayer.p2Score).toBe(2);
    expect(state.twoPlayer.matchWinner).toBe(2);
  });

  it('resets two-player state on END_TWO_PLAYER_MATCH', () => {
    const rng = makeRng(42);
    let state = startGame(createInitialState(), 'two-player', rng);
    state = submitGuess(state, state.secretNumber);
    state = gameReducer(state, { type: 'END_TWO_PLAYER_MATCH' }, rng);
    expect(state.twoPlayer.p1Score).toBe(0);
    expect(state.twoPlayer.isActive).toBe(false);
    expect(state.screen).toBe('setup');
  });
});

describe('getThermometerPercentage', () => {
  it('returns 100 when guess equals secret', () => {
    expect(getThermometerPercentage(50, 50, 1, 100)).toBe(100);
  });

  it('returns 0 at maximum distance', () => {
    expect(getThermometerPercentage(1, 100, 1, 100)).toBe(0);
  });

  it('returns ~50 at half distance', () => {
    expect(getThermometerPercentage(1, 51, 1, 100)).toBeCloseTo(49.5, 0);
  });

  it('handles zero range', () => {
    expect(getThermometerPercentage(5, 5, 5, 5)).toBe(100);
  });
});

describe('getThermometerColor', () => {
  it('returns hot for 80+', () => {
    expect(getThermometerColor(85)).toBe('hot');
    expect(getThermometerColor(80)).toBe('hot');
  });

  it('returns warm for 50-79', () => {
    expect(getThermometerColor(50)).toBe('warm');
    expect(getThermometerColor(75)).toBe('warm');
  });

  it('returns cool for 25-49', () => {
    expect(getThermometerColor(25)).toBe('cool');
    expect(getThermometerColor(49)).toBe('cool');
  });

  it('returns cold for under 25', () => {
    expect(getThermometerColor(0)).toBe('cold');
    expect(getThermometerColor(24)).toBe('cold');
  });
});

describe('unknown action', () => {
  it('returns same state', () => {
    const state = createInitialState();
    const next = gameReducer(state, { type: 'UNKNOWN' }, null);
    expect(next).toEqual(state);
  });
});

describe('Daily Challenge', () => {
  it('starts daily challenge with deterministic difficulty', () => {
    const rng = makeRng(42);
    const state = gameReducer(createInitialState(), { type: 'START_DAILY' }, rng);
    expect(state.screen).toBe('daily-challenge');
    expect(state.dailyChallenge.currentDate).toBeDefined();
    expect(state.dailyChallenge.dailyDifficulty).toMatch(/easy|medium|hard/);
    expect(state.dailyChallenge.dailySecretNumber).toBeGreaterThanOrEqual(1);
  });

  it('generates same secret for same date with same seed', () => {
    const state1 = gameReducer(createInitialState(), { type: 'START_DAILY' }, makeRng(123));
    const state2 = gameReducer(createInitialState(), { type: 'START_DAILY' }, makeRng(123));
    expect(state1.dailyChallenge.dailySecretNumber).toBe(state2.dailyChallenge.dailySecretNumber);
  });

  it('handles correct daily guess', () => {
    const rng = makeRng(42);
    let state = gameReducer(createInitialState(), { type: 'START_DAILY' }, rng);
    const secret = state.dailyChallenge.dailySecretNumber;
    state = gameReducer(state, { type: 'SUBMIT_DAILY_GUESS', guess: secret }, null);
    expect(state.screen).toBe('daily-result');
    expect(state.dailyChallenge.dailyIsGameOver).toBe(true);
    expect(state.dailyChallenge.history.length).toBe(1);
    expect(state.dailyChallenge.history[0].correct).toBe(true);
  });

  it('handles incorrect daily guess', () => {
    const rng = makeRng(42);
    let state = gameReducer(createInitialState(), { type: 'START_DAILY' }, rng);
    const secret = state.dailyChallenge.dailySecretNumber;
    const wrongGuess = secret === 1 ? 2 : 1;
    state = gameReducer(state, { type: 'SUBMIT_DAILY_GUESS', guess: wrongGuess }, null);
    expect(state.screen).toBe('daily-result');
    expect(state.dailyChallenge.dailyIsGameOver).toBe(true);
    expect(state.dailyChallenge.history[0].correct).toBe(false);
  });

  it('prevents playing again on same day', () => {
    const rng = makeRng(42);
    let state = gameReducer(createInitialState(), { type: 'START_DAILY' }, rng);
    const secret = state.dailyChallenge.dailySecretNumber;
    state = gameReducer(state, { type: 'SUBMIT_DAILY_GUESS', guess: secret }, null);
    const today = state.dailyChallenge.currentDate;
    state = {
      ...state,
      dailyChallenge: { ...state.dailyChallenge, lastPlayedDate: today },
    };
    const next = gameReducer(state, { type: 'START_DAILY' }, rng);
    expect(next.screen).toBe('daily-result');
    expect(next.dailyChallenge.dailyMessage).toContain('already played');
  });

  it('ignores additional guesses after game over', () => {
    const rng = makeRng(42);
    let state = gameReducer(createInitialState(), { type: 'START_DAILY' }, rng);
    const secret = state.dailyChallenge.dailySecretNumber;
    state = gameReducer(state, { type: 'SUBMIT_DAILY_GUESS', guess: secret }, null);
    const historyLength = state.dailyChallenge.history.length;
    state = gameReducer(state, { type: 'SUBMIT_DAILY_GUESS', guess: secret }, null);
    expect(state.dailyChallenge.history.length).toBe(historyLength);
  });

  it('rotates difficulty based on date', () => {
    const difficulties = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      difficulties.push(getDailyDifficultyForDate(dateStr));
    }
    expect(new Set(difficulties).size).toBeGreaterThan(1);
    expect(difficulties[0]).toMatch(/easy|medium|hard/);
  });
});

describe('generateDailySecretNumber', () => {
  it('returns secret number within range', () => {
    const rng = makeRng(42);
    const result = generateDailySecretNumber('2026-05-04', rng);
    expect(result.secretNumber).toBeGreaterThanOrEqual(1);
    expect(result.difficulty).toMatch(/easy|medium|hard/);
    expect(result.config).toBeDefined();
  });
});

describe('getDailyCalendar', () => {
  it('returns 7 days', () => {
    const history = [
      { date: '2026-05-01', correct: true, difficulty: 'easy' },
      { date: '2026-05-02', correct: false, difficulty: 'medium' },
    ];
    const calendar = getDailyCalendar(history, '2026-05-04');
    expect(calendar.length).toBe(7);
    expect(calendar[6].date).toBe('2026-05-04');
  });

  it('marks wins and losses correctly', () => {
    const history = [
      { date: '2026-05-03', correct: true, difficulty: 'easy' },
      { date: '2026-05-04', correct: false, difficulty: 'medium' },
    ];
    const calendar = getDailyCalendar(history, '2026-05-04');
    const today = calendar.find((d) => d.date === '2026-05-04');
    expect(today.status).toBe('lose');
  });

  it('marks not played days', () => {
    const history = [];
    const calendar = getDailyCalendar(history, '2026-05-04');
    const today = calendar.find((d) => d.date === '2026-05-04');
    expect(today.status).toBe('not-played');
    expect(today.difficulty).toMatch(/easy|medium|hard/);
  });
});

describe('generateShareText', () => {
  it('generates win text', () => {
    const text = generateShareText('Space', '2026-05-04', 1, true, 5);
    expect(text).toContain('Space Hunt');
    expect(text).toContain('2026-05-04');
    expect(text).toContain('⭐');
    expect(text).toContain('5-day streak');
  });

  it('generates loss text', () => {
    const text = generateShareText('Ocean', '2026-05-04', 1, false, 0);
    expect(text).toContain('Ocean Hunt');
    expect(text).toContain('❌');
    expect(text).toContain('did not find it');
  });
});
