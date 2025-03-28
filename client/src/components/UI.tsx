import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePlayer } from '../lib/stores/usePlayer';
import { useMultiplayer } from '../lib/stores/useMultiplayer';

const UI = () => {
  const { health, ammo, score } = usePlayer();
  const { killFeed } = useMultiplayer();
  const [showControls, setShowControls] = useState(true);
  
  // Toggle controls guide with ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowControls(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Hide controls after 5 seconds
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 5000);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
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
      </div>
      
      {/* Ammo counter */}
      <div className="ammo-counter">
        {ammo} / 10
      </div>
      
      {/* Crosshair */}
      <div 
        className="crosshair"
        dangerouslySetInnerHTML={{ __html: crosshairSvg }}
      ></div>
      
      {/* Score display */}
      <div className="score-display">
        Score: {score}
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
    </div>,
    document.body
  );
};

export default UI;
