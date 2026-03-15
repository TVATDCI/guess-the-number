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
    isGameOver: false
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
    playAgainLose: document.getElementById('play-again-lose')
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
}

function startGame(difficulty) {
    const config = DIFFICULTIES[difficulty];
    gameState = {
        secretNumber: Math.floor(Math.random() * (config.max - config.min + 1)) + config.min,
        difficulty: difficulty,
        guessesLeft: config.guesses === Infinity ? '∞' : config.guesses,
        guessesUsed: 0,
        isGameOver: false
    };

    elements.difficultyLabel.textContent = `Mission: ${config.emoji} ${config.label} (${config.min}-${config.max})`;
    elements.guessesLeftEl.textContent = config.guesses === Infinity ? '⭐ ∞' : `⭐ ${gameState.guessesLeft}`;
    elements.message.textContent = MESSAGES.start;
    elements.message.className = 'message';
    elements.guessInput.value = '';
    elements.guessInput.min = config.min;
    elements.guessInput.max = config.max;
    elements.guessList.innerHTML = '';

    showScreen('game');
    elements.guessInput.focus();
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

function winGame() {
    gameState.isGameOver = true;
    showMessage(MESSAGES.correct, 'correct');
    bounceAstronaut();
    
    elements.finalGuesses.textContent = gameState.guessesUsed;
    
    setTimeout(() => {
        showScreen('win');
        createConfetti();
    }, 800);
}

function loseGame() {
    gameState.isGameOver = true;
    elements.secretNumber.textContent = gameState.secretNumber;
    showScreen('lose');
}

function resetGame() {
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

init();
