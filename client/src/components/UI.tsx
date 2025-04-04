import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { usePlayer, useMultiplayer } from '../lib/stores/initializeStores';
import { useGameControls } from '../lib/stores/useGameControls';
import { useWeapons, WeaponType, WEAPON_CONFIGS } from '../lib/stores/useWeapons';
import { useIsMobile } from '../hooks/use-is-mobile';

// Create stable selector functions outside the component to prevent infinite loops
const healthSelector = (state: any) => state.health;
const scoreSelector = (state: any) => state.score;

const UI = () => {
  // Get the latest player state using individual selectors 
  const health = usePlayer(healthSelector);
  const score = usePlayer(scoreSelector);
  const { killFeed } = useMultiplayer();
  const { hasInteracted, isControlsLocked } = useGameControls();
  const { currentWeapon, weapons, bullets } = useWeapons();
  const isMobile = useIsMobile();
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
    width: '24px',
    height: '24px',
    pointerEvents: 'none' as const,
    zIndex: 1000,
    opacity: isControlsLocked ? 1 : 0,
    transition: 'opacity 0.2s ease'
  };
  
  // Get current weapon state
  const currentWeaponState = weapons[currentWeapon];
  const weaponConfig = WEAPON_CONFIGS[currentWeapon];
  
  // Calculate ammo display color
  const getAmmoColor = () => {
    const ammoPercent = (currentWeaponState.ammo / weaponConfig.magazineSize) * 100;
    if (ammoPercent <= 25) return '#ff4444'; // Red for low ammo
    if (ammoPercent <= 50) return '#ffaa22'; // Orange for medium ammo
    return '#ffffff'; // White for sufficient ammo
  };
  
  return createPortal(
    <div className="game-ui">
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
        <div 
          className="health-bar-fill" 
          style={{ 
            width: `${health}%`,
            backgroundColor: health > 60 ? '#3f3' : health > 30 ? '#ff3' : '#f33'
          }}
        ></div>
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
      
      {/* Weapon and ammo display */}
      <div 
        className="weapon-display"
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          padding: "10px 15px",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          borderRadius: "5px",
          color: "white",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          pointerEvents: "none",
          textShadow: "0 0 3px black"
        }}
      >
        <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "5px" }}>
          {weaponConfig.name} 
          {currentWeaponState.isReloading && 
            <span style={{ color: "#ffaa22", marginLeft: "8px", fontSize: "14px" }}>
              [RELOADING]
            </span>
          }
        </div>
        <div style={{ 
          fontSize: "20px", 
          fontWeight: "bold",
          color: getAmmoColor()
        }}>
          {currentWeaponState.ammo} / {currentWeaponState.totalAmmo}
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
          <p>Left Click - Shoot</p>
          <p>R - Reload weapon</p>
          <p>1,2,3 - Switch weapons</p>
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
              Weapon: {weaponConfig.name} ({currentWeaponState.ammo}/{currentWeaponState.totalAmmo})
            </p>
            <p style={{ margin: '5px 0' }}>
              Active Bullets: {bullets.length}
            </p>
            <p style={{ margin: '5px 0' }}>
              Platform: {isMobile ? 'Mobile' : 'Desktop'}
            </p>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default UI;