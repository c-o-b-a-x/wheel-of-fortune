let currentWord = "";
let displayWord = [];
let guessedLetters = [];
let lastSpinValue = null;
let isSpinning = false;
let roundScore = 0;

let currentPlayer = 0;
const playerScores = [0, 0, 0];

const colors = [
  "#00c7c7",
  "#ffe066",
  "#e63946",
  "#1d3557",
  "#00c7c7",
  "#ffe066",
  "#e63946",
  "#1d3557",
  "#00c7c7",
  "#ffe066",
  "#e63946",
  "#1d3557",
  "#00c7c7",
  "#ffe066",
  "#e63946",
  "#1d3557",
  "#00c7c7",
  "#ffe066",
  "#e63946",
  "#1d3557",
  "#00c7c7",
  "#ffe066",
  "#e63946",
  "#1d3557",
];
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const labels = [
  "$500",
  "$800",
  "$500",
  "$700",
  "$450",
  "$900",
  "$600",
  "BANKRUPT",
  "$800",
  "$500",
  "$300",
  "LOSE A TURN",
  "$350",
  "$700",
  "$550",
  "$400",
  "$250",
  "$900",
  "$600",
  "$500",
  "$700",
  "BANKRUPT",
  "$300",
  "$650",
];

let player_count = parseInt(prompt("how many people are playing:")) || 3;

const worddisplay = document.querySelector(".worddisplay");
const categoryDisplay = document.querySelector(".category");
const letterButtonsContainer = document.querySelector(".letter-buttons");
const solveButton = document.getElementById("solve");
const buyVowelButton = document.getElementById("buy-vowel");

if (!solveButton || !buyVowelButton) {
  console.error("Missing solve or buy-vowel buttons in HTML");
}

const wheel = document.getElementById("wheel");
const wheel_container = document.querySelector(".wheel-container");
const spin = document.getElementById("spin");

const cx = 360;
const cy = 360;
const r = 354;
const sliceCount = 24;
const anglePerSlice = 360 / sliceCount;

const vowels = ["A", "E", "I", "O", "U"];

for (let i = 0; i < sliceCount; i++) {
  const startAngle = ((i * anglePerSlice - 90) * Math.PI) / 180;
  const endAngle = (((i + 1) * anglePerSlice - 90) * Math.PI) / 180;

  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;

  path.setAttribute("d", d);
  path.setAttribute("fill", colors[i]);
  path.setAttribute("stroke", "#222");
  path.setAttribute("stroke-width", "2");

  wheel.appendChild(path);
}

const labelContainer = document.querySelector(".labels");
for (let i = 0; i < sliceCount; i++) {
  const angle = i * anglePerSlice + anglePerSlice / 2 - 90;
  const label = document.createElement("div");
  label.className = "label";
  label.textContent = labels[i];
  label.style.transform = `rotate(${angle}deg) translate(220px, 0)`;
  labelContainer.appendChild(label);
}

spin.addEventListener("click", () => {
  if (isSpinning) return;

  isSpinning = true;
  spin.disabled = true;
  if (buyVowelButton) buyVowelButton.disabled = true;
  if (solveButton) solveButton.disabled = true;

  const spinAmount = 360 * 5 + Math.random() * 360;

  wheel_container.style.transition = "transform 3s ease-out";
  wheel_container.style.transform = `rotate(${spinAmount}deg)`;

  setTimeout(() => {
    const result = getLandedSegment(spinAmount, labels);
    lastSpinValue = result;
    isSpinning = false;

    if (result === "BANKRUPT") {
      roundScore = 0;
      alert("BANKRUPT! You lose all money from this round.");
      nextPlayer();
    } else if (result === "LOSE A TURN") {
      alert("You lost your turn!");
      nextPlayer();
    } else {
      alert("You landed on: " + result);
      enableConsonantButtons();
    }
  }, 3000);

  setTimeout(() => {
    wheel_container.style.transition = "none";
    wheel_container.style.transform = "rotate(0deg)";
    wheel_container.offsetHeight;
  }, 3500);
});

if (buyVowelButton) {
  buyVowelButton.addEventListener("click", () => {
    if (roundScore < 250) {
      alert("You need at least $250 in round winnings to buy a vowel!");
      return;
    }

    roundScore -= 250;
    updateScoreboard();
    enableVowelButtons();
    spin.disabled = true;
    if (solveButton) solveButton.disabled = true;
  });
}

if (solveButton) {
  solveButton.addEventListener("click", () => {
    const answer = prompt("Solve the puzzle:");
    if (!answer) return;

    if (answer.toUpperCase() === currentWord) {
      // FIX: Add round score to player's total here
      playerScores[currentPlayer] += roundScore;
      alert(
        `🎉 Correct! Player ${
          currentPlayer + 1
        } wins ${roundScore}!\nWord: ${currentWord}`
      );
      startGame();
    } else {
      alert("Wrong answer!");
      // FIX: Don't add score when wrong, just reset and move to next player
      roundScore = 0;
      nextPlayer();
    }
  });
}

function getLandedSegment(rotation, values) {
  let finalRotation = rotation % 360;
  const adjusted = (360 - finalRotation) % 360;
  const index = Math.floor(adjusted / anglePerSlice) % sliceCount;
  return values[index];
}

function startGame() {
  guessedLetters = [];
  currentWord = "";
  displayWord = [];
  lastSpinValue = null;

  currentPlayer = 0;
  playerScores.fill(0);
  create_player_ui(player_count);
  updateScoreboard();
  disableAllButtons();
  spin.disabled = false;
  if (buyVowelButton) buyVowelButton.disabled = false;
  if (solveButton) solveButton.disabled = false;

  fetch("words.json")
    .then((res) => res.json())
    .then((data) => {
      const categoryNames = Object.keys(data);
      const catIndex = Math.floor(Math.random() * categoryNames.length);
      const selectedCategory = categoryNames[catIndex];
      const words = data[selectedCategory];
      const wordIndex = Math.floor(Math.random() * words.length);
      currentWord = words[wordIndex].toUpperCase();

      displayWord = currentWord
        .split(" ")
        .map((word) => word.split("").map((ch) => "_"));

      categoryDisplay.textContent =
        "CATEGORY: " + selectedCategory.toUpperCase();
      updateWordDisplay();
      generateLetterButtons();
    })
    .catch((error) => {
      console.error("Error loading words:", error);
      alert("Error loading game data. Please check that words.json exists.");
    });
}

function updateWordDisplay() {
  worddisplay.textContent = displayWord
    .map((wordArr) => wordArr.join(""))
    .join("     "); // space between words
}
function updateScoreboard() {
  const playersUI = document.querySelectorAll(".player");

  playersUI.forEach((playerDiv, i) => {
    const baseScore = playerScores[i] || 0;
    const displayScore =
      i === currentPlayer ? baseScore + roundScore : baseScore;

    playerDiv.querySelector(".score").textContent = `$${displayScore}`;

    playerDiv.classList.toggle("active", i === currentPlayer);
  });
}

function generateLetterButtons() {
  letterButtonsContainer.innerHTML = "";
  letters.forEach((ltr) => {
    const btn = document.createElement("button");
    btn.textContent = ltr;
    btn.className = "guess-btn";
    btn.disabled = true;

    btn.addEventListener("click", () => handleGuessPress(ltr, btn));
    letterButtonsContainer.appendChild(btn);
  });
}

function enableConsonantButtons() {
  const buttons = letterButtonsContainer.querySelectorAll(".guess-btn");
  buttons.forEach((btn) => {
    const letter = btn.textContent;
    if (!vowels.includes(letter) && !guessedLetters.includes(letter)) {
      btn.disabled = false;
    }
  });
}

function enableVowelButtons() {
  const buttons = letterButtonsContainer.querySelectorAll(".guess-btn");
  buttons.forEach((btn) => {
    const letter = btn.textContent;
    if (vowels.includes(letter) && !guessedLetters.includes(letter)) {
      btn.disabled = false;
    }
  });
}

function disableAllButtons() {
  const buttons = letterButtonsContainer.querySelectorAll(".guess-btn");
  buttons.forEach((btn) => {
    btn.disabled = true;
  });
}

function handleGuessPress(letter, button) {
  button.disabled = true;
  guessLetter(letter);
}

function guessLetter(letter) {
  if (guessedLetters.includes(letter)) return;

  guessedLetters.push(letter);

  let found = false;
  let count = 0;

  displayWord.forEach((wordArr, wIndex) => {
    wordArr.forEach((ch, lIndex) => {
      if (currentWord.split(" ")[wIndex][lIndex] === letter) {
        displayWord[wIndex][lIndex] = letter;
        found = true;
        count++;
      }
    });
  });

  if (found) {
    if (!vowels.includes(letter)) {
      const value = parseInt(lastSpinValue.replace("$", "")) || 0;
      roundScore += value * count;
    }
    updateWordDisplay();
    updateScoreboard();
    checkWin();

    disableAllButtons();
    spin.disabled = false;
    if (buyVowelButton) buyVowelButton.disabled = roundScore < 250;
    if (solveButton) solveButton.disabled = false;
  } else {
    alert("Sorry, no " + letter);
    nextPlayer();
  }
}

function nextPlayer() {
  roundScore = 0;

  currentPlayer = (currentPlayer + 1) % player_count;
  lastSpinValue = null;

  disableAllButtons();
  spin.disabled = false;
  buyVowelButton.disabled = false;
  solveButton.disabled = false;

  updateScoreboard();
}

function checkWin() {
  const won = displayWord.every((wordArr) => wordArr.every((ch) => ch !== "_"));

  if (won) {
    playerScores[currentPlayer] += roundScore;

    alert(
      `🎉 Player ${currentPlayer + 1} wins the round!\n` +
        `Word: ${currentWord}\n` +
        `Round earnings: $${roundScore}`
    );

    startGame();
  }
}

function create_player_ui(player_count) {
  const scoreboard = document.querySelector(".scoreboard");
  scoreboard.innerHTML = "";

  for (let i = 0; i < player_count; i++) {
    const playerDiv = document.createElement("div");
    playerDiv.className = "player";
    playerDiv.id = `player${i + 1}`;
    playerDiv.innerHTML = `Player ${i + 1}: <span class="score">$0</span>`;
    scoreboard.appendChild(playerDiv);
  }

  playerScores.length = player_count;
  playerScores.fill(0);
}

startGame();

// ===== THEME MUSIC TOGGLE =====
const themeAudio = document.getElementById("theme-audio");
const musicToggle = document.getElementById("music-toggle");

let musicPlaying = false;

musicToggle.addEventListener("click", () => {
  if (!musicPlaying) {
    themeAudio.volume = 0.5;
    themeAudio.play();
    musicToggle.textContent = "🔈";
    musicToggle.classList.remove("muted");
  } else {
    themeAudio.pause();
    musicToggle.textContent = "🔊";
    musicToggle.classList.add("muted");
  }

  musicPlaying = !musicPlaying;
});
