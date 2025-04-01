import React from 'react';
import { useGameControls } from '../lib/stores/useGameControls';

const GameStartOverlay: React.FC = () => {
  const { hasInteracted, setHasInteracted } = useGameControls();

  if (hasInteracted) {
    return null;
  }

  const handleStartGame = () => {
    setHasInteracted(true);
  };

  return (
    <div className="game-start-overlay">
      <div className="game-start-container">
        <h1>FPS Game</h1>
        <p>Click to play</p>
        <p className="controls-info">
          <span>WASD / Arrow Keys: Move</span>
          <span>Mouse: Look around</span>
          <span>Left Click: Shoot</span>
          <span>R: Reload</span>
        </p>
        <button className="start-button" onClick={handleStartGame}>
          START GAME
        </button>
      </div>
    </div>
  );
};

export default GameStartOverlay;