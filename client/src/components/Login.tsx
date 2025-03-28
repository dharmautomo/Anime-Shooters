import { useState, useEffect } from 'react';

interface LoginProps {
  onLogin: (username: string) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  
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
    
    // Valid username - submit it
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
      <h1>FPS Multiplayer Game</h1>
      
      <div className="login-form">
        <label htmlFor="username-input" className="login-label">
          Enter your username:
        </label>
        
        <input
          id="username-input"
          type="text"
          placeholder="Your Username"
          value={username}
          onChange={handleUsernameChange}
          onKeyDown={handleKeyDown}
          maxLength={15}
          className={error ? 'input-error' : ''}
        />
        
        {error && <div className="error-message">{error}</div>}
        
        <button 
          onClick={handleSubmit}
          disabled={!username.trim()}
        >
          Start Game
        </button>
      </div>
      
      <div className="controls-guide">
        <h3>Controls:</h3>
        <p>WASD or Arrow Keys - Move</p>
        <p>Mouse - Look around</p>
        <p>Left Click - Shoot</p>
        <p>R - Reload</p>
        <p>Space - Jump</p>
      </div>
    </div>
  );
};

export default Login;
