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
  
  // Mobile optimization styles
  useEffect(() => {
    if (isMobile) {
      // Add viewport meta tag to ensure proper mobile scaling
      const viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.getElementsByTagName('head')[0].appendChild(viewportMeta);
      
      // Force landscape orientation if possible
      const orientationMeta = document.createElement('meta');
      orientationMeta.name = 'screen-orientation';
      orientationMeta.content = 'landscape';
      document.getElementsByTagName('head')[0].appendChild(orientationMeta);
      
      // Add fullscreen to mobile
      document.documentElement.style.height = '100%';
      document.body.style.height = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Clean up
        document.getElementsByTagName('head')[0].removeChild(viewportMeta);
        document.getElementsByTagName('head')[0].removeChild(orientationMeta);
        document.documentElement.style.height = '';
        document.body.style.height = '';
        document.body.style.overflow = '';
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
      
      {/* Mobile orientation message */}
      {isMobile && window.innerHeight > window.innerWidth && (
        <div className="orientation-message" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.8)',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px',
          textAlign: 'center',
          fontSize: '1.2rem'
        }}>
          <div style={{ marginBottom: '20px' }}>📱 ↔️</div>
          <h2 style={{ marginBottom: '10px' }}>Please Rotate Your Device</h2>
          <p>This game plays best in landscape mode.</p>
        </div>
      )}
      
      {/* Login form container */}
      <div className="login-container" style={containerStyle}>
        <div className="game-title">
          <span className="title-top">ANIME</span>
          <span className="title-bottom">SHOOTERS</span>
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
              Enter Battle
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
                <div className="control-key mobile-key">🔄</div>
                <div className="control-label">Reload</div>
              </div>
              <div className="control-item">
                <div className="control-key mobile-key">🔫</div>
                <div className="control-label">Shoot</div>
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
                <div className="control-key">R</div>
                <div className="control-label">Reload</div>
              </div>
              <div className="control-item">
                <div className="control-key">LMB</div>
                <div className="control-label">Shoot</div>
              </div>
              <div className="control-item" style={{ gridColumn: "span 2" }}>
                <div className="control-key" style={{ width: "auto", padding: "0 15px" }}>Mouse</div>
                <div className="control-label">Look Around</div>
              </div>
            </div>
          )}
          
          <div className="version-info">v1.0.1 • FPS Multiplayer{isMobile ? ' (Mobile)' : ''}</div>
          
          {/* Mobile device warning */}
          {isMobile && (
            <div className="mobile-notice" style={{ 
              marginTop: "10px", 
              padding: "10px", 
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "5px",
              fontSize: "0.8rem",
              textAlign: "center"
            }}>
              Touch controls will appear automatically during gameplay. For best experience, rotate your device to landscape mode.
            </div>
          )}
        </div>
      </div>
      
      {/* Removed inline styles - using global CSS */}
    </div>
  );
}