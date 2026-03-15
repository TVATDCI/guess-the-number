import readline from "readline-sync";

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getValidGuess() {
    while (true) {
        const input = readline.question("Enter your guess: ");
        const guess = parseInt(input);
        
        if (isNaN(guess)) {
            console.log("Please enter a valid number.");
            continue;
        }
        return guess;
    }
}

function guessingGame() {
    const randomNumber = getRandomNumber(1, 100);
    const maxGuesses = 10;
    let guessesLeft = maxGuesses;

    console.clear();
    console.log("Welcome to the guessing game!");
    console.log("Try to guess a number between 1 and 100...");
    console.log(`You have ${guessesLeft} guesses to get it right!`);

    while (guessesLeft > 0) {
        const guess = getValidGuess();

        if (guess === randomNumber) {
            console.log(`Congratulations! You got it right in ${maxGuesses - guessesLeft + 1} guesses!`);
            return true;
        } else if (guess > randomNumber) {
            console.log("Too high! Try again.");
        } else {
            console.log("Too low! Try again.");
        }

        guessesLeft--;
        console.log(`You have ${guessesLeft} guesses left.`);
    }

    console.log(`Sorry, you're out of guesses! The number was ${randomNumber}.`);
    return false;
}

function main() {
    let playAgain = true;

    while (playAgain) {
        const won = guessingGame();
        
        if (!won) {
            console.log("Game over! Better luck next time.");
            break;
        }

        const answer = readline.question("Do you want to play again? (yes/no): ");
        playAgain = answer.toLowerCase() === "yes";
        
        if (playAgain) {
            console.clear();
        }
    }

    console.log("Thanks for playing!");
}

main();
