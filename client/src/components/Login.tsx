import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useIsMobile } from '../hooks/use-is-mobile';

interface LoginProps {
  onLogin: (username: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const isMobile = useIsMobile();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      // Add mobile flag to username if on mobile
      const finalUsername = isMobile ? `${username.trim()} [Mobile]` : username.trim();
      onLogin(finalUsername);
    }
  };

  // Create device-specific styles
  const containerStyle = {
    zIndex: 5,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: isMobile ? '10px' : '20px',
    maxWidth: '100%',
    maxHeight: '100vh',
    overflow: 'auto',
  };
  
  // Basic mobile styles only, no orientation forcing
  useEffect(() => {
    if (isMobile) {
      // Add basic viewport meta tag for responsive design
      const viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      viewportMeta.content = 'width=device-width, initial-scale=1.0';
      document.getElementsByTagName('head')[0].appendChild(viewportMeta);
      
      return () => {
        // Clean up
        document.getElementsByTagName('head')[0].removeChild(viewportMeta);
      };
    }
  }, [isMobile]);
  
  return (
    <div className="login-screen" style={{ 
      maxWidth: '100vw',
      maxHeight: '100vh',
      overflow: 'hidden'
    }}>
      {/* Simple gradient background */}
      <div 
        className="gradient-bg"
        style={{ 
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1
        }}
      />
      
      {/* Animated floating clouds - keeping this for some subtle background */}
      <div 
        className="floating-clouds"
        style={{ 
          backgroundImage: `url('/images/clouds.svg')`,
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundSize: '150%',
          backgroundRepeat: 'repeat-x',
          opacity: 0.3,
          zIndex: 2
        }}
      />
      
      {/* Mobile orientation message removed */}
      
      {/* Login form container */}
      <div className="login-container" style={containerStyle}>
        <div className="game-title">
          <span className="title-top">ANIME</span>
          <span className="title-bottom">EXPLORER</span>
        </div>
        
        <div className="login-card">
          <div className="card-header">
            <div className="card-decoration"></div>
            <h2>PLAYER LOGIN</h2>
            <div className="card-decoration"></div>
          </div>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Enter Your Codename</label>
              <div className="input-wrapper">
                <Input
                  id="username"
                  type="text"
                  placeholder="e.g. SakuraNinja"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full"
                  autoComplete="off"
                  autoFocus
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="primary-button"
              disabled={!username.trim()}
            >
              Start Exploring
            </Button>
          </form>
        </div>
        
        {/* Controls guide - different for mobile and desktop */}
        <div className="controls-panel">
          <div className="controls-header">
            <div className="icon-controller"></div>
            <h3>GAME CONTROLS</h3>
            <div className="icon-controller"></div>
          </div>
          
          {isMobile ? (
            // Mobile touch controls guide
            <div className="controls-grid mobile-controls-grid">
              <div className="control-item">
                <div className="control-key mobile-key">↑</div>
                <div className="control-label">Forward</div>
              </div>
              <div className="control-item">
                <div className="control-key mobile-key">↓</div>
                <div className="control-label">Backward</div>
              </div>
              <div className="control-item">
                <div className="control-key mobile-key">←</div>
                <div className="control-label">Left</div>
              </div>
              <div className="control-item">
                <div className="control-key mobile-key">→</div>
                <div className="control-label">Right</div>
              </div>
              <div className="control-item">
                <div className="control-key mobile-key">↕</div>
                <div className="control-label">Jump</div>
              </div>
              <div className="control-item">
                <div className="control-key mobile-key">👆</div>
                <div className="control-label">Interact</div>
              </div>
              <div className="control-item" style={{ gridColumn: "span 2" }}>
                <div className="control-key mobile-key" style={{ width: "auto", padding: "0 15px" }}>
                  ↔ Swipe Screen ↔
                </div>
                <div className="control-label">Look Around</div>
              </div>
            </div>
          ) : (
            // Desktop keyboard/mouse controls
            <div className="controls-grid">
              <div className="control-item">
                <div className="control-key">W</div>
                <div className="control-label">Forward</div>
              </div>
              <div className="control-item">
                <div className="control-key">S</div>
                <div className="control-label">Backward</div>
              </div>
              <div className="control-item">
                <div className="control-key">A</div>
                <div className="control-label">Left</div>
              </div>
              <div className="control-item">
                <div className="control-key">D</div>
                <div className="control-label">Right</div>
              </div>
              <div className="control-item">
                <div className="control-key">SPACE</div>
                <div className="control-label">Jump</div>
              </div>
              <div className="control-item">
                <div className="control-key">E</div>
                <div className="control-label">Interact</div>
              </div>
              <div className="control-item" style={{ gridColumn: "span 2" }}>
                <div className="control-key" style={{ width: "auto", padding: "0 15px" }}>Mouse</div>
                <div className="control-label">Look Around</div>
              </div>
            </div>
          )}
          
          <div className="version-info">v1.0.1 • Multiplayer Exploration{isMobile ? ' (Mobile)' : ''}</div>
        </div>
      </div>
      
      {/* Removed inline styles - using global CSS */}
    </div>
  );
}