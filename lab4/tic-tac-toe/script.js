const gameBoard = document.getElementById('gameBoard');
const scoreX = document.getElementById('scoreX');
const scoreO = document.getElementById('scoreO');
const restartBtn = document.getElementById('restartBtn');
const winnerMessage = document.getElementById('winnerMessage');

let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let score = { X: 0, O: 0 };

function createBoard() {
    gameBoard.innerHTML = '';
    board.forEach((cell, index) => {
        const cellDiv = document.createElement('div');
        cellDiv.classList.add('cell');
        cellDiv.setAttribute('data-index', index);
        cellDiv.innerText = cell;

        cellDiv.addEventListener('click', () => handleCellClick(index));
        gameBoard.appendChild(cellDiv);
    });
    
    winnerMessage.innerText = ''; 
}

function handleCellClick(index) {
    if (board[index] !== '' || checkWinner()) return;

    board[index] = currentPlayer;

    const winnerCombination = checkWinner();
    
    if (winnerCombination) {
        highlightWinningCells(winnerCombination);
        winnerMessage.innerText = `Игрок ${currentPlayer} выиграл!`;
        score[currentPlayer]++;
        updateScore();
        return;
    }

    if (board.every(cell => cell !== '')) {
        winnerMessage.innerText = 'Ничья!';
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    
    createBoard();
}

function checkWinner() {
    const winningCombinations = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    for (const combination of winningCombinations) {
        const [a, b, c] = combination;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return combination;
        }
    }
    
    return null; 
}

function highlightWinningCells(combination) {
    combination.forEach(index => {
        const cellDiv = gameBoard.children[index];
        cellDiv.style.backgroundColor = 'lightgreen'; 
        cellDiv.innerText = board[index];
    });
}

function updateScore() {
    scoreX.innerText = `Игрок X: ${score.X}`;
    scoreO.innerText = `Игрок O: ${score.O}`;
}

restartBtn.addEventListener('click', () => {
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    
    createBoard();
});

createBoard();
