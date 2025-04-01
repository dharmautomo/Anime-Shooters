
import { useEffect } from 'react';
import { useGame } from '@/lib/stores/useGame';

export default function GameStartOverlay() {
  const phase = useGame((state) => state.phase);
  const start = useGame((state) => state.start);

  // Auto-start the game when component mounts
  useEffect(() => {
    if (phase === 'ready') {
      start();
    }
  }, [phase, start]);

  // Don't render any overlay
  return null;
}
