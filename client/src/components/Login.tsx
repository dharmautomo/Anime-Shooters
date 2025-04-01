import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface LoginProps {
  onLogin: (username: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [petalsPosition, setPetalsPosition] = useState({ x: 0, y: 0 });
  const [cloudsPosition, setCloudsPosition] = useState({ x: 0 });

  // Animate the floating elements (petals and clouds)
  useEffect(() => {
    // Animate falling petals
    const petalInterval = setInterval(() => {
      setPetalsPosition(prev => ({
        x: (prev.x + 0.2) % 100,
        y: (prev.y + 0.2) % 100
      }));
    }, 50);
    
    // Animate drifting clouds
    const cloudInterval = setInterval(() => {
      setCloudsPosition(prev => ({
        x: (prev.x + 0.05) % 100
      }));
    }, 50);
    
    return () => {
      clearInterval(petalInterval);
      clearInterval(cloudInterval);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
    }
  };

  return (
    <div className="login-screen">
      {/* Japanese village background with cherry blossoms */}
      <div 
        className="japanese-bg"
        style={{ 
          backgroundImage: `url('/images/cherry-blossom-bg.svg')`,
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          zIndex: 1
        }}
      />
      
      {/* Animated floating clouds */}
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
          backgroundPosition: `${-cloudsPosition.x}% 0%`,
          opacity: 0.7,
          zIndex: 2
        }}
      />
      
      {/* Falling cherry blossom petals */}
      <div 
        className="falling-petals"
        style={{ 
          backgroundImage: `url('/images/sakura-petals.svg')`,
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundSize: '120%',
          backgroundPosition: `${-petalsPosition.x}% ${petalsPosition.y}%`,
          opacity: 0.6,
          zIndex: 3,
          pointerEvents: 'none'
        }}
      />
      
      {/* Anime mascot character */}
      <div 
        className="anime-mascot"
        style={{ 
          backgroundImage: `url('/images/anime-mascot.svg')`,
          position: 'absolute',
          bottom: '-40px',
          right: '50px',
          width: '400px',
          height: '550px',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          zIndex: 4,
          animation: 'float 3s ease-in-out infinite'
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
      
      {/* Style additions for float animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
      `}</style>
    </div>
  );
}