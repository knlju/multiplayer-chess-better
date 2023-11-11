import {useEffect, useState} from 'react';
import io from 'socket.io-client';
import Chess from 'chess.js';

const socket = io('http://localhost:4000');

const useChessGameSocket = (game, setGame, setGameId, playerColor, setPlayerColor, gameId, setTimers) => {

  const [gameResult, setGameResult] = useState(null);

  useEffect(() => {
    socket.on('connect', () => console.log('connected'));
    socket.on('gameCreated', (id, color) => {
      setGameId(id);
      setPlayerColor(color);
    });
    socket.on('gameJoined', (id, color) => {
      setGameId(id);
      setPlayerColor(color);
    });
    socket.on('startGame', (id) => {
      if (id === gameId) {
        // Start the game logic (if any)
      }
    });
    socket.on('gameState', (fen, newTimers) => {
      console.log('Game state:', fen)
      setGame((prevGame) => {
        const gameCopy = new Chess(fen);
        return gameCopy;
      });
      setTimers(newTimers);
    });
    socket.on('invalidMove', (resetBoard) => {
      // Handle invalid move logic
    });
    socket.on('gameEnded', (result) => {
      setGameResult(result);
    });


    return () => {
      socket.off('connect');
      socket.off('gameCreated');
      socket.off('gameJoined');
      socket.off('startGame');
      socket.off('gameState');
      socket.off('invalidMove');
      socket.off('gameEnded');
    };
  }, [setGame, setGameId, setPlayerColor, gameId]);

  const makeMove = (sourceSquare, targetSquare) => {
    if ((game.turn() === 'w' && playerColor !== 'white') || (game.turn() === 'b' && playerColor !== 'black')) {
      return; // Not the player's turn
    }

    setGame((prevGame) => {
      const move = prevGame.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
      if (move) {
        socket.emit('makeMove', { gameId, move });
        return { ...prevGame };
      }
      return prevGame;
    });
  };

  const closeModal = () => {
    setGameResult(null);
  }

  return {socket, makeMove, gameResult, closeModal};
};

export default useChessGameSocket;
