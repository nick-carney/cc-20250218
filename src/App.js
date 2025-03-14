/** @jsxImportSource react */
import React, { useState, useEffect, lazy, Suspense } from "react";
import drinksData from "./drinks.json"; // You can manually edit this JSON
import "./styles.css"; // Background image/video section is commented in CSS

export default function App() {
  const [selectedDrink, setSelectedDrink] = useState(
    JSON.parse(localStorage.getItem("selectedDrink")) || null
  );
  const [bingoBoard, setBingoBoard] = useState(
    JSON.parse(localStorage.getItem("bingoBoard")) || []
  );
  const [gameWon, setGameWon] = useState(
    JSON.parse(localStorage.getItem("gameWon")) || false
  );
  const [showStars, setShowStars] = useState(false);
  const [revealedDrinks, setRevealedDrinks] = useState(
    new Set(JSON.parse(localStorage.getItem("revealedDrinks")) || [])
  );

  const [darkMode, setDarkMode] = useState(
    JSON.parse(localStorage.getItem("darkMode")) || false
  );

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prevMode) => !prevMode);
  };

  // Function to show stars when user wins

  useEffect(() => {
    if (gameWon) {
      setShowStars(true);
      setTimeout(() => setShowStars(false), 5000);
    }
  }, [gameWon]);

  // Background movement on mobile phone

  useEffect(() => {
    const handleTilt = (event) => {
      const x = event.gamma; // Left to right tilt
      const y = event.beta; // Front to back tilt

      const moveX = Math.min(Math.max(x, -30), 30) * 1.5; // Restrict movement range
      const moveY = Math.min(Math.max(y, -30), 30) * 1.5;

      document.body.style.backgroundPosition = `${50 + moveX}% ${50 + moveY}%`;
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", handleTilt);
    }

    return () => {
      window.removeEventListener("deviceorientation", handleTilt);
    };
  }, []);

  // Function to populate storage on device with local files

  useEffect(() => {
    localStorage.setItem("bingoBoard", JSON.stringify(bingoBoard));
    localStorage.setItem("gameWon", JSON.stringify(gameWon));
    localStorage.setItem("revealedDrinks", JSON.stringify([...revealedDrinks]));
    localStorage.setItem("selectedDrink", JSON.stringify(selectedDrink));
  }, [bingoBoard, gameWon, revealedDrinks, selectedDrink]);

  // Begin game and add 24 random drinks to local storage

  const startGame = () => {
    let shuffledDrinks = [...drinksData]
      .sort(() => Math.random() - 0.5)
      .slice(0, 24);

    // Error if not enough drinks in database

    if (shuffledDrinks.length < 24) {
      alert("Not enough drinks in the database! Add more to drinks.json.");
      return;
    }

    // Map the board with shuffled drinks, add free space in center

    let board = shuffledDrinks.map((drink) => ({
      name: drink.name,
      category: drink.category,
      recipe: drink.recipe,
      isSelected: false,
      isBonus: false,
      isRevealed: false,
      isShot: false,
      isWinning: false,
    }));
    board.splice(12, 0, {
      name: "FREE",
      isSelected: true,
      isBonus: false,
      isRevealed: true,
      isShot: false,
      isWinning: false,
    });

    setBingoBoard(board);
    setRevealedDrinks(new Set());
    setGameWon(false);
    setSelectedDrink(null);
    nextDrink(board);
  };

  // Restart function

  const resetGame = () => {
    localStorage.clear();
    setBingoBoard([]);
    setGameWon(false);
    setSelectedDrink(null);
  };

  // Shot function, includes randomizing location

  const addShotSquare = () => {
    let availableIndexes = bingoBoard
      .map((cell, index) =>
        !cell.isSelected && !cell.isShot && !cell.isBonus ? index : null
      )
      .filter((index) => index !== null);

    if (availableIndexes.length === 0) return;

    let randomIndex =
      availableIndexes[Math.floor(Math.random() * availableIndexes.length)];

    let newBoard = [...bingoBoard];
    newBoard[randomIndex] = {
      name: "SHOT!",
      isSelected: true,
      isBonus: false,
      isRevealed: true,
      isShot: true,
    };

    setBingoBoard(newBoard);
    if (checkForWin(newBoard)) {
      setGameWon(true);
      setShowStars(true);
    }
  };

  // Add Next Drink button and win condition check

  const nextDrink = (board) => {
    if (gameWon) return;

    let hiddenDrinks = board.filter(
      (cell) => !cell.isRevealed && cell.name !== "FREE" && !cell.isBonus
    );
    if (hiddenDrinks.length === 0) return;

    let newDrink =
      hiddenDrinks[Math.floor(Math.random() * hiddenDrinks.length)];
    setSelectedDrink(newDrink);
    let newBoard = board.map((cell, index) => {
      if (cell.name === newDrink.name) {
        cell.isRevealed = true;
        cell.isSelected = true;

        // Mezcal/Tequila Condition

        if (cell.category === "Mezcal/Tequila") {
          let bonusIndexes = [
            index - 1,
            index + 1,
            index - 5,
            index + 5,
          ].filter(
            (i) =>
              board[i] &&
              board[i].name !== "FREE" &&
              !board[i].isBonus &&
              !board[i].isRevealed
          );
          if (bonusIndexes.length) {
            board[bonusIndexes[0]].isBonus = true;
          }
        }

        // Long Island Iced Tea Condition

        if (cell.name === "Long Island Iced Tea") {
          let adjacentIndexes = [
            index - 1,
            index + 1,
            index - 5,
            index + 5,
          ].filter(
            (i) =>
              board[i] &&
              board[i].name !== "FREE" &&
              !board[i].isBonus &&
              !board[i].isRevealed
          );
          adjacentIndexes.forEach((i) => (board[i].isBonus = true));
          cell.isBonus = true;
        }
      }
      return cell;
    });

    setBingoBoard(newBoard);
    if (checkForWin(newBoard)) {
      setGameWon(true);
      setShowStars(true);
    }
  };

  // Winning combo possibilities, add stars if win

  const checkForWin = (board) => {
    const winningCombos = [
      [0, 1, 2, 3, 4],
      [5, 6, 7, 8, 9],
      [10, 11, 12, 13, 14],
      [15, 16, 17, 18, 19],
      [20, 21, 22, 23, 24],
      [0, 5, 10, 15, 20],
      [1, 6, 11, 16, 21],
      [2, 7, 12, 17, 22],
      [3, 8, 13, 18, 23],
      [4, 9, 14, 19, 24],
      [0, 6, 12, 18, 24],
      [4, 8, 12, 16, 20],
    ];

    for (let combo of winningCombos) {
      if (
        combo.every(
          (i) =>
            board[i] &&
            (board[i].isSelected || board[i].isBonus || board[i].isShot)
        )
      ) {
        setBingoBoard((prevBoard) =>
          prevBoard.map((cell, index) =>
            combo.includes(index)
              ? {
                  ...cell,
                  isWinning: true,
                  name: cell.isBonus ? "" : cell.name,
                }
              : cell
          )
        );

        return true;
      }
    }
    return false;
  };

  return (
    <div className="container">
      {showStars && (
        <div className="stars-container">
          {[...Array(20)].map((_, i) => (
            <span key={i} className="star">
              ✨
            </span>
          ))}
        </div>
      )}
      {!selectedDrink ? (
        <div>
          <h5>Nick & Nick Present</h5>
          <h6>Drink-O BINGO!</h6>
          <button className="start-btn" onClick={startGame}>
            Start Game
          </button>
        </div>
      ) : (
        <div>
          <h2>Drink Selected</h2>
          <div className="drink-name-wrapper">
            <h1>{selectedDrink.name}</h1>
          </div>
          {selectedDrink.recipe && (
            <h3>
              <a
                href={selectedDrink.recipe}
                target="_blank"
                rel="noopener noreferrer"
              >
                Recipe{" "}
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 3h7v7" />
                  <path d="M10 14L21 3" />
                  <path d="M21 10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10" />
                </svg>
              </a>
            </h3>
          )}
          <div className="button-container">
            <button
              className="next-btn"
              onClick={() => nextDrink(bingoBoard)}
              disabled={gameWon}
            >
              Next Drink
            </button>
            <button
              className="shot-btn"
              onClick={addShotSquare}
              disabled={gameWon}
            >
              SHOT!
            </button>
          </div>

          <div className="bingo-grid">
            {bingoBoard.map((cell, index) => (
              <div
                key={index}
                className={`bingo-cell ${
                  cell.isWinning ? "winning strikethrough" : ""
                } ${!cell.isWinning && cell.isShot ? "shot wave-effect" : ""} ${
                  cell.isSelected ? "selected" : ""
                } ${cell.isBonus ? "bonus" : ""}`}
                style={{
                  visibility: "visible",
                  color: cell.isShot
                    ? "white"
                    : cell.isRevealed
                    ? "black"
                    : "transparent",
                }}
              >
                {cell.name}
              </div>
            ))}
          </div>
          {gameWon && <h2 className="winner">BINGO!</h2>}

          <button className="toggle-mode-btn" onClick={toggleDarkMode}>
            {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>

          <button className="reset-btn" onClick={resetGame}>
            New Game
          </button>
        </div>
      )}
    </div>
  );
}
