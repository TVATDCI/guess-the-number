# Guess the Number 🚀

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

| Level        | Range      | Guesses   |
| ------------ | ---------- | --------- |
| 🌙 Easy      | 1-10       | Unlimited |
| 🪐 Medium    | 1-50       | 10        |
| 🌟 Hard      | 1-100      | 7         |
| ➕ Mult Easy | 1-6 × 1-6  | Unlimited |
| ✖️ Mult Hard | 1-10 × 1-10| 10        |

### How to Play

1. Choose a difficulty level
2. Guess the secret number
3. Get hints if too high (📉) or too low (📈)
4. Win and celebrate with confetti! 🎉

### New Features (Phase 1 & 2)

- ⏱️ **Timer Mode** - 60 second speed challenge (toggle in settings)
- 🏆 **High Score** - Best record saved locally
- 🔥 **Win Streak** - Track consecutive wins
- 🔊 **Sound Effects** - Celebration tones on win
- 💃 **Character Dance** - Character dances on victory
- 🦕 **Dinosaur Theme** - Switch between Space and Dinosaur themes
- 🧮 **Multiplication Mode** - Math challenges (separate game mode)
- 🌡️ **Thermometer** - Visual feedback showing how close your guess is

---

## Development Ideas for Future - Ask you child 😸

I am sure they will have a better idea for the development!

Here are some ideas from my 7 year old boss, which we will soon work on together:

### Completed ✅

- [x] Add animal sounds when winning
- [x] Change the theme (ocean, dinosaurs, superheroes) - yes for dinosaurs
- [x] Make the astronaut dance on win - yes
- [x] Add a timer for speed challenges
- [x] Create a high score board (localStorage)
- [x] Multiplication challenges (guess the product) - yes

### Easy Improvements (Beginner)

- [ ] Add difficulty icons to guess history
- [ ] Visual feedback animations for wrong guesses

### Medium Improvements (Intermediate)

- [ ] Add multiple secret numbers to guess
- [ ] Daily challenge mode

### Hard Improvements (Advanced)

- [ ] Two-player mode (take turns guessing)
- [ ] Add animated backgrounds per difficulty
- [ ] Mobile app version
- [ ] Unlockable themes (rewards for playing)

---

## Project Structure

```text
guess-the-number/
├── main.js          # Console version (Node.js)
├── index.html       # Web version
├── style.css        # Space theme styling
├── game.js          # Browser game logic
├── README.md        # This file
└── assets/          # Screenshots
```

## Credits

Built with ❤️ for learning and fun with my son!
