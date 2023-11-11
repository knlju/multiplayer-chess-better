// server/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const {Chess} = require('chess.js');
const {v4: uuidv4} = require('uuid');
const cors = require('cors');

const app = express();
app.use(cors('*'));

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let waitingForRematch = {}; // Store rematch requests
const games = new Map(); // Stores game state by game ID

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('newGame', () => {
    const gameId = uuidv4();
    const chess = new Chess();
    games.set(gameId, {chess, players: {white: socket.id, black: null}, timers: {white: 180, black: 180}});

    socket.join(gameId);
    socket.emit('gameCreated', gameId, 'white');
  });

  socket.on('joinGame', (gameId) => {
    const game = games.get(gameId);
    if (game && !game.players.black) {
      game.players.black = socket.id;
      socket.join(gameId);
      socket.emit('gameJoined', gameId, 'black');
      io.to(gameId).emit('startGame', gameId);
    } else {
      socket.emit('joinError', 'Game not found or already full');
    }
  });

  socket.on('makeMove', ({gameId, move}) => {
    console.log('Move:', move)
    console.log('Game ID:', gameId)
    const game = games.get(gameId);
    if (game) {
      const chess = game.chess;
      const result = chess.move(move);
      if (result) {
        const currentPlayer = game.chess.turn() === 'w' ? 'black' : 'white';
        const now = Date.now();
        if (!game.lastMoveTime) {
          game.lastMoveTime = now;
        }
        const timeSpent = (now - game.lastMoveTime) / 1000;
        console.log(game)
        console.log(game.timers[currentPlayer])
        game.timers[currentPlayer] -= timeSpent;
        game.lastMoveTime = now;

        if (game.chess.game_over()) {
          const result = getGameResult(game.chess);
          console.log('Game over:', result)
          io.to(gameId).emit('gameEnded', result);
        }
        io.to(gameId).emit('gameState', chess.fen(), game.timers);
      } else {
        socket.emit('invalidMove', chess.fen());
      }
    }
  });

  socket.on('rematchRequest', (gameId) => {
    // Notify the other player in the game
    socket.to(gameId).emit('rematchOffered');
  });

  socket.on('rematchRequest', (gameId) => {
    // Store the request and notify the opponent
    waitingForRematch[gameId] = socket.id;
    socket.to(gameId).emit('rematchOffered', gameId);
  });

  socket.on('acceptRematch', (gameId) => {
    // Check if the other player has requested a rematch
    if (waitingForRematch[gameId]) {
      // Start a new game with reversed colors
      startNewGameWithReversedColors(gameId);
      delete waitingForRematch[gameId];
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

function startNewGameWithReversedColors(oldGameId) {
  const oldGame = games.get(oldGameId);
  if (!oldGame) {
    console.error('Old game not found');
    return;
  }

  // Reverse player colors for the new game
  const newGameId = uuidv4();
  const newChessInstance = new Chess();
  const newPlayerColors = {
    white: oldGame.players.black,
    black: oldGame.players.white
  };

  // Store the new game
  games.set(newGameId, {chess: newChessInstance, players: newPlayerColors, timers: {white: 180, black: 180}});

  // Notify both players to start a new game
  io.to(newPlayerColors.white).emit('startNewGame', newGameId, 'white');
  io.to(newPlayerColors.black).emit('startNewGame', newGameId, 'black');

  // Make sure the players join the new game room
  io.sockets.sockets.get(newPlayerColors.white)?.join(newGameId);
  io.sockets.sockets.get(newPlayerColors.black)?.join(newGameId);

  // Leave the old game room
  io.sockets.sockets.get(newPlayerColors.white)?.leave(oldGameId);
  io.sockets.sockets.get(newPlayerColors.black)?.leave(oldGameId);

  // Optionally, you can delete the old game from the games map if it's no longer needed
  games.delete(oldGameId);
}

function getGameResult(game) {
  if (game.in_checkmate()) {
    return game.turn() === 'w' ? 'Black wins by checkmate' : 'White wins by checkmate';
  } else if (game.in_draw() || game.in_stalemate() || game.in_threefold_repetition() || game.insufficient_material()) {
    return 'Draw';
  }
  return 'Unknown result';
}

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
