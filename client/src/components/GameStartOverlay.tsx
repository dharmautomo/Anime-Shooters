import React, { useEffect } from 'react';
import { useGameControls } from '../lib/stores/useGameControls';

const GameStartOverlay: React.FC = () => {
  const { hasInteracted, setHasInteracted } = useGameControls();

  // Add console logging for debugging
  useEffect(() => {
    console.log("GameStartOverlay rendered, hasInteracted:", hasInteracted);
  }, [hasInteracted]);

  if (hasInteracted) {
    console.log("User has interacted, hiding overlay");
    return null;
  }

  const handleStartGame = () => {
    console.log("START GAME button clicked");
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
        <button 
          className="start-button" 
          onClick={handleStartGame}
          style={{ cursor: 'pointer' }}
        >
          START GAME
        </button>
      </div>
    </div>
  );
};

export default GameStartOverlay;