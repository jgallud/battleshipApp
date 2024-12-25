// Server (Node.js with Socket.IO)
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

// Serve static files
app.use(express.static('public'));

// Keep track of connected players
const players = {};
let turnOrder = [];

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Add player to the game
    players[socket.id] = { board: null, ships: [], ready: false, turn: false };
    turnOrder.push(socket.id);

    // Handle ship placement
    // Handle ship placement
    socket.on('placeShips', (ships) => {
        players[socket.id].ships = ships;
        players[socket.id].board = Array(10).fill(null).map(() => Array(10).fill(0));

        // Place ships on the board
        ships.forEach(({ row, col, size, direction }) => {
            for (let i = 0; i < size; i++) {
                if (direction === 'horizontal') {
                    players[socket.id].board[row][col + i] = 1;
                } else {
                    players[socket.id].board[row + i][col] = 1;
                }
            }
        });
        players[socket.id].ready = true;
        console.log(`Player ready: ${socket.id}`);
        //socket.emit('shipsPlaced', players[socket.id].ships);

        // Check if both players are ready
        if (Object.values(players).filter(p => p.ready).length === 2) {
            // Assign turn to the first player in turnOrder
            players[turnOrder[0]].turn = true;

            // Notify players the game is starting
            io.to(turnOrder[0]).emit('yourTurn',{ message: "Your turn!" });
            io.to(turnOrder[1]).emit('opponentTurn',{ message: "Waiting for opponent..." });
            io.emit('startGame', { firstTurn: turnOrder[0], turnOrder: turnOrder });
        }
    });

    // Handle player attack
    socket.on('attack', ({ row, col }) => {
        const currentPlayer = players[socket.id];
        if (!currentPlayer.turn) {
            socket.emit('notYourTurn', { message: "It's not your turn!" });
            return;
        }

        const opponentId = turnOrder.find(id => id !== socket.id);
        const targetPlayer = players[opponentId];

        if (!targetPlayer) {
            socket.emit('error', { message: "Opponent not found!" });
            return;
        }

        // Process the attack
        if (targetPlayer.board[row][col] === 1) {
            targetPlayer.board[row][col] = 'hit';
            io.to(opponentId).emit('hit', { row, col });
            socket.emit('hitSuccess', { row, col });

            // Check if the opponent has lost
            const shipsRemaining = targetPlayer.board.flat().filter(cell => cell === 1).length;
            if (shipsRemaining === 0) {
                io.emit('gameOver', { winner: socket.id });
                return;
            }
        } else if (targetPlayer.board[row][col] === 0) {
            targetPlayer.board[row][col] = 'miss';
            io.to(opponentId).emit('miss', { row, col });
            socket.emit('missed', { row, col });
        } else {
            // Cell already attacked
            socket.emit('invalidAttack', { message: "This cell has already been attacked!" });
            return;
        }

        // Switch turns
        currentPlayer.turn = false;
        targetPlayer.turn = true;

        // Notify players of the turn switch
        socket.emit('opponentTurn', { message: "Turn ended. Waiting for opponent..." });
        io.to(opponentId).emit('yourTurn', { message: "Your turn!" });
    });



    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        delete players[socket.id];
        turnOrder = turnOrder.filter(id => id !== socket.id);
        io.emit('playerDisconnected', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
