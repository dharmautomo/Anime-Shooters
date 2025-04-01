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
    <div className="fixed inset-0 flex items-center justify-center bg-black/90">
      <div className="w-full max-w-md space-y-8 p-6 bg-card rounded-lg shadow-xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-2">FPS Game</h1>
          <p className="text-lg text-muted-foreground mb-6">Enter your username to start playing</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full"
          />
          <Button type="submit" className="w-full">
            Start Game
          </Button>
        </form>
      </div>
    </div>
  );
}