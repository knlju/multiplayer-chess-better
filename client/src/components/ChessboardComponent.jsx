import React, {useState} from 'react';
import Chess from "chess.js";
import {Chessboard} from "react-chessboard";
import GameCreation from "./GameCreation";
import useChessGameSocket from "../hooks/useChessGameSocket";

import './ChessboardComponent.css';
import GameEndModal from "./GameEndModal";

export default function ChessboardComponent() {
  const [game, setGame] = useState(new Chess());
  const [gameId, setGameId] = useState(null);
  const [gameIdInput, setGameIdInput] = useState('');
  const [playerColor, setPlayerColor] = useState(null);
  const [rematchOffered, setRematchOffered] = useState(false);

  const [copySuccess, setCopySuccess] = useState('');

  const [timers, setTimers] = useState({white: 180, black: 180});

  const copyToClipboard = (e) => {
    navigator.clipboard.writeText(gameId)
      .then(() => {
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(''), 2000); // Hide message after 2 seconds
      })
      .catch(err => console.error('Could not copy text: ', err));
  }

  const {
    socket,
    makeMove,
    gameResult,
    closeModal
  } = useChessGameSocket(game, setGame, setGameId, playerColor, setPlayerColor, gameId, setTimers);

  function onDrop(sourceSquare, targetSquare) {
    makeMove(sourceSquare, targetSquare);
  }

  const handleRematch = () => {
    socket.emit('rematchRequest', gameId);
  };

  const handleAcceptRematch = () => {
    socket.emit('acceptRematch', gameId);
  };

  socket.on('rematchOffered', (offeredGameId) => {
    if (offeredGameId === gameId) {
      setRematchOffered(true);
    }
  });

  socket.on('startNewGame', (newGameId, newPlayerColors) => {
    // Reset the game state for a new game
    setGame(new Chess());
    setGameId(newGameId);
    setPlayerColor(newPlayerColors); // Assuming newPlayerColors is a map of socket IDs to colors
    setRematchOffered(false);
    closeModal();
  });

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!gameId) return (
    <GameCreation
      createNewGame={() => socket.emit('newGame')}
      joinGame={(id) => socket.emit('joinGame', id)}
      gameIdInput={gameIdInput}
      setGameIdInput={setGameIdInput}
    />
  )

  return (
    <div className="chessboard-container">
      {gameResult && (
        <GameEndModal
          onRematch={handleRematch}
          onAcceptRematch={handleAcceptRematch}
          rematchOffered={rematchOffered}
          onClose={() => closeModal()}
        >
          <p>Game Result: {gameResult}</p>
        </GameEndModal>
      )}
      <p onClick={copyToClipboard} style={{cursor: 'pointer'}}>
        Game ID: {gameId} {copySuccess && <span style={{color: 'green'}}>{copySuccess}</span>}
      </p>
      <p>You are playing as: {playerColor}</p>
      <p>Current Turn: {game.turn() === 'w' ? 'White' : 'Black'}</p>
      <div>
        <p>White Timer: {formatTime(timers.white)}</p>
        <p>Black Timer: {formatTime(timers.black)}</p>
      </div>
      <Chessboard
        position={game.fen()}
        onPieceDrop={onDrop}
        boardOrientation={playerColor}
        // customBoardStyle="chessboard"
      />
    </div>
  )
}

