
import { useEffect } from 'react';
import { useGame } from '@/lib/stores/useGame';

export default function GameStartOverlay() {
  const phase = useGame((state) => state.phase);
  const start = useGame((state) => state.start);

  useEffect(() => {
    const handleClick = () => {
      if (phase === 'ready') {
        start();
      }
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [phase, start]);

  if (phase !== 'ready') return null;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/80 text-white">
      <h1 className="text-5xl font-bold mb-8">FPS Game</h1>
      <div className="space-y-4 text-lg text-center">
        <p>WASD / Arrow Keys: Move</p>
        <p>Mouse: Look around</p>
        <p>Left Click: Shoot</p>
        <p>R: Reload</p>
      </div>
      <button className="mt-8 px-8 py-4 text-2xl bg-red-500 rounded-lg hover:bg-red-600 transition-colors">
        START GAME
      </button>
    </div>
  );
}
