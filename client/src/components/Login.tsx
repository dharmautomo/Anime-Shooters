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
    
    // Show loading state briefly for smoother UX
    setIsLoading(true);
    
    // Valid username - submit it after a short delay for better UX
    setTimeout(() => {
      console.log('Submitting username:', trimmedName);
      onLogin(trimmedName);
    }, 300);
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
      {/* Animated background elements */}
      <div className="login-particles"></div>
      
      <div className="login-content">
        <h1>Anime FPS Arena</h1>
        
        <div className="login-form">
          <div className="login-label">
            <span className="highlight">Enter your username</span>
          </div>
          
          <input
            id="username-input"
            type="text"
            placeholder="Your Username"
            value={username}
            onChange={handleUsernameChange}
            onKeyDown={handleKeyDown}
            maxLength={15}
            className={error ? 'input-error' : ''}
            disabled={isLoading}
          />
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            onClick={handleSubmit}
            disabled={!username.trim() || isLoading}
            className={isLoading ? 'loading' : ''}
          >
            {isLoading ? (
              <span className="loading-text">Loading...</span>
            ) : (
              <span>Start Game</span>
            )}
          </button>
        </div>
        
        <div className="controls-guide">
          <h3>Game Controls</h3>
          
          <div className="controls-grid">
            <div className="control-item">
              <div className="control-icon movement-icon">
                <span className="key">W</span>
                <span className="key">A</span>
                <span className="key">S</span>
                <span className="key">D</span>
              </div>
              <div className="control-text">Movement</div>
            </div>
            
            <div className="control-item">
              <div className="control-icon mouse-icon">
                <div className="mouse-body">
                  <div className="mouse-wheel"></div>
                </div>
              </div>
              <div className="control-text">Look around</div>
            </div>
            
            <div className="control-item">
              <div className="control-icon click-icon">
                <div className="click-circle"></div>
                <div className="click-ripple"></div>
              </div>
              <div className="control-text">Shoot</div>
            </div>
            
            <div className="control-item">
              <div className="control-icon">
                <span className="key large-key">R</span>
              </div>
              <div className="control-text">Reload</div>
            </div>
            
            <div className="control-item">
              <div className="control-icon">
                <span className="key xl-key">Space</span>
              </div>
              <div className="control-text">Jump</div>
            </div>
          </div>
          
          <div className="version-info">v1.0.0</div>
        </div>
      </div>
    </div>
  );
};

export default Login;
