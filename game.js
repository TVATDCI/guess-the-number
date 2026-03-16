const DIFFICULTIES = {
    easy: { min: 1, max: 10, guesses: Infinity, label: 'Easy', emoji: '🌙', type: 'number' },
    medium: { min: 1, max: 50, guesses: 10, label: 'Medium', emoji: '🪐', type: 'number' },
    hard: { min: 1, max: 100, guesses: 7, label: 'Hard', emoji: '🌟', type: 'number' },
    'mult-easy': { min: 1, max: 36, guesses: Infinity, label: 'Multiply Easy', emoji: '➕', type: 'multiply', factor1: 6, factor2: 6 },
    'mult-hard': { min: 1, max: 100, guesses: 10, label: 'Multiply Hard', emoji: '✖️', type: 'multiply', factor1: 10, factor2: 10 }
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
    }
};

let currentTheme = 'space';
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
    lastWinTime: null
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
    thermometerFill: document.getElementById('thermometer-fill')
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

    elements.settingsBtn.addEventListener('click', () => {
        elements.settingsPanel.classList.remove('hidden');
    });

    elements.closeSettings.addEventListener('click', () => {
        elements.settingsPanel.classList.add('hidden');
    });

    elements.timerToggle.addEventListener('change', (e) => {
        gameState.timerEnabled = e.target.checked;
    });

    elements.themeToggle.addEventListener('change', (e) => {
        currentTheme = e.target.checked ? 'dinosaur' : 'space';
        applyTheme();
    });

    loadHighScore();
    loadStreak();
    applyTheme();
}

function startGame(difficulty) {
    const config = DIFFICULTIES[difficulty];
    const isMultiply = config.type === 'multiply';
    
    let secretNum;
    if (isMultiply) {
        gameState.secretFactor1 = Math.floor(Math.random() * config.factor1) + 1;
        gameState.secretFactor2 = Math.floor(Math.random() * config.factor2) + 1;
        secretNum = gameState.secretFactor1 * gameState.secretFactor2;
    } else {
        secretNum = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
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
        streak: gameState.streak
    };

    if (isMultiply) {
        elements.difficultyLabel.textContent = `Math: ${config.emoji} ${gameState.secretFactor1} × ${gameState.secretFactor2} = ?`;
    } else {
        elements.difficultyLabel.textContent = `Mission: ${config.emoji} ${config.label} (${config.min}-${config.max})`;
    }
    elements.guessesLeftEl.textContent = config.guesses === Infinity ? '⭐ ∞' : `⭐ ${gameState.guessesLeft}`;
    elements.message.textContent = isMultiply ? MESSAGES.startMult : MESSAGES.start;
    elements.message.className = 'message';
    elements.guessInput.value = '';
    elements.guessInput.min = config.min;
    elements.guessInput.max = config.max;
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

    if (!isMultiply) {
        elements.thermometer.classList.remove('hidden');
    } else {
        elements.thermometer.classList.add('hidden');
    }

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

    if (!isMultiply) {
        updateThermometer(guess);
    }

    if (guess === gameState.secretNumber) {
        stopTimer();
        winGame();
    } else if (gameState.guessesLeft === 0 || (gameState.guessesLeft === '∞' && false)) {
        loseGame();
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
    
    const msg = isMultiply ? MESSAGES.correctMult : THEMES[currentTheme].correctMsg;
    showMessage(msg, 'correct');
    danceCharacter();
    playWinSound();
    
    updateStreak();
    
    elements.finalGuesses.textContent = gameState.guessesUsed;
    elements.winTitle.textContent = THEMES[currentTheme].winTitle;
    elements.winEmoji.textContent = THEMES[currentTheme].winEmojis;
    
    setTimeout(() => {
        showScreen('win');
        createConfetti();
    }, 800);
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
    const screens = ['setup', 'game', 'win', 'lose'];
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
    document.body.className = theme.background;
    
    if (currentTheme === 'dinosaur') {
        document.documentElement.style.setProperty('--bg-dark', '#1a3a1a');
        document.documentElement.style.setProperty('--bg-light', '#2d5a2d');
        document.querySelector('h1').textContent = 'Dino Number Hunt 🦕';
        document.querySelector('.subtitle').textContent = 'Help the dinosaur find the secret number!';
    } else {
        document.documentElement.style.setProperty('--bg-dark', '#0c1445');
        document.documentElement.style.setProperty('--bg-light', '#1a237e');
        document.querySelector('h1').textContent = 'Space Number Hunt 🚀';
        document.querySelector('.subtitle').textContent = 'Help the astronaut find the secret number!';
    }
    
    elements.themeToggle.checked = currentTheme === 'dinosaur';
}

init();
