const DIFFICULTIES = {
    easy: { min: 1, max: 10, guesses: Infinity, label: 'Easy', emoji: '🌙', type: 'number' },
    medium: { min: 1, max: 50, guesses: 10, label: 'Medium', emoji: '🪐', type: 'number' },
    hard: { min: 1, max: 100, guesses: 7, label: 'Hard', emoji: '🌟', type: 'number' },
    'mult-easy': { min: 1, max: 100, guesses: Infinity, label: 'Multiply Easy', emoji: '➕', type: 'multiply', factor1: 10, factor2: 10 },
    'mult-hard': { min: 1, max: 200, guesses: 10, label: 'Multiply Hard', emoji: '✖️', type: 'multiply', factor1: 20, factor2: 10 },
    'two-player': { min: 1, max: 50, guesses: 10, label: 'Two Player', emoji: '👥', type: 'twoplayer' }
};

const THEMES = {
    space: {
        name: 'Space',
        background: 'stars',
        character: '🧑‍🚀',
        winEmojis: '🎉🌟🚀🎊',
        loseEmojis: '😢🌙',
        winTitle: 'YOU DID IT! 🌟',
        loseTitle: 'Mission Failed 😢',
        encouragement: "Don't give up, astronaut! Try again! 💪",
        correctMsg: "🎉 YOU FOUND IT! Amazing job, astronaut!",
        submitBtn: "Blast Off! 🚀"
    },
    dinosaur: {
        name: 'Dinosaur',
        background: 'jungle',
        character: '🦕',
        winEmojis: '🎉🦖🌋💥',
        loseEmojis: '😢🌋',
        loseTitle: 'Extinction! 😢',
        encouragement: "Don't give up, dino! Try again! 💪",
        correctMsg: "🎉 ROAR! You found it, brave dino!",
        submitBtn: "ROAR! 🦖"
    },
    ocean: {
        name: 'Ocean',
        background: 'ocean',
        character: '🐙',
        winEmojis: '🎉🐠🌊🦀',
        loseEmojis: '😢🐚',
        loseTitle: 'Swept Away! 😢',
        encouragement: "Don't give up, explorer! Try again! 💪",
        correctMsg: "🎉 SPLASH! You found it, ocean hero!",
        submitBtn: "Dive In! 🌊"
    }
};

let currentTheme = 'space';
let totalWins = parseInt(localStorage.getItem('guessTheNumberTotalWins')) || 0;
let twoPlayerState = {
    currentPlayer: 1,
    p1Score: 0,
    p2Score: 0,
    roundsPlayed: 0,
    currentWinner: null
};
let gameState = {
    secretNumber: 0,
    secretFactor1: 0,
    secretFactor2: 0,
    difficulty: null,
    guessesLeft: 0,
    guessesUsed: 0,
    isGameOver: false,
    timerEnabled: false,
    timerValue: 60,
    timerInterval: null,
    hasPlayedBefore: false,
    streak: 0,
    lastWinTime: null,
    isTwoPlayer: false,
    mathLevel: {
        'mult-easy': 1,
        'mult-hard': 1
    }
};

const MESSAGES = {
    start: "I'm thinking of a number... Can you find it? 🔢",
    startMult: "I'm thinking of a multiplication answer... Can you solve it? 🔢",
    correct: "🎉 YOU FOUND IT! Amazing job, astronaut!",
    correctMult: "🎉 ROAR! You solved it, math genius!",
    tooHigh: "📉 Too high! The number is smaller. Try again!",
    tooLow: "📈 Too low! The number is bigger. Try again!",
    invalid: "🤔 That's not a valid number. Try again!",
    outOfRange: (min, max) => `Please enter a number between ${min} and ${max}!`
};

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
    themeToggle: document.getElementById('theme-toggle'),
    themeButtons: document.querySelectorAll('.theme-btn'),
    dinoThemeBtn: document.getElementById('dino-theme-btn'),
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
    levelupMessage: document.getElementById('levelup-message')
};

function init() {
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.addEventListener('click', () => startGame(btn.dataset.difficulty));
    });

    elements.submitBtn.addEventListener('click', handleGuess);
    elements.guessInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleGuess();
    });

    elements.playAgainWin.addEventListener('click', resetGame);
    elements.playAgainLose.addEventListener('click', resetGame);

    elements.levelupYes.addEventListener('click', handleLevelUpYes);
    elements.levelupNo.addEventListener('click', handleLevelUpNo);

    elements.settingsBtn.addEventListener('click', () => {
        elements.settingsPanel.classList.remove('hidden');
        updateThemeButtons();
    });

    elements.closeSettings.addEventListener('click', () => {
        elements.settingsPanel.classList.add('hidden');
    });

    elements.timerToggle.addEventListener('change', (e) => {
        gameState.timerEnabled = e.target.checked;
    });

    elements.themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            if (btn.classList.contains('locked')) return;
            
            currentTheme = theme;
            updateThemeButtons();
            applyTheme();
        });
    });

    if (elements.resetProgress) {
        elements.resetProgress.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all progress? This will clear your streak, high score, and relock themes!')) {
                localStorage.removeItem('guessTheNumberStreak');
                localStorage.removeItem('guessTheNumberLastWin');
                localStorage.removeItem('guessTheNumberHighScore');
                localStorage.removeItem('guessTheNumberTotalWins');
                
                totalWins = 0;
                gameState.streak = 0;
                currentTheme = 'space';
                
                elements.streakDisplay.classList.add('hidden');
                elements.highScoreDisplay.classList.add('hidden');
                updateThemeButtons();
                applyTheme();
                
                alert('Progress reset! Start fresh!');
            }
        });
    }

    loadHighScore();
    loadStreak();
    applyTheme();
}

function updateThemeButtons() {
    elements.themeButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.theme === currentTheme) {
            btn.classList.add('active');
        }
    });

    if (totalWins >= 10) {
        elements.oceanThemeBtn.classList.remove('locked');
        elements.oceanThemeBtn.textContent = '🐙';
        elements.oceanThemeBtn.title = 'Ocean Theme';
        elements.unlockHint.textContent = 'Ocean theme unlocked! 🌊';
    } else {
        elements.unlockHint.textContent = `Win ${10 - totalWins} more games to unlock Ocean! 🌊`;
    }
}

function startGame(difficulty) {
    const config = DIFFICULTIES[difficulty];
    const isMultiply = config.type === 'multiply';
    const isTwoPlayer = config.type === 'twoplayer';
    
    let secretNum, factor1Max, factor2Max, maxRange;
    
    if (isMultiply) {
        const level = gameState.mathLevel[difficulty] || 1;
        const isHard = difficulty === 'mult-hard';
        
        if (isHard) {
            factor1Max = Math.min(20, 10 + level * 2);
            factor2Max = Math.min(10, 5 + Math.floor(level / 2));
        } else {
            factor1Max = Math.min(10, 3 + level);
            factor2Max = Math.min(10, 3 + level);
        }
        
        maxRange = factor1Max * factor2Max;
        
        gameState.secretFactor1 = Math.floor(Math.random() * factor1Max) + 1;
        gameState.secretFactor2 = Math.floor(Math.random() * factor2Max) + 1;
        secretNum = gameState.secretFactor1 * gameState.secretFactor2;
    } else {
        secretNum = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
        factor1Max = config.factor1;
        factor2Max = config.factor2;
        maxRange = config.max;
    }
    
    gameState = {
        secretNumber: secretNum,
        difficulty: difficulty,
        secretFactor1: gameState.secretFactor1,
        secretFactor2: gameState.secretFactor2,
        guessesLeft: config.guesses === Infinity ? '∞' : config.guesses,
        guessesUsed: 0,
        isGameOver: false,
        timerEnabled: gameState.timerEnabled,
        timerValue: 60,
        timerInterval: null,
        hasPlayedBefore: gameState.hasPlayedBefore,
        streak: gameState.streak,
        isTwoPlayer: isTwoPlayer,
        mathLevel: { ...gameState.mathLevel }
    };

    if (isMultiply) {
        const level = gameState.mathLevel[difficulty] || 1;
        elements.difficultyLabel.textContent = `Math: ${config.emoji} Level ${level} (1-${factor1Max} × 1-${factor2Max})`;
    } else if (isTwoPlayer) {
        elements.difficultyLabel.textContent = `👥 Two Player - ${config.label} (${config.min}-${config.max})`;
    } else {
        elements.difficultyLabel.textContent = `Mission: ${config.emoji} ${config.label} (${config.min}-${config.max})`;
    }
    elements.guessesLeftEl.textContent = config.guesses === Infinity ? '⭐ ∞' : `⭐ ${gameState.guessesLeft}`;
    elements.message.textContent = isMultiply ? MESSAGES.startMult : (isTwoPlayer ? `Player ${twoPlayerState.currentPlayer}'s turn!` : MESSAGES.start);
    elements.message.className = 'message';
    elements.guessInput.value = '';
    elements.guessInput.min = 1;
    elements.guessInput.max = isMultiply ? maxRange : config.max;
    elements.guessList.innerHTML = '';

    if (gameState.timerEnabled) {
        elements.timerDisplay.classList.remove('hidden');
        elements.timerValue.textContent = gameState.timerValue;
        startTimer();
    } else {
        elements.timerDisplay.classList.add('hidden');
    }

    elements.character.textContent = THEMES[currentTheme].character;
    elements.submitBtn.textContent = THEMES[currentTheme].submitBtn;

    if (!isMultiply && !isTwoPlayer) {
        elements.thermometer.classList.remove('hidden');
    } else {
        elements.thermometer.classList.add('hidden');
    }

    if (isTwoPlayer) {
        elements.twoPlayerInfo.classList.remove('hidden');
        elements.player1Turn.classList.remove('active');
        elements.player2Turn.classList.remove('active');
        if (twoPlayerState.currentPlayer === 1) {
            elements.player1Turn.classList.add('active');
        } else {
            elements.player2Turn.classList.add('active');
        }
        elements.p1Score.textContent = twoPlayerState.p1Score;
        elements.p2Score.textContent = twoPlayerState.p2Score;
    } else {
        elements.twoPlayerInfo.classList.add('hidden');
    }

    applyDifficultyBackground();
    showScreen('game');
    elements.guessInput.focus();
}

function startTimer() {
    stopTimer();
    gameState.timerInterval = setInterval(() => {
        gameState.timerValue--;
        elements.timerValue.textContent = gameState.timerValue;
        
        if (gameState.timerValue <= 10) {
            elements.timerValue.style.color = '#ff5252';
        } else {
            elements.timerValue.style.color = '';
        }

        if (gameState.timerValue <= 0) {
            stopTimer();
            loseGame(true);
        }
    }, 1000);
}

function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

function handleGuess() {
    if (gameState.isGameOver) return;

    const guess = parseInt(elements.guessInput.value);
    const config = DIFFICULTIES[gameState.difficulty];
    const isMultiply = config.type === 'multiply';
    const isTwoPlayer = config.type === 'twoplayer';

    elements.character.classList.remove('shake', 'bounce');

    if (isNaN(guess)) {
        showMessage(MESSAGES.invalid, '');
        shakeCharacter();
        return;
    }

    if (guess < config.min || guess > config.max) {
        showMessage(MESSAGES.outOfRange(config.min, config.max), '');
        shakeCharacter();
        return;
    }

    gameState.guessesUsed++;
    
    if (config.guesses !== Infinity) {
        gameState.guessesLeft--;
        elements.guessesLeftEl.textContent = `⭐ ${gameState.guessesLeft}`;
    }

    addGuessToHistory(guess);

    if (!isMultiply && !isTwoPlayer) {
        updateThermometer(guess);
    }

    if (guess === gameState.secretNumber) {
        stopTimer();
        if (isTwoPlayer) {
            handleTwoPlayerWin();
        } else {
            winGame();
        }
    } else if (gameState.guessesLeft === 0 || (gameState.guessesLeft === '∞' && false)) {
        if (isTwoPlayer) {
            handleTwoPlayerLose();
        } else {
            loseGame();
        }
    } else if (guess > gameState.secretNumber) {
        showMessage(MESSAGES.tooHigh, 'hint-high');
        shakeCharacter();
    } else {
        showMessage(MESSAGES.tooLow, 'hint-low');
        shakeCharacter();
    }

    elements.guessInput.value = '';
    elements.guessInput.focus();
}

function handleTwoPlayerWin() {
    if (twoPlayerState.currentPlayer === 1) {
        twoPlayerState.p1Score++;
    } else {
        twoPlayerState.p2Score++;
    }
    twoPlayerState.currentWinner = twoPlayerState.currentPlayer;
    twoPlayerState.roundsPlayed++;
    
    const winnerMsg = `🎉 Player ${twoPlayerState.currentPlayer} wins this round!`;
    showMessage(winnerMsg, 'correct');
    danceCharacter();
    playWinSound();
    
    setTimeout(() => {
        switchTwoPlayerTurn();
    }, 1500);
}

function handleTwoPlayerLose() {
    twoPlayerState.currentWinner = twoPlayerState.currentPlayer === 1 ? 2 : 1;
    twoPlayerState.roundsPlayed++;
    
    const winnerMsg = `😢 Out of guesses! Player ${twoPlayerState.currentWinner} wins!`;
    showMessage(winnerMsg, 'hint-high');
    
    setTimeout(() => {
        switchTwoPlayerTurn();
    }, 1500);
}

function switchTwoPlayerTurn() {
    if (twoPlayerState.roundsPlayed >= 3) {
        endTwoPlayerGame();
        return;
    }
    
    twoPlayerState.currentPlayer = twoPlayerState.currentPlayer === 1 ? 2 : 1;
    startGame('two-player');
}

function endTwoPlayerGame() {
    gameState.isGameOver = true;
    
    let winner, loser;
    if (twoPlayerState.p1Score > twoPlayerState.p2Score) {
        winner = 1;
        loser = 2;
    } else if (twoPlayerState.p2Score > twoPlayerState.p1Score) {
        winner = 2;
        loser = 1;
    } else {
        winner = 0;
    }
    
    if (winner === 0) {
        elements.winTitle.textContent = "It's a Tie! 🤝";
        elements.winEmoji.textContent = '🤝🎉';
    } else {
        elements.winTitle.textContent = `Player ${winner} Wins! 🎉`;
        elements.winEmoji.textContent = '👑🎉🏆';
    }
    
    elements.finalGuesses.textContent = `${twoPlayerState.p1Score} - ${twoPlayerState.p2Score}`;
    showScreen('win');
    createConfetti();
    playWinSound();
    
    twoPlayerState = {
        currentPlayer: 1,
        p1Score: 0,
        p2Score: 0,
        roundsPlayed: 0,
        currentWinner: null
    };
}

function updateThermometer(guess) {
    const config = DIFFICULTIES[gameState.difficulty];
    const range = config.max - config.min;
    const distance = Math.abs(guess - gameState.secretNumber);
    const percentage = Math.max(0, 100 - (distance / range) * 100);
    
    elements.thermometerFill.style.height = percentage + '%';
    
    if (percentage >= 80) {
        elements.thermometerFill.style.background = 'linear-gradient(to top, #ff5252, #ff1744)';
    } else if (percentage >= 50) {
        elements.thermometerFill.style.background = 'linear-gradient(to top, #ffab40, #ff9100)';
    } else if (percentage >= 25) {
        elements.thermometerFill.style.background = 'linear-gradient(to top, #ffea00, #ffc400)';
    } else {
        elements.thermometerFill.style.background = 'linear-gradient(to top, #00e676, #00c853)';
    }
}

function showMessage(text, className) {
    elements.message.textContent = text;
    elements.message.className = 'message' + (className ? ` ${className}` : '');
}

function addGuessToHistory(guess) {
    const item = document.createElement('span');
    item.className = 'guess-item';
    item.textContent = guess;
    
    if (guess > gameState.secretNumber) {
        item.classList.add('too-high');
        item.title = 'Too high!';
    } else {
        item.classList.add('too-low');
        item.title = 'Too low!';
    }
    
    elements.guessList.appendChild(item);
}

function shakeCharacter() {
    elements.character.classList.add('shake');
    setTimeout(() => elements.character.classList.remove('shake'), 500);
}

function bounceCharacter() {
    elements.character.classList.add('bounce');
    setTimeout(() => elements.character.classList.remove('bounce'), 600);
}

function danceCharacter() {
    elements.character.classList.add('dance');
    setTimeout(() => elements.character.classList.remove('dance'), 1500);
}

function winGame() {
    gameState.isGameOver = true;
    const config = DIFFICULTIES[gameState.difficulty];
    const isMultiply = config.type === 'multiply';
    
    totalWins++;
    localStorage.setItem('guessTheNumberTotalWins', totalWins);
    
    const msg = isMultiply ? MESSAGES.correctMult : THEMES[currentTheme].correctMsg;
    showMessage(msg, 'correct');
    danceCharacter();
    playWinSound();
    
    updateStreak();
    
    elements.finalGuesses.textContent = gameState.guessesUsed;
    elements.winTitle.textContent = THEMES[currentTheme].winTitle;
    elements.winEmoji.textContent = THEMES[currentTheme].winEmojis;
    
    if (isMultiply) {
        const currentLevel = gameState.mathLevel[gameState.difficulty] || 1;
        const nextLevel = currentLevel + 1;
        gameState.mathLevel[gameState.difficulty] = nextLevel;
        
        setTimeout(() => {
            showLevelUpScreen(gameState.difficulty, currentLevel, nextLevel);
        }, 800);
    } else {
        setTimeout(() => {
            showScreen('win');
            createConfetti();
        }, 800);
    }
}

function showLevelUpScreen(difficulty, currentLevel, nextLevel) {
    const isHard = difficulty === 'mult-hard';
    
    let nextFactor1Max, nextFactor2Max;
    if (isHard) {
        nextFactor1Max = Math.min(20, 10 + nextLevel * 2);
        nextFactor2Max = Math.min(10, 5 + Math.floor(nextLevel / 2));
    } else {
        nextFactor1Max = Math.min(10, 3 + nextLevel);
        nextFactor2Max = Math.min(10, 3 + nextLevel);
    }
    
    const maxProduct = nextFactor1Max * nextFactor2Max;
    
    elements.levelupMessage.textContent = `Level ${currentLevel} Complete! 🎉\nReady for Level ${nextLevel} (up to ${maxProduct})?`;
    showScreen('levelup');
}

function handleLevelUpYes() {
    const difficulty = gameState.difficulty;
    const currentLevel = gameState.mathLevel[difficulty];
    
    gameState.hasPlayedBefore = true;
    saveHighScore();
    loadHighScore();
    
    startGame(difficulty);
}

function handleLevelUpNo() {
    gameState.hasPlayedBefore = true;
    saveHighScore();
    loadHighScore();
    showScreen('setup');
}

function loseGame(timerRanOut = false) {
    gameState.isGameOver = true;
    stopTimer();
    
    const config = DIFFICULTIES[gameState.difficulty];
    const isMultiply = config.type === 'multiply';
    
    resetStreak();
    
    if (isMultiply) {
        elements.secretNumber.textContent = gameState.secretNumber;
        elements.mathAnswer.textContent = `${gameState.secretFactor1} × ${gameState.secretFactor2} = ${gameState.secretNumber}`;
        elements.loseMessageMath.classList.remove('hidden');
        elements.loseMessageTime.classList.add('hidden');
    } else {
        elements.secretNumber.textContent = gameState.secretNumber;
        elements.loseMessageMath.classList.add('hidden');
        
        if (timerRanOut) {
            elements.loseMessageTime.classList.remove('hidden');
        } else {
            elements.loseMessageTime.classList.add('hidden');
        }
    }
    
    elements.loseTitle.textContent = timerRanOut ? "Time's Up! ⏰" : THEMES[currentTheme].loseTitle;
    elements.loseEmoji.textContent = THEMES[currentTheme].loseEmojis;
    elements.loseEncouragement.textContent = THEMES[currentTheme].encouragement;
    
    showScreen('lose');
}

function resetGame() {
    gameState.hasPlayedBefore = true;
    saveHighScore();
    loadHighScore();
    showScreen('setup');
}

function showScreen(screenName) {
    const screens = ['setup', 'game', 'win', 'lose', 'levelup'];
    screens.forEach(s => {
        document.getElementById(`${s}-screen`).classList.add('hidden');
    });
    document.getElementById(`${screenName}-screen`).classList.remove('hidden');
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
        confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
        container.appendChild(confetti);
    }

    setTimeout(() => container.remove(), 5000);
}

function loadHighScore() {
    const highScore = localStorage.getItem('guessTheNumberHighScore');
    if (gameState.hasPlayedBefore && highScore) {
        elements.highScoreValue.textContent = highScore;
        elements.highScoreDisplay.classList.remove('hidden');
    }
}

function saveHighScore() {
    if (gameState.guessesUsed > 0) {
        const currentHighScore = localStorage.getItem('guessTheNumberHighScore');
        if (!currentHighScore || gameState.guessesUsed < parseInt(currentHighScore)) {
            localStorage.setItem('guessTheNumberHighScore', gameState.guessesUsed);
        }
    }
}

function playWinSound() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.50];
    let delay = 0;
    
    notes.forEach((freq, i) => {
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
}

function loadStreak() {
    const streak = localStorage.getItem('guessTheNumberStreak');
    const lastWin = localStorage.getItem('guessTheNumberLastWin');
    
    if (streak && lastWin) {
        const oneDay = 24 * 60 * 60 * 1000;
        const daysSinceLastWin = (Date.now() - parseInt(lastWin)) / oneDay;
        
        if (daysSinceLastWin < 1) {
            gameState.streak = parseInt(streak);
            elements.streakValue.textContent = gameState.streak;
            elements.streakDisplay.classList.remove('hidden');
        } else {
            gameState.streak = 0;
            localStorage.setItem('guessTheNumberStreak', 0);
        }
    }
}

function updateStreak() {
    gameState.streak++;
    localStorage.setItem('guessTheNumberStreak', gameState.streak);
    localStorage.setItem('guessTheNumberLastWin', Date.now());
    elements.streakValue.textContent = gameState.streak;
    elements.streakDisplay.classList.remove('hidden');
}

function resetStreak() {
    gameState.streak = 0;
    localStorage.setItem('guessTheNumberStreak', 0);
    elements.streakDisplay.classList.add('hidden');
}

function applyTheme() {
    const theme = THEMES[currentTheme];
    applyDifficultyBackground();
    
    if (currentTheme === 'dinosaur') {
        document.documentElement.style.setProperty('--bg-dark', '#1a3a1a');
        document.documentElement.style.setProperty('--bg-light', '#2d5a2d');
        document.querySelector('h1').textContent = 'Dino Number Hunt 🦕';
        document.querySelector('.subtitle').textContent = 'Help the dinosaur find the secret number!';
    } else if (currentTheme === 'ocean') {
        document.documentElement.style.setProperty('--bg-dark', '#0a1a2e');
        document.documentElement.style.setProperty('--bg-light', '#1a3a5e');
        document.querySelector('h1').textContent = 'Ocean Number Hunt 🌊';
        document.querySelector('.subtitle').textContent = 'Help the octopus find the secret number! 🐙';
    } else {
        document.documentElement.style.setProperty('--bg-dark', '#0c1445');
        document.documentElement.style.setProperty('--bg-light', '#1a237e');
        document.querySelector('h1').textContent = 'Space Number Hunt 🚀';
        document.querySelector('.subtitle').textContent = 'Help the astronaut find the secret number!';
    }
    
    if (elements.character) {
        elements.character.textContent = THEMES[currentTheme].character;
    }
    if (elements.submitBtn) {
        elements.submitBtn.textContent = THEMES[currentTheme].submitBtn;
    }
    
    if (elements.themeToggle) {
        elements.themeToggle.checked = currentTheme === 'dinosaur';
    }
}

function applyDifficultyBackground() {
    document.body.classList.remove('easy-bg', 'medium-bg', 'hard-bg', 'math-bg');
    
    if (gameState.difficulty) {
        const diff = gameState.difficulty;
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

init();
