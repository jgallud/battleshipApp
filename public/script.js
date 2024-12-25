const socket = io();
const myBoard = document.getElementById('myBoard');
const opponentBoard = document.getElementById('opponentBoard');
const placeShipsButton = document.getElementById('placeShipsButton');
const statusMessage = document.getElementById('statusMessage');

let myGrid = Array(10).fill(null).map(() => Array(10).fill(0));
let ships = [];
let opponentId = null;
let myTurn = false;

// Create the board
function createBoard(boardElement, isOpponent) {
    boardElement.innerHTML = '';
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = i;
            cell.dataset.col = j;
            if (isOpponent) {
                cell.addEventListener('click', () => attackCell(i, j));
            } else {
                cell.addEventListener('click', () => placeShipPart(i, j));
            }
            boardElement.appendChild(cell);
        }
    }
}

// Place a ship part on the board
function placeShipPart(row, col) {
    const cell = myBoard.children[row * 10 + col];
    if (myGrid[row][col] === 0) {
        myGrid[row][col] = 1;
        cell.classList.add('ship');
    } else if (myGrid[row][col] === 1) {
        myGrid[row][col] = 0;
        cell.classList.remove('ship');
    }
}

// Attack a cell on the opponent's board
function attackCell(row, col) {
    
    if (!myTurn || opponentId === null) {
        statusMessage.textContent = "It's not your turn!";
        return;
    }
    console.log("Attacking", row, col);
    socket.emit('attack', { row, col });
}

// Handle "Place Ships" button click
placeShipsButton.addEventListener('click', () => {
    const shipsToPlace = [];
    const shipCells = myBoard.querySelectorAll('.cell.ship');
    shipCells.forEach(cell => {
        shipsToPlace.push({
            row: parseInt(cell.dataset.row),
            col: parseInt(cell.dataset.col),
            size: 1,
            direction: 'horizontal'
        });
    });
    socket.emit('placeShips', shipsToPlace);
    statusMessage.textContent = 'Ships placed! Waiting for opponent...';
});

socket.on('shipsPlaced', (ships) => {
    // Redraw my board and place the ships
    createBoard(myBoard, false);
    ships.forEach(ship => {
        for (let i = 0; i < ship.size; i++) {
            let row = ship.row;
            let col = ship.col;
            if (ship.direction === 'horizontal') {
                col += i;
            } else {
                row += i;
            }
            if (row < 10 && col < 10) {
                const cell = myBoard.children[row * 10 + col];
                cell.classList.add('ship');
            }
        }
    });
});

socket.on("connect",()=>{
    console.log(`connected: ${socket.id}`);
});

socket.on('startGame', ({ firstTurn, turnOrder }) => {
    opponentId = turnOrder.find(id => id !== socket.id);
    console.log(`First turn: ${firstTurn}`);
    console.log('Turn order:', turnOrder);
    myTurn = firstTurn === socket.id;
    statusMessage.textContent = myTurn ? 'Your turn!' : 'Opponent\'s turn';
});

// Update status messages
function updateStatus(message) {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = message;
}

// Handle attack response
socket.on('hit', ({ row, col }) => {
    updateStatus("Your ship was hit!");
    const cell = myBoard.children[row * 10 + col];
    cell.classList.add('hit');
});

socket.on('miss', ({ row, col }) => {
    updateStatus("Opponent missed!");
    const cell = myBoard.children[row * 10 + col];
    cell.classList.add('miss');
});

socket.on('hitSuccess', ({ row, col }) => {
    updateStatus("You hit a ship!");
    const cell = opponentBoard.children[row * 10 + col];
    cell.classList.add('hit');
});

socket.on('missed', ({ row, col }) => {
    updateStatus("You missed!");
    const cell = opponentBoard.children[row * 10 + col];
    cell.classList.add('miss');
});

socket.on('yourTurn', ({ message }) => {
    myTurn = true;
    updateStatus(message || "Your turn!");
});

socket.on('opponentTurn', ({ message }) => {
    myTurn = false;
    updateStatus(message || "Waiting for opponent...");
});

socket.on('notYourTurn', ({ message }) => {
    updateStatus(message || "It's not your turn!");
});

socket.on('gameOver', ({ winner }) => {
    const message = winner === socket.id ? "You win!" : "You lose!";
    updateStatus(message);
    alert(message);
});

// Initialize the boards
createBoard(myBoard,false);
createBoard(opponentBoard, true);
