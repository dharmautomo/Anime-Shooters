import { useEffect, useState, useCallback, useRef } from 'react';
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
  // For damage effect
  const [showDamageEffect, setShowDamageEffect] = useState(false);
  // For score animation
  const [scoreAnimation, setScoreAnimation] = useState(false);
  const [prevScore, setPrevScore] = useState(score);
  
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
  
  // Create refs outside of the effect but inside the component
  const isInitialHealthRender = useRef(true);
  const prevHealthRef = useRef(health);
  
  // Effect for monitoring player health changes
  useEffect(() => {
    // Skip effect on first render
    if (isInitialHealthRender.current) {
      isInitialHealthRender.current = false;
      prevHealthRef.current = health;
      return;
    }
    
    // Only show damage effect if health decreased
    if (health < prevHealthRef.current) {
      setShowDamageEffect(true);
      
      // Play damage sound
      const damageSound = new Audio('/sounds/hit.mp3');
      damageSound.volume = 0.3;
      damageSound.play().catch(e => console.error("Error playing damage sound:", e));
      
      // Clear damage effect after short delay
      setTimeout(() => {
        setShowDamageEffect(false);
      }, 300);
    }
    
    // Update the previous health reference
    prevHealthRef.current = health;
  }, [health]);
  
  // Effect for monitoring score changes
  useEffect(() => {
    // If score increased, show animation
    if (score > prevScore) {
      setScoreAnimation(true);
      
      // Play success sound
      const successSound = new Audio('/sounds/success.mp3');
      successSound.volume = 0.2;
      successSound.play().catch(e => console.error("Error playing score sound:", e));
      
      // Clear animation after short delay
      setTimeout(() => {
        setScoreAnimation(false);
      }, 1000);
      
      // Update previous score
      setPrevScore(score);
    }
  }, [score, prevScore]);

  // Add crosshair for aiming
  const crosshairStyle = {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '24px',
    height: '24px',
    pointerEvents: 'none' as const,
    zIndex: 1000,
    opacity: isControlsLocked ? 1 : 0,
    transition: 'opacity 0.2s ease'
  };
  
  // Get weapon system state if available
  const [weaponState, setWeaponState] = useState({
    ammo: 10,
    maxAmmo: 10,
    isReloading: false,
    reloadProgress: 0
  });
  
  // Update weapon state from global window object
  useEffect(() => {
    const updateWeaponState = () => {
      if (window.weaponSystem) {
        setWeaponState({
          ammo: window.weaponSystem.ammo,
          maxAmmo: window.weaponSystem.maxAmmo,
          isReloading: window.weaponSystem.isReloading,
          reloadProgress: window.weaponSystem.reloadProgress
        });
      }
    };
    
    // Initial update
    updateWeaponState();
    
    // Poll for updates
    const intervalId = setInterval(updateWeaponState, 100);
    
    return () => clearInterval(intervalId);
  }, []);
  
  return createPortal(
    <div className="game-ui">
      {/* Blood splatter effect when taking damage */}
      {showDamageEffect && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
            pointerEvents: 'none',
            zIndex: 1000,
            animation: 'pulse 0.3s forwards'
          }}
        />
      )}
      
      {/* Score animation */}
      {scoreAnimation && (
        <div 
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#00ff00',
            fontSize: '32px',
            fontWeight: 'bold',
            textShadow: '0 0 5px black',
            pointerEvents: 'none',
            zIndex: 1001,
            animation: 'fadeUp 1s forwards'
          }}
        >
          +1 Hit!
        </div>
      )}
      
      {/* Crosshair */}
      <div style={crosshairStyle}>
        <svg width="24" height="24" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="2" fill="white" />
          <line x1="12" y1="4" x2="12" y2="8" stroke="white" strokeWidth="1.5" />
          <line x1="12" y1="16" x2="12" y2="20" stroke="white" strokeWidth="1.5" />
          <line x1="4" y1="12" x2="8" y2="12" stroke="white" strokeWidth="1.5" />
          <line x1="16" y1="12" x2="20" y2="12" stroke="white" strokeWidth="1.5" />
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
      
      {/* Ammo counter - positioned below health bar */}
      <div className="ammo-counter" style={{
        position: 'fixed',
        top: '60px',
        left: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        color: 'white',
        padding: '5px 15px',
        borderRadius: '5px',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        fontFamily: 'monospace',
        fontSize: '16px',
        fontWeight: 'bold',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '200px',
        height: '30px',
        boxSizing: 'border-box'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%'
        }}>
          {weaponState.isReloading ? (
            <span style={{
              color: '#ffaa00',
              animation: 'reloadBlink 0.6s infinite',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              lineHeight: '1',
              fontSize: '14px'
            }}>
              <svg 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ animation: 'reloadSpin 1s infinite linear' }}
              >
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
              RELOADING
            </span>
          ) : (
            <span style={{
              color: weaponState.ammo === 0 ? '#ff3333' : 'white',
              display: 'flex',
              alignItems: 'center',
              lineHeight: '1',
              fontSize: '14px'
            }}>
              {weaponState.ammo === 0 ? 'EMPTY - PRESS R TO RELOAD' : `AMMO: ${weaponState.ammo}/${weaponState.maxAmmo}`}
            </span>
          )}
        </div>
        
        {/* Progress bar hidden because we're fixing height */}
      </div>
      
      {/* Controls guide */}
      {showControls && (
        <div className="controls-guide">
          <h3>Controls:</h3>
          <p>WASD or Arrow Keys - Move</p>
          <p>Mouse - Look around</p>
          <p>Space - Jump</p>
          <p>Left Mouse Button / J Key / K Key - Shoot</p>
          <p>R Key - Reload weapon</p>
          <p>ESC - Toggle this guide</p>
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
              Ammo: {weaponState.ammo}/{weaponState.maxAmmo}
            </p>
            <p style={{ margin: '5px 0' }}>
              Reloading: {weaponState.isReloading ? 'YES' : 'NO'}
            </p>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default UI;