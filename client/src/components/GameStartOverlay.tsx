import React, { useEffect } from 'react';
import { useGameControls } from '../lib/stores/useGameControls';

const GameStartOverlay: React.FC = () => {
  const { hasInteracted, setHasInteracted, isControlsLocked } = useGameControls();

  // Add console logging for debugging
  useEffect(() => {
    console.log("GameStartOverlay rendered, hasInteracted:", hasInteracted, "isControlsLocked:", isControlsLocked);
  }, [hasInteracted, isControlsLocked]);

  // If user has interacted and controls are locked, hide the overlay
  if (hasInteracted) {
    console.log("User has interacted, hiding overlay");
    return null;
  }

  const handleStartGame = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("START GAME button clicked");
    
    // Set user has interacted flag
    setHasInteracted(true);
    
    // Log that we're attempting to start the game
    console.log("Game start triggered");

    // Focus the document to ensure it can receive keyboard events
    document.body.focus();
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
          style={{ 
            cursor: 'pointer',
            position: 'relative',
            zIndex: 10000
          }}
        >
          START GAME
        </button>
      </div>
    </div>
  );
};

export default GameStartOverlay;