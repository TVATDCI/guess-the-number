import { createStorage, createLocalStorageBackend } from './storage.js';
import { createStore } from './store.js';
import { DIFFICULTIES, THEMES, getThermometerPercentage, getThermometerColor, getDailyCalendar, generateShareText } from './engine.js';

export function initUI() {
  const storage = createStorage(createLocalStorageBackend());
  const store = createStore(storage);

  const elements = {
    setupScreen: document.getElementById('setup-screen'),
    gameScreen: document.getElementById('game-screen'),
    winScreen: document.getElementById('win-screen'),
    loseScreen: document.getElementById('lose-screen'),
    levelupScreen: document.getElementById('levelup-screen'),
    difficultyLabel: document.getElementById('difficulty-label'),
    guessesLeftEl: document.getElementById('guesses-left'),
    character: document.getElementById('character'),
    message: document.getElementById('message'),
    guessInput: document.getElementById('guess-input'),
    submitBtn: document.getElementById('submit-btn'),
    guessList: document.getElementById('guess-list'),
    finalGuesses: document.getElementById('final-guesses'),
    secretNumber: document.getElementById('secret-number'),
    mathAnswer: document.getElementById('math-answer'),
    playAgainWin: document.getElementById('play-again-win'),
    playAgainLose: document.getElementById('play-again-lose'),
    settingsBtn: document.getElementById('settings-btn'),
    settingsPanel: document.getElementById('settings-panel'),
    closeSettings: document.getElementById('close-settings'),
    timerToggle: document.getElementById('timer-toggle'),
    themeButtons: document.querySelectorAll('.theme-btn'),
    oceanThemeBtn: document.getElementById('ocean-theme-btn'),
    unlockHint: document.getElementById('unlock-hint'),
    resetProgress: document.getElementById('reset-progress'),
    timerDisplay: document.getElementById('timer-display'),
    timerValue: document.getElementById('timer-value'),
    highScoreDisplay: document.getElementById('high-score-display'),
    highScoreValue: document.getElementById('high-score-value'),
    streakDisplay: document.getElementById('streak-display'),
    streakValue: document.getElementById('streak-value'),
    loseTitle: document.getElementById('lose-title'),
    loseMessageTime: document.getElementById('lose-message-time'),
    loseMessageMath: document.getElementById('lose-message-math'),
    loseEncouragement: document.getElementById('lose-encouragement'),
    winTitle: document.getElementById('win-title'),
    winEmoji: document.getElementById('win-emoji'),
    loseEmoji: document.getElementById('lose-emoji'),
    thermometer: document.getElementById('thermometer'),
    thermometerFill: document.getElementById('thermometer-fill'),
    twoPlayerInfo: document.getElementById('two-player-info'),
    player1Turn: document.getElementById('player-1-turn'),
    player2Turn: document.getElementById('player-2-turn'),
    p1Score: document.getElementById('p1-score'),
    p2Score: document.getElementById('p2-score'),
    levelupYes: document.getElementById('levelup-yes'),
    levelupNo: document.getElementById('levelup-no'),
    levelupMessage: document.getElementById('levelup-message'),
    themeToggle: document.getElementById('theme-toggle'),
    dinoThemeBtn: document.getElementById('dino-theme-btn'),
    dailyChallengeBtn: document.getElementById('daily-challenge-btn'),
    dailyGuessInput: document.getElementById('daily-guess-input'),
    dailySubmitBtn: document.getElementById('daily-submit-btn'),
    dailyDifficultyLabel: document.getElementById('daily-difficulty-label'),
    dailyGuessesLeft: document.getElementById('daily-guesses-left'),
    dailyCharacter: document.getElementById('daily-character'),
    dailyMessage: document.getElementById('daily-message'),
    dailyResultTitle: document.getElementById('daily-result-title'),
    dailyResultMessage: document.getElementById('daily-result-message'),
    dailySecretNumber: document.getElementById('daily-secret-number'),
    dailyYourGuess: document.getElementById('daily-your-guess'),
    dailyCalendarGrid: document.getElementById('daily-calendar-grid'),
    dailyShareBtn: document.getElementById('daily-share-btn'),
    dailyPlayAgain: document.getElementById('daily-play-again'),
  };

  document.querySelectorAll('.diff-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      store.dispatch({ type: 'START_GAME', difficulty: btn.dataset.difficulty });
    });
  });

  elements.submitBtn.addEventListener('click', () => {
    const value = elements.guessInput.value;
    const guess = parseInt(value, 10);
    if (isNaN(guess)) return;
    store.dispatch({ type: 'SUBMIT_GUESS', guess });
  });

  elements.guessInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const value = elements.guessInput.value;
      const guess = parseInt(value, 10);
      if (isNaN(guess)) return;
      store.dispatch({ type: 'SUBMIT_GUESS', guess });
    }
  });

  elements.playAgainWin.addEventListener('click', () => {
    const state = store.getState();
    if (state.twoPlayer.isActive && state.twoPlayer.roundsPlayed < 3) {
      store.dispatch({ type: 'START_TWO_PLAYER_NEXT_ROUND' });
    } else if (state.twoPlayer.isActive) {
      store.dispatch({ type: 'END_TWO_PLAYER_MATCH' });
    } else {
      store.dispatch({ type: 'RESET_GAME' });
    }
  });

  elements.playAgainLose.addEventListener('click', () => {
    const state = store.getState();
    if (state.twoPlayer.isActive && state.twoPlayer.roundsPlayed < 3) {
      store.dispatch({ type: 'START_TWO_PLAYER_NEXT_ROUND' });
    } else if (state.twoPlayer.isActive) {
      store.dispatch({ type: 'END_TWO_PLAYER_MATCH' });
    } else {
      store.dispatch({ type: 'RESET_GAME' });
    }
  });

  if (elements.dailyChallengeBtn) {
    elements.dailyChallengeBtn.addEventListener('click', () => {
      store.dispatch({ type: 'START_DAILY' });
    });
  }

  if (elements.dailySubmitBtn) {
    elements.dailySubmitBtn.addEventListener('click', () => {
      const value = elements.dailyGuessInput.value;
      const guess = parseInt(value, 10);
      if (isNaN(guess)) return;
      store.dispatch({ type: 'SUBMIT_DAILY_GUESS', guess });
    });
  }

  if (elements.dailyGuessInput) {
    elements.dailyGuessInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const value = elements.dailyGuessInput.value;
        const guess = parseInt(value, 10);
        if (isNaN(guess)) return;
        store.dispatch({ type: 'SUBMIT_DAILY_GUESS', guess });
      }
    });
  }

  if (elements.dailyPlayAgain) {
    elements.dailyPlayAgain.addEventListener('click', () => {
      store.dispatch({ type: 'RESET_GAME' });
    });
  }

  if (elements.dailyShareBtn) {
    elements.dailyShareBtn.addEventListener('click', () => {
      const state = store.getState();
      const dc = state.dailyChallenge;
      const lastEntry = dc.history[dc.history.length - 1];
      if (!lastEntry) return;
      const text = generateShareText(
        THEMES[state.theme].name,
        dc.currentDate,
        dc.dailyGuessesUsed,
        lastEntry.correct,
        state.streak
      );
      navigator.clipboard.writeText(text).catch(() => {});
    });
  }

  elements.levelupYes.addEventListener('click', () => {
    store.dispatch({ type: 'ACCEPT_LEVEL_UP' });
  });

  elements.levelupNo.addEventListener('click', () => {
    store.dispatch({ type: 'DECLINE_LEVEL_UP' });
  });

  elements.settingsBtn.addEventListener('click', () => {
    elements.settingsPanel.classList.remove('hidden');
    updateThemeButtons();
  });

  elements.closeSettings.addEventListener('click', () => {
    elements.settingsPanel.classList.add('hidden');
  });

  elements.timerToggle.addEventListener('change', (e) => {
    store.dispatch({ type: 'TIMER_TOGGLE', enabled: e.target.checked });
  });

  elements.themeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      if (btn.classList.contains('locked')) return;
      store.dispatch({ type: 'SET_THEME', theme });
    });
  });

  if (elements.resetProgress) {
    elements.resetProgress.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all progress? This will clear your streak, high score, and relock themes!')) {
        store.dispatch({ type: 'RESET_PROGRESS' });
        elements.settingsPanel.classList.add('hidden');
      }
    });
  }

  function updateThemeButtons() {
    elements.themeButtons.forEach((btn) => {
      btn.classList.remove('active');
      if (btn.dataset.theme === store.getState().theme) {
        btn.classList.add('active');
      }
    });

    const totalWins = store.getState().totalWins;
    if (totalWins >= 10) {
      elements.oceanThemeBtn.classList.remove('locked');
      elements.oceanThemeBtn.textContent = '🐙';
      elements.oceanThemeBtn.title = 'Ocean Theme';
      elements.unlockHint.textContent = 'Ocean theme unlocked! 🌊';
    } else {
      elements.unlockHint.textContent = `Win ${10 - totalWins} more games to unlock Ocean! 🌊`;
    }
  }

  function render(state, prevState) {
    if (state.screen !== prevState?.screen) {
      const screens = ['setup', 'game', 'win', 'lose', 'levelup', 'daily-challenge', 'daily-result'];
      screens.forEach((s) => {
        const el = document.getElementById(`${s}-screen`);
        if (el) el.classList.add('hidden');
      });
      const active = document.getElementById(`${state.screen}-screen`);
      if (active) active.classList.remove('hidden');
    }

    if (state.theme !== prevState?.theme) {
      applyTheme(state.theme);
    }

    if (state.screen === 'setup') {
      if (state.hasPlayedBefore && state.highScore !== null) {
        elements.highScoreValue.textContent = state.highScore;
        elements.highScoreDisplay.classList.remove('hidden');
      } else {
        elements.highScoreDisplay.classList.add('hidden');
      }

      if (state.streak > 0) {
        elements.streakValue.textContent = state.streak;
        elements.streakDisplay.classList.remove('hidden');
      } else {
        elements.streakDisplay.classList.add('hidden');
      }

      updateThemeButtons();
    }

    if (state.screen === 'game') {
      const config = DIFFICULTIES[state.difficulty];
      if (config) {
        if (config.type === 'multiply') {
          const level = state.mathLevel[state.difficulty] || 1;
          const { factor1Max, factor2Max } = computeMultiplyRange(state.difficulty, state.mathLevel);
          elements.difficultyLabel.textContent = `Math: ${config.emoji} Level ${level} (1-${factor1Max} × 1-${factor2Max})`;
        } else if (config.type === 'twoplayer') {
          elements.difficultyLabel.textContent = `👥 Two Player - ${config.label} (${config.min}-${config.max})`;
        } else {
          elements.difficultyLabel.textContent = `Mission: ${config.emoji} ${config.label} (${config.min}-${config.max})`;
        }

        elements.guessesLeftEl.textContent = state.guessesLeft === Infinity ? '⭐ ∞' : `⭐ ${state.guessesLeft}`;
        elements.message.textContent = state.message;
        elements.message.className = `message ${state.messageClass}`;
        elements.guessInput.value = '';
        elements.guessInput.min = config.min;
        elements.guessInput.max = config.max;
        elements.guessInput.focus();

        renderGuessHistory(state.history, state.secretNumber);

        if (state.timerEnabled) {
          elements.timerDisplay.classList.remove('hidden');
          elements.timerValue.textContent = state.timerValue;
          elements.timerValue.style.color = state.timerValue <= 10 ? '#ff5252' : '';
        } else {
          elements.timerDisplay.classList.add('hidden');
        }

        if (config.type === 'number') {
          elements.thermometer.classList.remove('hidden');
          if (state.history.length > 0) {
            const lastGuess = state.history[state.history.length - 1].guess;
            const pct = getThermometerPercentage(lastGuess, state.secretNumber, config.min, config.max);
            elements.thermometerFill.style.height = pct + '%';
            const color = getThermometerColor(pct);
            const colors = {
              hot: 'linear-gradient(to top, #ff5252, #ff1744)',
              warm: 'linear-gradient(to top, #ffab40, #ff9100)',
              cool: 'linear-gradient(to top, #ffea00, #ffc400)',
              cold: 'linear-gradient(to top, #00e676, #00c853)',
            };
            elements.thermometerFill.style.background = colors[color];
          } else {
            elements.thermometerFill.style.height = '0%';
          }
        } else {
          elements.thermometer.classList.add('hidden');
        }

        if (config.type === 'twoplayer') {
          elements.twoPlayerInfo.classList.remove('hidden');
          elements.player1Turn.classList.toggle('active', state.twoPlayer.currentPlayer === 1);
          elements.player2Turn.classList.toggle('active', state.twoPlayer.currentPlayer === 2);
          elements.p1Score.textContent = state.twoPlayer.p1Score;
          elements.p2Score.textContent = state.twoPlayer.p2Score;
        } else {
          elements.twoPlayerInfo.classList.add('hidden');
        }
      }

      elements.character.textContent = THEMES[state.theme].character;
      elements.submitBtn.textContent = THEMES[state.theme].submitBtn;
    }

    if (state.screen === 'win') {
      if (state.twoPlayer.isActive) {
        const tp = state.twoPlayer;
        if (tp.matchWinner === 0) {
          elements.winTitle.textContent = "It's a Tie! 🤝";
          elements.winEmoji.textContent = '🤝🎉';
        } else {
          elements.winTitle.textContent = `Player ${tp.matchWinner} Wins! 🎉`;
          elements.winEmoji.textContent = '👑🎉🏆';
        }
        elements.finalGuesses.textContent = `${tp.p1Score} - ${tp.p2Score}`;
      } else {
        elements.winTitle.textContent = THEMES[state.theme].winTitle;
        elements.winEmoji.textContent = THEMES[state.theme].winEmojis;
        elements.finalGuesses.textContent = state.guessesUsed;
      }

      if (prevState?.screen !== 'win') {
        createConfetti();
        playWinSound();
        elements.character.classList.add('dance');
        setTimeout(() => elements.character.classList.remove('dance'), 1500);
      }
    }

    if (state.screen === 'lose') {
      elements.loseTitle.textContent = state.loseTitle || THEMES[state.theme].loseTitle;
      elements.loseEmoji.textContent = state.loseEmoji || THEMES[state.theme].loseEmojis;
      elements.loseEncouragement.textContent = state.loseEncouragement || THEMES[state.theme].encouragement;
      elements.secretNumber.textContent = state.secretNumber;

      if (state.showMathAnswer) {
        elements.mathAnswer.textContent = state.mathAnswer;
        elements.loseMessageMath.classList.remove('hidden');
      } else {
        elements.loseMessageMath.classList.add('hidden');
      }

      if (state.timerRanOut) {
        elements.loseMessageTime.classList.remove('hidden');
      } else {
        elements.loseMessageTime.classList.add('hidden');
      }
    }

    if (state.screen === 'levelup') {
      elements.levelupMessage.textContent = state.levelUpMessage || '';
    }

    if (state.screen === 'daily-challenge') {
      const dc = state.dailyChallenge;
      const config = DIFFICULTIES[dc.dailyDifficulty];
      if (elements.dailyDifficultyLabel && config) {
        elements.dailyDifficultyLabel.textContent = `📅 Daily Challenge — ${config.label} (${config.min}-${config.max})`;
      }
      if (elements.dailyGuessesLeft) {
        elements.dailyGuessesLeft.textContent = '⭐ 1';
      }
      if (elements.dailyCharacter) {
        elements.dailyCharacter.textContent = THEMES[state.theme].character;
      }
      if (elements.dailyMessage) {
        elements.dailyMessage.textContent = dc.dailyMessage;
        elements.dailyMessage.className = `message ${dc.dailyMessageClass}`;
      }
      if (elements.dailyGuessInput) {
        elements.dailyGuessInput.value = '';
        if (config) {
          elements.dailyGuessInput.min = config.min;
          elements.dailyGuessInput.max = config.max;
        }
        elements.dailyGuessInput.focus();
      }
    }

    if (state.screen === 'daily-result') {
      const dc = state.dailyChallenge;
      const lastEntry = dc.history[dc.history.length - 1];

      if (elements.dailyResultTitle) {
        elements.dailyResultTitle.textContent = lastEntry?.correct ? '🎉 Daily Challenge Complete!' : '😢 Daily Challenge';
      }

      if (elements.dailyResultMessage) {
        elements.dailyResultMessage.textContent = dc.dailyMessage;
      }

      if (elements.dailySecretNumber) {
        elements.dailySecretNumber.textContent = dc.dailySecretNumber;
      }

      if (elements.dailyYourGuess && lastEntry) {
        elements.dailyYourGuess.textContent = lastEntry.guess;
      }

      if (elements.dailyCalendarGrid) {
        const calendar = getDailyCalendar(dc.history, dc.currentDate);
        elements.dailyCalendarGrid.innerHTML = '';
        for (const day of calendar) {
          const dayEl = document.createElement('div');
          dayEl.className = `calendar-day calendar-${day.status}`;
          const date = new Date(day.date);
          dayEl.textContent = `${date.getMonth() + 1}/${date.getDate()}`;
          dayEl.title = `${day.date} — ${day.difficulty} — ${day.status === 'win' ? '✅ Win' : day.status === 'lose' ? '❌ Lose' : '⬜ Not played'}`;
          elements.dailyCalendarGrid.appendChild(dayEl);
        }
      }

      if (lastEntry?.correct) {
        if (prevState?.screen !== 'daily-result') {
          playWinSound();
          if (elements.dailyCharacter) {
            elements.dailyCharacter.classList.add('dance');
            setTimeout(() => elements.dailyCharacter.classList.remove('dance'), 1500);
          }
        }
      }
    }

    if (state.message !== prevState?.message || state.messageClass !== prevState?.messageClass) {
      elements.message.textContent = state.message;
      elements.message.className = `message ${state.messageClass}`;

      if (state.messageClass === 'correct') {
        elements.character.classList.add('dance');
        setTimeout(() => elements.character.classList.remove('dance'), 1500);
      } else if (state.messageClass === 'hint-high' || state.messageClass === 'hint-low') {
        elements.character.classList.add('shake');
        setTimeout(() => elements.character.classList.remove('shake'), 500);
      }
    }
  }

  function renderGuessHistory(history, secretNumber) {
    elements.guessList.innerHTML = '';
    for (const entry of history) {
      const item = document.createElement('span');
      item.className = 'guess-item';
      item.textContent = entry.guess;
      if (entry.result === 'too-high') {
        item.classList.add('too-high');
        item.title = 'Too high!';
      } else {
        item.classList.add('too-low');
        item.title = 'Too low!';
      }
      elements.guessList.appendChild(item);
    }
  }

  function applyTheme(themeName) {
    const theme = THEMES[themeName];
    const root = document.documentElement;
    const h1 = document.querySelector('h1');
    const subtitle = document.querySelector('.subtitle');

    if (themeName === 'dinosaur') {
      root.style.setProperty('--bg-dark', '#1a3a1a');
      root.style.setProperty('--bg-light', '#2d5a2d');
      if (h1) h1.textContent = 'Dino Number Hunt 🦕';
      if (subtitle) subtitle.textContent = 'Help the dinosaur find the secret number!';
    } else if (themeName === 'ocean') {
      root.style.setProperty('--bg-dark', '#0a1a2e');
      root.style.setProperty('--bg-light', '#1a3a5e');
      if (h1) h1.textContent = 'Ocean Number Hunt 🌊';
      if (subtitle) subtitle.textContent = 'Help the octopus find the secret number! 🐙';
    } else {
      root.style.setProperty('--bg-dark', '#0c1445');
      root.style.setProperty('--bg-light', '#1a237e');
      if (h1) h1.textContent = 'Space Number Hunt 🚀';
      if (subtitle) subtitle.textContent = 'Help the astronaut find the secret number!';
    }

    if (elements.character) elements.character.textContent = theme.character;
    if (elements.submitBtn) elements.submitBtn.textContent = theme.submitBtn;
    if (elements.themeToggle) elements.themeToggle.checked = themeName === 'dinosaur';

    applyDifficultyBackground();
  }

  function applyDifficultyBackground() {
    document.body.classList.remove('easy-bg', 'medium-bg', 'hard-bg', 'math-bg');
    const state = store.getState();
    if (state.difficulty) {
      const diff = state.difficulty;
      if (diff === 'easy' || diff === 'two-player') {
        document.body.classList.add('easy-bg');
      } else if (diff === 'medium') {
        document.body.classList.add('medium-bg');
      } else if (diff === 'hard') {
        document.body.classList.add('hard-bg');
      } else if (diff.startsWith('mult-')) {
        document.body.classList.add('math-bg');
      }
    }
  }

  function createConfetti() {
    const colors = ['🌟', '⭐', '🌙', '🚀', '🪐', '✨', '🎉', '💫'];
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.textContent = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.animationDelay = Math.random() * 2 + 's';
      confetti.style.animationDuration = Math.random() * 2 + 2 + 's';
      container.appendChild(confetti);
    }

    setTimeout(() => container.remove(), 5000);
  }

  function playWinSound() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const audioCtx = new AudioContext();
      const notes = [523.25, 659.25, 783.99, 1046.5];
      let delay = 0;

      notes.forEach((freq) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + delay + 0.3);
        oscillator.start(audioCtx.currentTime + delay);
        oscillator.stop(audioCtx.currentTime + delay + 0.3);
        delay += 0.1;
      });
    } catch {
      // Audio not available, silently skip
    }
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
    return { factor1Max, factor2Max };
  }

  store.subscribe(render);
  render(store.getState(), null);
}
