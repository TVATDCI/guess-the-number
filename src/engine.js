import { randomInt } from './random.js';

export const DIFFICULTIES = {
  easy: { min: 1, max: 10, guesses: Infinity, label: 'Easy', emoji: '🌙', type: 'number' },
  medium: { min: 1, max: 50, guesses: 10, label: 'Medium', emoji: '🪐', type: 'number' },
  hard: { min: 1, max: 100, guesses: 7, label: 'Hard', emoji: '🌟', type: 'number' },
  'mult-easy': { min: 1, max: 100, guesses: Infinity, label: 'Multiply Easy', emoji: '➕', type: 'multiply' },
  'mult-hard': { min: 1, max: 200, guesses: 10, label: 'Multiply Hard', emoji: '✖️', type: 'multiply' },
  'two-player': { min: 1, max: 50, guesses: 10, label: 'Two Player', emoji: '👥', type: 'twoplayer' },
};

export const THEMES = {
  space: {
    name: 'Space',
    character: '🧑‍🚀',
    winEmojis: '🎉🌟🚀🎊',
    loseEmojis: '😢🌙',
    winTitle: 'YOU DID IT! 🌟',
    loseTitle: 'Mission Failed 😢',
    encouragement: "Don't give up, astronaut! Try again! 💪",
    correctMsg: "🎉 YOU FOUND IT! Amazing job, astronaut!",
    submitBtn: "Blast Off! 🚀",
  },
  dinosaur: {
    name: 'Dinosaur',
    character: '🦕',
    winEmojis: '🎉🦖🌋💥',
    loseEmojis: '😢🌋',
    loseTitle: 'Extinction! 😢',
    encouragement: "Don't give up, dino! Try again! 💪",
    correctMsg: "🎉 ROAR! You found it, brave dino!",
    submitBtn: "ROAR! 🦖",
  },
  ocean: {
    name: 'Ocean',
    character: '🐙',
    winEmojis: '🎉🐠🌊🦀',
    loseEmojis: '😢🐚',
    loseTitle: 'Swept Away! 😢',
    encouragement: "Don't give up, explorer! Try again! 💪",
    correctMsg: "🎉 SPLASH! You found it, ocean hero!",
    submitBtn: "Dive In! 🌊",
  },
};

export const MESSAGES = {
  start: "I'm thinking of a number... Can you find it? 🔢",
  startMult: "I'm thinking of a multiplication answer... Can you solve it? 🔢",
  correct: "🎉 YOU FOUND IT! Amazing job, astronaut!",
  correctMult: "🎉 ROAR! You solved it, math genius!",
  tooHigh: "📉 Too high! The number is smaller. Try again!",
  tooLow: "📈 Too low! The number is bigger. Try again!",
  invalid: "🤔 That's not a valid number. Try again!",
  outOfRange: (min, max) => `Please enter a number between ${min} and ${max}!`,
};

const DEFAULT_MATH_LEVEL = { 'mult-easy': 1, 'mult-hard': 1 };

export function createInitialState(options = {}) {
  return {
    screen: 'setup',
    difficulty: null,
    config: null,
    secretNumber: 0,
    secretFactor1: 0,
    secretFactor2: 0,
    guessesLeft: 0,
    guessesUsed: 0,
    isGameOver: false,
    timerEnabled: false,
    timerValue: 60,
    history: [],
    message: MESSAGES.start,
    messageClass: '',
    theme: options.theme || 'space',
    streak: options.streak || 0,
    lastWinDate: options.lastWinDate || null,
    totalWins: options.totalWins || 0,
    highScore: options.highScore || null,
    hasPlayedBefore: options.hasPlayedBefore || false,
    mathLevel: options.mathLevel ? { ...options.mathLevel } : { ...DEFAULT_MATH_LEVEL },
    twoPlayer: {
      currentPlayer: 1,
      p1Score: 0,
      p2Score: 0,
      roundsPlayed: 0,
      currentWinner: null,
      isActive: false,
      matchWinner: null,
    },
    levelUpPending: false,
    pendingLevelUpDifficulty: null,
    pendingLevelUpFrom: null,
    pendingLevelUpTo: null,
    dailyChallenge: options.dailyChallenge || {
      history: [],
      lastPlayedDate: null,
      currentDate: null,
      dailyDifficulty: null,
      dailySecretNumber: 0,
      dailyGuessesUsed: 0,
      dailyIsGameOver: false,
      dailyMessage: '',
      dailyMessageClass: '',
    },
  };
}

function computeMultiplyRange(difficulty, mathLevel) {
  const level = mathLevel[difficulty] || 1;
  const isHard = difficulty === 'mult-hard';
  let factor1Max, factor2Max;
  if (isHard) {
    factor1Max = Math.min(20, 10 + level * 2);
    factor2Max = Math.min(10, 5 + Math.floor(level / 2));
  } else {
    factor1Max = Math.min(10, 3 + level);
    factor2Max = Math.min(10, 3 + level);
  }
  return { factor1Max, factor2Max, maxRange: factor1Max * factor2Max };
}

function generateSecretNumber(config, rng, mathLevel) {
  if (config.type === 'multiply') {
    const { factor1Max, factor2Max } = computeMultiplyRange(config.id, mathLevel);
    const f1 = randomInt(rng, 1, factor1Max);
    const f2 = randomInt(rng, 1, factor2Max);
    return { secretNumber: f1 * f2, secretFactor1: f1, secretFactor2: f2, factor1Max, factor2Max };
  }
  return {
    secretNumber: randomInt(rng, config.min, config.max),
    secretFactor1: 0,
    secretFactor2: 0,
    factor1Max: config.factor1 || 0,
    factor2Max: config.factor2 || 0,
  };
}

function getTodayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function gameReducer(state, action, rng) {
  switch (action.type) {
    case 'START_GAME':
      return handleStartGame(state, action, rng);
    case 'SUBMIT_GUESS':
      return handleSubmitGuess(state, action);
    case 'TICK':
      return handleTick(state);
    case 'ACCEPT_LEVEL_UP':
      return handleAcceptLevelUp(state, rng);
    case 'DECLINE_LEVEL_UP':
      return handleDeclineLevelUp(state);
    case 'RESET_GAME':
      return handleResetGame(state);
    case 'RESET_PROGRESS':
      return createInitialState({ theme: state.theme });
    case 'START_TWO_PLAYER_NEXT_ROUND':
      return handleStartTwoPlayerNextRound(state, rng);
    case 'END_TWO_PLAYER_MATCH':
      return handleEndTwoPlayerMatch(state);
    case 'TIMER_TOGGLE':
      return { ...state, timerEnabled: action.enabled };
    case 'SET_THEME':
      return { ...state, theme: action.theme };
    case 'START_DAILY':
      return handleStartDaily(state, action, rng);
    case 'SUBMIT_DAILY_GUESS':
      return handleSubmitDailyGuess(state, action);
    default:
      return state;
  }
}

function handleStartGame(state, action, rng) {
  const difficulty = action.difficulty;
  const config = DIFFICULTIES[difficulty];
  if (!config) return state;

  const isMultiply = config.type === 'multiply';
  const isTwoPlayer = config.type === 'twoplayer';

  const { secretNumber, secretFactor1, secretFactor2, factor1Max, factor2Max } = generateSecretNumber(
    { ...config, id: difficulty },
    rng,
    state.mathLevel
  );

  const maxRange = isMultiply ? factor1Max * factor2Max : config.max;

  let message;
  if (isMultiply) {
    message = MESSAGES.startMult;
  } else if (isTwoPlayer) {
    message = `Player ${state.twoPlayer.currentPlayer}'s turn!`;
  } else {
    message = MESSAGES.start;
  }

  const twoPlayer = isTwoPlayer
    ? { ...state.twoPlayer, isActive: true }
    : { ...state.twoPlayer };

  return {
    ...state,
    screen: 'game',
    difficulty,
    config: { ...config },
    secretNumber,
    secretFactor1,
    secretFactor2,
    guessesLeft: config.guesses === Infinity ? Infinity : config.guesses,
    guessesUsed: 0,
    isGameOver: false,
    timerEnabled: action.timerEnabled !== undefined ? action.timerEnabled : state.timerEnabled,
    timerValue: 60,
    history: [],
    message,
    messageClass: '',
    levelUpPending: false,
    pendingLevelUpDifficulty: null,
    pendingLevelUpFrom: null,
    pendingLevelUpTo: null,
    twoPlayer,
  };
}

function handleSubmitGuess(state, action) {
  if (state.isGameOver) return state;

  const guess = action.guess;
  const config = state.config;
  if (!config) return state;

  const isMultiply = config.type === 'multiply';
  const isTwoPlayer = config.type === 'twoplayer';

  const historyEntry = {
    guess,
    result: guess > state.secretNumber ? 'too-high' : 'too-low',
  };

  const newHistory = [...state.history, historyEntry];
  const newGuessesUsed = state.guessesUsed + 1;
  const newGuessesLeft =
    state.guessesLeft === Infinity ? Infinity : Math.max(0, state.guessesLeft - 1);

  if (guess === state.secretNumber) {
    if (isTwoPlayer) {
      return handleTwoPlayerWin(state, newHistory, newGuessesUsed, newGuessesLeft);
    }
    return handleWin(state, newHistory, newGuessesUsed);
  }

  if (newGuessesLeft === 0) {
    if (isTwoPlayer) {
      return handleTwoPlayerLose(state, newHistory, newGuessesUsed, newGuessesLeft);
    }
    return handleLose(state, newHistory, newGuessesUsed, newGuessesLeft, false);
  }

  const message = guess > state.secretNumber ? MESSAGES.tooHigh : MESSAGES.tooLow;
  const messageClass = guess > state.secretNumber ? 'hint-high' : 'hint-low';

  return {
    ...state,
    guessesUsed: newGuessesUsed,
    guessesLeft: newGuessesLeft,
    history: newHistory,
    message,
    messageClass,
  };
}

function handleWin(state, history, guessesUsed) {
  const isMultiply = state.config.type === 'multiply';
  const today = getTodayDateString();

  const newTotalWins = state.totalWins + 1;
  const newStreak = state.lastWinDate === today ? state.streak + 1 : 1;

  const newHighScore =
    state.highScore === null || guessesUsed < state.highScore ? guessesUsed : state.highScore;

  let nextState = {
    ...state,
    screen: isMultiply ? 'levelup' : 'win',
    isGameOver: true,
    guessesUsed,
    history,
    message: isMultiply ? MESSAGES.correctMult : THEMES[state.theme].correctMsg,
    messageClass: 'correct',
    totalWins: newTotalWins,
    streak: newStreak,
    lastWinDate: today,
    highScore: newHighScore,
    hasPlayedBefore: true,
  };

  if (isMultiply) {
    const currentLevel = state.mathLevel[state.difficulty] || 1;
    const nextLevel = currentLevel + 1;
    const { factor1Max, factor2Max } = computeMultiplyRange(state.difficulty, {
      ...state.mathLevel,
      [state.difficulty]: nextLevel,
    });
    const maxProduct = factor1Max * factor2Max;

    nextState = {
      ...nextState,
      levelUpPending: true,
      pendingLevelUpDifficulty: state.difficulty,
      pendingLevelUpFrom: currentLevel,
      pendingLevelUpTo: nextLevel,
      levelUpMessage: `Level ${currentLevel} Complete! 🎉\nReady for Level ${nextLevel} (up to ${maxProduct})?`,
      mathLevel: {
        ...state.mathLevel,
        [state.difficulty]: nextLevel,
      },
    };
  }

  return nextState;
}

function handleLose(state, history, guessesUsed, guessesLeft, timerRanOut) {
  const isMultiply = state.config.type === 'multiply';

  return {
    ...state,
    screen: 'lose',
    isGameOver: true,
    guessesUsed,
    guessesLeft,
    history,
    message: '',
    messageClass: '',
    streak: 0,
    lastWinDate: null,
    hasPlayedBefore: true,
    timerRanOut,
    showMathAnswer: isMultiply,
    mathAnswer: isMultiply
      ? `${state.secretFactor1} × ${state.secretFactor2} = ${state.secretNumber}`
      : '',
    loseTitle: timerRanOut ? "Time's Up! ⏰" : THEMES[state.theme].loseTitle,
    loseEmoji: THEMES[state.theme].loseEmojis,
    loseEncouragement: THEMES[state.theme].encouragement,
  };
}

function handleTick(state) {
  if (!state.timerEnabled || state.isGameOver || state.screen !== 'game') {
    return state;
  }

  const newTimerValue = state.timerValue - 1;
  if (newTimerValue <= 0) {
    return handleLose(state, state.history, state.guessesUsed, state.guessesLeft, true);
  }

  return {
    ...state,
    timerValue: newTimerValue,
  };
}

function handleAcceptLevelUp(state, rng) {
  if (!state.levelUpPending) return state;

  return handleStartGame(state, { difficulty: state.pendingLevelUpDifficulty, timerEnabled: state.timerEnabled }, rng);
}

function handleDeclineLevelUp(state) {
  return {
    ...state,
    screen: 'setup',
    levelUpPending: false,
    pendingLevelUpDifficulty: null,
    pendingLevelUpFrom: null,
    pendingLevelUpTo: null,
    hasPlayedBefore: true,
  };
}

function handleResetGame(state) {
  return {
    ...state,
    screen: 'setup',
    isGameOver: false,
    hasPlayedBefore: true,
  };
}

function handleTwoPlayerWin(state, history, guessesUsed, guessesLeft) {
  const tp = state.twoPlayer;
  const currentPlayer = tp.currentPlayer;
  const newP1Score = currentPlayer === 1 ? tp.p1Score + 1 : tp.p1Score;
  const newP2Score = currentPlayer === 2 ? tp.p2Score + 1 : tp.p2Score;
  const newRoundsPlayed = tp.roundsPlayed + 1;

  const newTwoPlayer = {
    ...tp,
    p1Score: newP1Score,
    p2Score: newP2Score,
    roundsPlayed: newRoundsPlayed,
    currentWinner: currentPlayer,
  };

  if (newRoundsPlayed >= 3) {
    let matchWinner = null;
    if (newP1Score > newP2Score) matchWinner = 1;
    else if (newP2Score > newP1Score) matchWinner = 2;
    else matchWinner = 0;

    return {
      ...state,
      screen: 'win',
      isGameOver: true,
      guessesUsed,
      guessesLeft,
      history,
      message: `🎉 Player ${currentPlayer} wins this round!`,
      messageClass: 'correct',
      twoPlayer: { ...newTwoPlayer, matchWinner },
    };
  }

  return {
    ...state,
    guessesUsed,
    guessesLeft,
    history,
    message: `🎉 Player ${currentPlayer} wins this round!`,
    messageClass: 'correct',
    twoPlayer: newTwoPlayer,
    isGameOver: true,
  };
}

function handleTwoPlayerLose(state, history, guessesUsed, guessesLeft) {
  const tp = state.twoPlayer;
  const currentPlayer = tp.currentPlayer;
  const winner = currentPlayer === 1 ? 2 : 1;
  const newRoundsPlayed = tp.roundsPlayed + 1;

  const newTwoPlayer = {
    ...tp,
    p1Score: winner === 1 ? tp.p1Score + 1 : tp.p1Score,
    p2Score: winner === 2 ? tp.p2Score + 1 : tp.p2Score,
    roundsPlayed: newRoundsPlayed,
    currentWinner: winner,
  };

  if (newRoundsPlayed >= 3) {
    let matchWinner = null;
    if (newTwoPlayer.p1Score > newTwoPlayer.p2Score) matchWinner = 1;
    else if (newTwoPlayer.p2Score > newTwoPlayer.p1Score) matchWinner = 2;
    else matchWinner = 0;

    return {
      ...state,
      screen: 'win',
      isGameOver: true,
      guessesUsed,
      guessesLeft,
      history,
      message: `😢 Out of guesses! Player ${winner} wins!`,
      messageClass: 'hint-high',
      twoPlayer: { ...newTwoPlayer, matchWinner },
    };
  }

  return {
    ...state,
    guessesUsed,
    guessesLeft,
    history,
    message: `😢 Out of guesses! Player ${winner} wins!`,
    messageClass: 'hint-high',
    twoPlayer: newTwoPlayer,
    isGameOver: true,
  };
}

function handleStartTwoPlayerNextRound(state, rng) {
  const tp = state.twoPlayer;
  const nextPlayer = tp.currentPlayer === 1 ? 2 : 1;

  return handleStartGame(
    { ...state, twoPlayer: { ...tp, currentPlayer: nextPlayer, isActive: true } },
    { difficulty: 'two-player', timerEnabled: state.timerEnabled },
    rng
  );
}

function handleEndTwoPlayerMatch(state) {
  return {
    ...createInitialState({
      theme: state.theme,
      mathLevel: state.mathLevel,
      totalWins: state.totalWins,
      streak: state.streak,
      lastWinDate: state.lastWinDate,
      highScore: state.highScore,
      hasPlayedBefore: true,
    }),
    twoPlayer: {
      currentPlayer: 1,
      p1Score: 0,
      p2Score: 0,
      roundsPlayed: 0,
      currentWinner: null,
      isActive: false,
      matchWinner: null,
    },
  };
}

function handleStartDaily(state, action, rng) {
  const today = getTodayDateString();
  const existing = state.dailyChallenge;

  if (existing.lastPlayedDate === today) {
    return {
      ...state,
      screen: 'daily-result',
      dailyChallenge: {
        ...existing,
        currentDate: today,
        dailyMessage: "You already played today! Come back tomorrow! 🌅",
        dailyMessageClass: 'hint-high',
      },
    };
  }

  const dayIndex = Math.floor(new Date(today).getTime() / (24 * 60 * 60 * 1000));
  const difficulties = ['easy', 'medium', 'hard'];
  const dailyDifficulty = difficulties[dayIndex % 3];
  const config = DIFFICULTIES[dailyDifficulty];

  const secretNumber = randomInt(rng, config.min, config.max);

  return {
    ...state,
    screen: 'daily-challenge',
    dailyChallenge: {
      ...existing,
      currentDate: today,
      dailyDifficulty,
      dailySecretNumber: secretNumber,
      dailyGuessesUsed: 0,
      dailyIsGameOver: false,
      dailyMessage: "Today's challenge! Can you find it in 1 guess? 🔢",
      dailyMessageClass: '',
      history: [],
    },
  };
}

function handleSubmitDailyGuess(state, action) {
  const dc = state.dailyChallenge;
  if (dc.dailyIsGameOver || dc.lastPlayedDate === dc.currentDate) {
    return state;
  }

  const guess = action.guess;
  const correct = guess === dc.dailySecretNumber;
  const newHistory = [...dc.history, { guess, result: correct ? 'correct' : (guess > dc.dailySecretNumber ? 'too-high' : 'too-low') }];
  const newGuessesUsed = dc.dailyGuessesUsed + 1;

  const historyEntry = {
    date: dc.currentDate,
    difficulty: dc.dailyDifficulty,
    guess,
    secretNumber: dc.dailySecretNumber,
    correct,
    guessesUsed: newGuessesUsed,
  };

  const updatedHistory = [...dc.history, historyEntry];

  if (correct) {
    return {
      ...state,
      screen: 'daily-result',
      dailyChallenge: {
        ...dc,
        dailyGuessesUsed: newGuessesUsed,
        dailyIsGameOver: true,
        lastPlayedDate: dc.currentDate,
        dailyMessage: "🎉 Amazing! You got it!",
        dailyMessageClass: 'correct',
        history: updatedHistory,
      },
    };
  }

  return {
    ...state,
    screen: 'daily-result',
    dailyChallenge: {
      ...dc,
      dailyGuessesUsed: newGuessesUsed,
      dailyIsGameOver: true,
      lastPlayedDate: dc.currentDate,
      dailyMessage: `😢 The number was ${dc.dailySecretNumber}. Better luck tomorrow!`,
      dailyMessageClass: 'hint-high',
      history: updatedHistory,
    },
  };
}

export function getDailyDifficultyForDate(dateString) {
  const dayIndex = Math.floor(new Date(dateString).getTime() / (24 * 60 * 60 * 1000));
  const difficulties = ['easy', 'medium', 'hard'];
  return difficulties[dayIndex % 3];
}

export function generateDailySecretNumber(dateString, rng) {
  const difficulty = getDailyDifficultyForDate(dateString);
  const config = DIFFICULTIES[difficulty];
  return {
    difficulty,
    secretNumber: randomInt(rng, config.min, config.max),
    config,
  };
}

export function getDailyCalendar(history, currentDate) {
  const calendar = [];
  const today = new Date(currentDate);
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const entry = history.find((h) => h.date === dateStr);
    calendar.push({
      date: dateStr,
      status: entry ? (entry.correct ? 'win' : 'lose') : 'not-played',
      difficulty: entry ? entry.difficulty : getDailyDifficultyForDate(dateStr),
    });
  }
  return calendar;
}

export function generateShareText(theme, dateString, guessesUsed, correct, streak) {
  const emoji = correct ? '⭐' : '❌';
  const result = correct ? `${guessesUsed} guess${guessesUsed === 1 ? '' : 'es'}` : 'did not find it';
  return `${emoji} ${theme} Hunt — ${dateString}\n${correct ? '⭐' : '❌'} ${result}\n🔥 ${streak}-day streak`;
}

export function getThermometerPercentage(guess, secretNumber, min, max) {
  const range = max - min;
  if (range === 0) return 100;
  const distance = Math.abs(guess - secretNumber);
  return Math.max(0, 100 - (distance / range) * 100);
}

export function getThermometerColor(percentage) {
  if (percentage >= 80) return 'hot';
  if (percentage >= 50) return 'warm';
  if (percentage >= 25) return 'cool';
  return 'cold';
}

export { getTodayDateString };
