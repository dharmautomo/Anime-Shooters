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
      <div className="fps-counter">60 FPS (60-60)</div>
      <div className="score-display-static">Score: 0</div>
      
      <div className="login-content">
        <h1 className="game-title">FPS Battle Arena</h1>
        
        <div className="login-form">
          <div className="login-label">
            <span>Enter your username</span>
          </div>
          
          <input
            id="username-input"
            type="text"
            placeholder="Player Name"
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
            {isLoading ? 'Loading...' : 'START GAME'}
          </button>
        </div>
        
        <div className="controls-guide">
          <h3>Game Controls</h3>
          
          <p>WASD or Arrow Keys - Movement</p>
          <p>Mouse - Aim Weapon</p>
          <p>Left Click - Fire Weapon</p>
          <p>R - Reload Ammo</p>
          <p>Space - Jump</p>
          
          <div className="version-info">v1.0.0</div>
        </div>
      </div>
      
      <div className="ammo-display">9 / 10</div>
    </div>
  );
};

export default Login;
