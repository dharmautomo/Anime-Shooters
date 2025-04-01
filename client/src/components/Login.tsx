import { useState, useEffect } from 'react';

interface LoginProps {
  onLogin: (username: string) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle username changes
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    
    // Clear errors when user types
    if (error) {
      setError('');
    }
  };
  
  // Submit username
  const handleSubmit = () => {
    const trimmedName = username.trim();
    
    if (!trimmedName) {
      setError('Please enter a username');
      return;
    }
    
    if (trimmedName.length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }
    
    // Show loading state briefly
    setIsLoading(true);
    
    // Submit without delay
    console.log('Submitting username:', trimmedName);
    onLogin(trimmedName);
  };
  
  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };
  
  // Focus input on mount
  useEffect(() => {
    const input = document.getElementById('username-input');
    if (input) {
      input.focus();
    }
  }, []);
  
  return (
    <div className="login-screen">
      {/* Anime Character Silhouettes */}
      <div className="anime-character left"></div>
      <div className="anime-character right"></div>
      
      {/* Floating Sakura Petals */}
      <div className="sakura-petals"></div>
      
      {/* Vibe Jam Badge */}
      <div className="vibe-jam-badge">
        Vibe Jam 2025
      </div>
      
      <div className="login-container">
        <h1 className="game-title">
          <span className="title-top">Anime</span>
          <span className="title-bottom">Shooters</span>
        </h1>
        
        <div className="login-card">
          <div className="card-header">
            <div className="card-decoration left"></div>
            <h2>Enter Battle</h2>
            <div className="card-decoration right"></div>
          </div>
          
          <div className="login-form">
            <div className="form-group">
              <label htmlFor="username-input">Choose your username</label>
              <div className="input-wrapper">
                <input
                  id="username-input"
                  type="text"
                  placeholder="Fighter Name"
                  value={username}
                  onChange={handleUsernameChange}
                  onKeyDown={handleKeyDown}
                  maxLength={15}
                  className={error ? 'input-error' : ''}
                  disabled={isLoading}
                />
              </div>
              {error && <div className="error-message">{error}</div>}
            </div>
            
            <button 
              onClick={handleSubmit}
              disabled={!username.trim() || isLoading}
              className={`primary-button ${isLoading ? 'loading' : ''}`}
            >
              {isLoading ? 'Preparing...' : 'START BATTLE'}
            </button>
          </div>
        </div>
        
        <div className="controls-panel">
          <div className="controls-header">
            <span className="icon-controller"></span>
            <h3>Game Controls</h3>
            <span className="icon-controller"></span>
          </div>
          
          <div className="controls-grid">
            <div className="control-item">
              <span className="control-key">W</span>
              <span className="control-label">Movement</span>
            </div>
            <div className="control-item">
              <span className="control-key">M</span>
              <span className="control-label">Look</span>
            </div>
            <div className="control-item">
              <span className="control-key">L</span>
              <span className="control-label">Shoot</span>
            </div>
            <div className="control-item">
              <span className="control-key">R</span>
              <span className="control-label">Reload</span>
            </div>
            <div className="control-item">
              <span className="control-key">↑</span>
              <span className="control-label">Jump</span>
            </div>
          </div>
          
          <div className="version-info">v1.0.0</div>
        </div>
      </div>

      {/* Portal Info */}
      <div className="portal-info">
        <span className="portal-icon"></span>
        <p>Connected to Vibeverse Portals</p>
      </div>
    </div>
  );
};

export default Login;
