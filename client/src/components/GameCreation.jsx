export default function GameCreation({ createNewGame, joinGame, gameIdInput, setGameIdInput }) {
  return (
    <div className="game-creation-container">
      <button onClick={createNewGame}>Create New Game</button>
      <input
        type="text" value={gameIdInput} placeholder="Enter Game ID"
        onChange={(e) => setGameIdInput(e.target.value)}
      />
      <button onClick={() => joinGame(gameIdInput)}>Join Game</button>
    </div>
  );
}
