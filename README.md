# Guess the Number

A fun space-themed number guessing for kids. Built with vanilla HTML/CSS/JS and love for children!

## Console Version (Node.js)

```bash
node main.js
```

### Web Version (Browser)

Open `index.html` in any web browser, or run:

```bash
npx serve
```

## Game Features

### Difficulty Levels

| Level        | Range       | Guesses   |
| ------------ | ----------- | --------- |
| 🌙 Easy      | 1-10        | Unlimited |
| 🪐 Medium    | 1-50        | 10        |
| 🌟 Hard      | 1-100       | 7         |
| ➕ Mult Easy | 1-10 × 1-10 | Unlimited |
| ✖️ Mult Hard | 1-20 × 1-10 | 10        |

### How to Play

1. Choose a difficulty level
2. Guess the secret number
3. Get hints if too high (📉) or too low (📈)
4. Win and celebrate with confetti! 🎉

### New Features (All Phases)

- ⏱️ **Timer Mode** - 60 second speed challenge (toggle in settings)
- 🏆 **High Score** - Best record saved locally
- 🔥 **Win Streak** - Track consecutive wins
- 🔊 **Sound Effects** - Celebration tones on win
- 💃 **Character Dance** - Character dances on victory
- 🦕🐙 **Themes** - Space, Dinosaur, and Ocean (unlockable!)
- 🧮 **Multiplication Mode** - Math challenges (separate game mode)
- 🌡️ **Thermometer** - Visual feedback showing how close your guess is
- 👥 **Two-Player Mode** - Take turns with a friend!
- 🎨 **Difficulty Backgrounds** - Different colors per difficulty level
- 🔄 **Reset Progress** - Optional reset in settings (clean state teardown)
- 📱 **Responsive Design** - Works on mobile, tablet, and desktop
- ⭐ **Level Up System** - Math difficulty increases after each win

---

## Development Ideas for Future - Ask you child 😸

I am sure they will have a better idea for the development!

Here are some ideas from my 7 year old boss, which we will soon work on together:

### Completed

- [x] Add animal sounds when winning
- [x] Change the theme (ocean, dinosaurs, superheroes)
- [x] Make the astronaut dance on win
- [x] Add a timer for speed challenges
- [x] Create a high score board (localStorage)
- [x] Multiplication challenges (guess the product)
- [x] Two-player mode (take turns guessing)
- [x] Add animated backgrounds per difficulty
- [x] Unlockable themes (rewards for playing)
- [x] Reset progress button (optional, in settings)
- [x] Level Up system for math mode (gradual difficulty increase)
- [x] Responsive settings button (fixed on desktop, inline on mobile)
- [x] Refactored core engine with 105+ automated tests
- [x] Pure game logic separated from DOM and storage
- [x] Injectable randomness (seeded + daily modes)
- [x] Graceful storage degradation (works in private browsing)

### Future Ideas

- [ ] Daily challenge mode (foundation ready!)
- [ ] Mobile app version
- [ ] Add difficulty icons to guess history
- [ ] Visual feedback animations for wrong guesses

---

## Project Structure

```text
guess-the-number/
├── index.html          # Web version entry
├── style.css           # Theme styling
├── main.js             # Console version (Node.js)
├── src/
│   ├── main.js         # Browser entry point
│   ├── engine.js       # Pure game logic (testable, no DOM)
│   ├── store.js        # State dispatcher/subscriber + persistence
│   ├── ui.js           # DOM adapter (zero game logic)
│   ├── random.js       # Randomness abstraction
│   └── storage.js      # localStorage wrapper
├── tests/
│   ├── engine.test.js  # Game logic tests
│   ├── store.test.js   # Store integration tests
│   ├── random.test.js  # Randomness tests
│   └── storage.test.js # Storage tests
├── package.json
└── assets/             # Screenshots
```

### Architecture

```
Browser Events → ui.js (actions) → store.js (dispatch)
                                          ↓
                                    engine.js (reducer)
                                          ↓
                                    storage.js (persist)
```

- **engine.js**: Pure functions only. No DOM, no storage, no side effects. All game rules unit-tested.
- **store.js**: Centralized mutable state. Actions dispatched, subscribers notified. Auto-persists to storage.
- **ui.js**: Thin DOM adapter. Reads DOM, dispatches actions, renders state. Zero game logic.
- **random.js**: Injectable randomness for deterministic tests and Daily Challenge mode.
- **storage.js**: localStorage wrapper with error handling, fallback, and schema versioning.

## Testing

```bash
npm test            # Run all tests
npm run test:watch  # Watch mode
npm run test:coverage # Coverage report
```

105+ tests covering all game modes, state transitions, storage, and randomness.

## Credits

Built with ❤️ for learning and fun with my son!
