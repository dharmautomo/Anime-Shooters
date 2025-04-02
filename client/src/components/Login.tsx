import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface LoginProps {
  onLogin: (username: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
    }
  };

  return (
    <div className="login-screen">
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
      
      {/* Login form container */}
      <div className="login-container" style={{ zIndex: 5 }}>
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
        
        {/* Controls guide */}
        <div className="controls-panel">
          <div className="controls-header">
            <div className="icon-controller"></div>
            <h3>GAME CONTROLS</h3>
            <div className="icon-controller"></div>
          </div>
          
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
          </div>
          
          <div className="version-info">v1.0.0 • FPS Multiplayer</div>
        </div>
      </div>
      
      {/* Removed inline styles - using global CSS */}
    </div>
  );
}