const DIFFICULTIES = {
    easy: { min: 1, max: 10, guesses: Infinity, label: 'Easy', emoji: '🌙' },
    medium: { min: 1, max: 50, guesses: 10, label: 'Medium', emoji: '🪐' },
    hard: { min: 1, max: 100, guesses: 7, label: 'Hard', emoji: '🌟' }
};

const MESSAGES = {
    start: "I'm thinking of a number... Can you find it? 🔢",
    correct: "🎉 YOU FOUND IT! Amazing job, astronaut!",
    tooHigh: "📉 Too high! The number is smaller. Try again!",
    tooLow: "📈 Too low! The number is bigger. Try again!",
    invalid: "🤔 That's not a valid number. Try again!",
    outOfRange: (min, max) => `Please enter a number between ${min} and ${max}!`
};

let gameState = {
    secretNumber: 0,
    difficulty: null,
    guessesLeft: 0,
    guessesUsed: 0,
    isGameOver: false,
    timerEnabled: false,
    timerValue: 60,
    timerInterval: null,
    hasPlayedBefore: false
};

const elements = {
    setupScreen: document.getElementById('setup-screen'),
    gameScreen: document.getElementById('game-screen'),
    winScreen: document.getElementById('win-screen'),
    loseScreen: document.getElementById('lose-screen'),
    difficultyLabel: document.getElementById('difficulty-label'),
    guessesLeftEl: document.getElementById('guesses-left'),
    astronaut: document.getElementById('astronaut'),
    message: document.getElementById('message'),
    guessInput: document.getElementById('guess-input'),
    submitBtn: document.getElementById('submit-btn'),
    guessList: document.getElementById('guess-list'),
    finalGuesses: document.getElementById('final-guesses'),
    secretNumber: document.getElementById('secret-number'),
    playAgainWin: document.getElementById('play-again-win'),
    playAgainLose: document.getElementById('play-again-lose'),
    settingsBtn: document.getElementById('settings-btn'),
    settingsPanel: document.getElementById('settings-panel'),
    closeSettings: document.getElementById('close-settings'),
    timerToggle: document.getElementById('timer-toggle'),
    timerDisplay: document.getElementById('timer-display'),
    timerValue: document.getElementById('timer-value'),
    highScoreDisplay: document.getElementById('high-score-display'),
    highScoreValue: document.getElementById('high-score-value'),
    loseTitle: document.getElementById('lose-title'),
    loseMessageTime: document.getElementById('lose-message-time')
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

    loadHighScore();
}

function startGame(difficulty) {
    const config = DIFFICULTIES[difficulty];
    gameState = {
        secretNumber: Math.floor(Math.random() * (config.max - config.min + 1)) + config.min,
        difficulty: difficulty,
        guessesLeft: config.guesses === Infinity ? '∞' : config.guesses,
        guessesUsed: 0,
        isGameOver: false,
        timerEnabled: gameState.timerEnabled,
        timerValue: 60,
        timerInterval: null,
        hasPlayedBefore: gameState.hasPlayedBefore
    };

    elements.difficultyLabel.textContent = `Mission: ${config.emoji} ${config.label} (${config.min}-${config.max})`;
    elements.guessesLeftEl.textContent = config.guesses === Infinity ? '⭐ ∞' : `⭐ ${gameState.guessesLeft}`;
    elements.message.textContent = MESSAGES.start;
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

    elements.astronaut.classList.remove('shake', 'bounce');

    if (isNaN(guess)) {
        showMessage(MESSAGES.invalid, '');
        shakeAstronaut();
        return;
    }

    if (guess < config.min || guess > config.max) {
        showMessage(MESSAGES.outOfRange(config.min, config.max), '');
        shakeAstronaut();
        return;
    }

    gameState.guessesUsed++;
    
    if (config.guesses !== Infinity) {
        gameState.guessesLeft--;
        elements.guessesLeftEl.textContent = `⭐ ${gameState.guessesLeft}`;
    }

    addGuessToHistory(guess);

    if (guess === gameState.secretNumber) {
        stopTimer();
        winGame();
    } else if (gameState.guessesLeft === 0 || gameState.guessesLeft === '∞' && false) {
        loseGame();
    } else if (guess > gameState.secretNumber) {
        showMessage(MESSAGES.tooHigh, 'hint-high');
        shakeAstronaut();
    } else {
        showMessage(MESSAGES.tooLow, 'hint-low');
        shakeAstronaut();
    }

    elements.guessInput.value = '';
    elements.guessInput.focus();
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

function shakeAstronaut() {
    elements.astronaut.classList.add('shake');
    setTimeout(() => elements.astronaut.classList.remove('shake'), 500);
}

function bounceAstronaut() {
    elements.astronaut.classList.add('bounce');
    setTimeout(() => elements.astronaut.classList.remove('bounce'), 600);
}

function danceAstronaut() {
    elements.astronaut.classList.add('dance');
    setTimeout(() => elements.astronaut.classList.remove('dance'), 1500);
}

function winGame() {
    gameState.isGameOver = true;
    showMessage(MESSAGES.correct, 'correct');
    danceAstronaut();
    playWinSound();
    
    elements.finalGuesses.textContent = gameState.guessesUsed;
    
    setTimeout(() => {
        showScreen('win');
        createConfetti();
    }, 800);
}

function loseGame(timerRanOut = false) {
    gameState.isGameOver = true;
    stopTimer();
    elements.secretNumber.textContent = gameState.secretNumber;
    
    if (timerRanOut) {
        elements.loseTitle.textContent = "Time's Up! ⏰";
        elements.loseMessageTime.classList.remove('hidden');
    } else {
        elements.loseTitle.textContent = "Mission Failed 😢";
        elements.loseMessageTime.classList.add('hidden');
    }
    
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

init();
