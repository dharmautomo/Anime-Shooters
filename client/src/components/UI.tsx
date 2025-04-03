import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { usePlayer, useMultiplayer } from '../lib/stores/initializeStores';
import { useGameControls } from '../lib/stores/useGameControls';

// Create stable selector functions outside the component to prevent infinite loops
const healthSelector = (state: any) => state.health;
const ammoSelector = (state: any) => {
  // Log every time ammo is accessed to verify it's being updated correctly
  console.log("🎯 UI - Reading current ammo value:", state.ammo);
  return state.ammo;
};
const scoreSelector = (state: any) => state.score;

const UI = () => {
  // Get the latest player state using individual selectors 
  const health = usePlayer(healthSelector);
  const ammo = usePlayer(ammoSelector);
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


  
  // Create crosshair SVG
  const crosshairSvg = `
    <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="1" fill="red" />
      <line x1="10" y1="2" x2="10" y2="8" stroke="red" stroke-width="1" />
      <line x1="10" y1="12" x2="10" y2="18" stroke="red" stroke-width="1" />
      <line x1="2" y1="10" x2="8" y2="10" stroke="red" stroke-width="1" />
      <line x1="12" y1="10" x2="18" y2="10" stroke="red" stroke-width="1" />
    </svg>
  `;
  
  return createPortal(
    <div className="game-ui">
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
      
      {/* Ammo counter with reload indicator */}
      <div className="ammo-counter">
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
          <span style={{ color: ammo === 0 ? '#ff6b6b' : 'white' }}>
            Ammo: <b>{ammo}</b>/10 {ammo === 0 ? "- EMPTY!" : ""}
          </span>
        </div>
        {ammo === 0 && <div className="reload-indicator">Press R to reload!</div>}
      </div>
      
      {/* Crosshair */}
      <div 
        className="crosshair"
        dangerouslySetInnerHTML={{ __html: crosshairSvg }}
      ></div>
      
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
          <p>Left Click - Shoot</p>
          <p>R - Reload</p>
          <p>Space - Jump</p>
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
            <p style={{ margin: '5px 0' }}>
              Current Ammo: <span style={{ color: ammo === 0 ? '#ff0000' : '#00ff00' }}>
                {ammo}/10
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
