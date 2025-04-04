import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { usePlayer, useMultiplayer } from '../lib/stores/initializeStores';
import { useGameControls } from '../lib/stores/useGameControls';

// Create stable selector functions outside the component to prevent infinite loops
const healthSelector = (state: any) => state.health;
const scoreSelector = (state: any) => state.score;

const UI = () => {
  // Get the latest player state using individual selectors 
  const health = usePlayer(healthSelector);
  const score = usePlayer(scoreSelector);
  const { killFeed } = useMultiplayer();
  const { hasInteracted, isControlsLocked } = useGameControls();
  const [showControls, setShowControls] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  // For tracking if pointer lock is actually working via the native API
  const [isPointerLocked, setIsPointerLocked] = useState<boolean>(!!document.pointerLockElement);
  
  // Toggle controls guide with ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowControls(prev => !prev);
      }
      
      // Toggle debug with Shift+D
      if (e.key === 'd' && e.shiftKey) {
        setShowDebug(prev => !prev);
        console.log("Debug info toggled:", !showDebug);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Hide controls after 5 seconds (only initially)
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 5000);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [showDebug]);
  
  // Monitor pointer lock status
  useEffect(() => {
    const handlePointerLockChange = () => {
      const newLockedState = !!document.pointerLockElement;
      setIsPointerLocked(newLockedState);
      console.log("Pointer lock state changed:", newLockedState ? "LOCKED" : "UNLOCKED");
    };

    // Listen for pointer lock events
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('mozpointerlockchange', handlePointerLockChange);
    document.addEventListener('webkitpointerlockchange', handlePointerLockChange);
    
    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('mozpointerlockchange', handlePointerLockChange);
      document.removeEventListener('webkitpointerlockchange', handlePointerLockChange);
    };
  }, []);

  // Add crosshair for aiming
  const crosshairStyle = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '16px',
    height: '16px',
    pointerEvents: 'none' as const,
    zIndex: 1000,
    opacity: isControlsLocked ? 1 : 0,
    transition: 'opacity 0.2s ease'
  };
  
  return createPortal(
    <div className="game-ui">
      {/* Crosshair */}
      <div style={crosshairStyle}>
        <svg width="16" height="16" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="1.5" fill="white" />
          <line x1="8" y1="3" x2="8" y2="5" stroke="white" strokeWidth="1" />
          <line x1="8" y1="11" x2="8" y2="13" stroke="white" strokeWidth="1" />
          <line x1="3" y1="8" x2="5" y2="8" stroke="white" strokeWidth="1" />
          <line x1="11" y1="8" x2="13" y2="8" stroke="white" strokeWidth="1" />
        </svg>
      </div>
      
      {/* Health bar */}
      <div className="health-bar">
        <div className="health-bar-fill" style={{ width: `${health}%` }}></div>
        <div style={{ 
          position: "absolute", 
          width: "100%", 
          textAlign: "center", 
          fontSize: "14px",
          fontWeight: "bold",
          color: "white",
          textShadow: "0 0 3px black, 0 0 3px black, 0 0 3px black",
          top: 0,
          left: 0,
          zIndex: 10,
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          pointerEvents: "none"
        }}>
          <span>Health: {health}/100</span>
        </div>
      </div>
      

      
      {/* Score display */}
      <div className="score-display">
        <div style={{ 
          position: "absolute",
          width: "100%", 
          textAlign: "center", 
          fontSize: "14px",
          fontWeight: "bold",
          color: "white",
          textShadow: "0 0 3px black, 0 0 3px black, 0 0 3px black",
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          zIndex: 10,
          top: 0,
          left: 0,
          pointerEvents: "none"
        }}>
          <span>Score: {score}</span>
        </div>
      </div>
      

      
      {/* Controls guide */}
      {showControls && (
        <div className="controls-guide">
          <h3>Controls:</h3>
          <p>WASD or Arrow Keys - Move</p>
          <p>Mouse - Look around</p>
          <p>Space - Jump</p>
          <p>Crosshair - Aim weapon</p>
          <p>ESC - Toggle this guide</p>
          <p>Shift+D - Show debug info</p>
        </div>
      )}
      
      {/* Kill feed */}
      <div className="kill-feed">
        {killFeed.map((kill, index) => (
          <div key={index} className="kill-feed-item">
            <span style={{ color: kill.killer === 'You' ? '#ff0' : '#fff' }}>
              {kill.killer}
            </span> killed <span style={{ color: '#f66' }}>{kill.victim}</span>
          </div>
        ))}
      </div>
      
      {/* Debug UI - Toggle with Shift+D */}
      {showDebug && (
        <div 
          className="debug-overlay"
          style={{
            position: 'fixed',
            top: '100px',
            right: '20px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '15px',
            borderRadius: '5px',
            zIndex: 10000,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            fontFamily: 'monospace',
            pointerEvents: 'auto'
          }}
        >
          <h3 style={{ margin: '0 0 10px 0' }}>Debug Info</h3>
          <div>
            <p style={{ margin: '5px 0' }}>
              hasInteracted: <span style={{ color: hasInteracted ? '#00ff00' : '#ff0000' }}>
                {hasInteracted ? 'YES' : 'NO'}
              </span>
            </p>
            <p style={{ margin: '5px 0' }}>
              isControlsLocked: <span style={{ color: isControlsLocked ? '#00ff00' : '#ff0000' }}>
                {isControlsLocked ? 'YES' : 'NO'}
              </span>
            </p>
            <p style={{ margin: '5px 0' }}>
              pointerLockElement: <span style={{ color: isPointerLocked ? '#00ff00' : '#ff0000' }}>
                {isPointerLocked ? 'YES' : 'NO'}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default UI;