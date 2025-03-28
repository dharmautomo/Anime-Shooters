import { useState, useEffect } from 'react';

interface LoginProps {
  onLogin: (username: string) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [username, setUsername] = useState('');
  
  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && username.trim()) {
      onLogin(username);
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
      
      <input
        id="username-input"
        type="text"
        placeholder="Enter your username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={15}
      />
      
      <button 
        onClick={() => username.trim() && onLogin(username)}
        disabled={!username.trim()}
      >
        Start Game
      </button>
      
      <div style={{ marginTop: '2rem', maxWidth: '500px', textAlign: 'center' }}>
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
