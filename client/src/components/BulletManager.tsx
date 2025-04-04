import { useFrame } from '@react-three/fiber';
import Bullet from './Bullet';
import { useWeapons } from '../lib/stores/useWeapons';
import { useIsMobile, usePerformanceSettings } from '../hooks/use-is-mobile';

const BulletManager = () => {
  const { bullets, updateBullets, clearOldBullets } = useWeapons();
  const isMobile = useIsMobile();
  const performanceSettings = usePerformanceSettings();
  
  // Process bullet physics
  useFrame((_, delta) => {
    // Update bullet positions and check collisions
    updateBullets(delta);
    
    // Clean up old bullets periodically
    clearOldBullets();
  });
  
  // Apply bullet limits based on performance settings
  const visibleBullets = bullets.slice(0, performanceSettings.maxBullets);
  
  return (
    <>
      {visibleBullets.map((bullet) => (
        <Bullet
          key={bullet.id}
          id={bullet.id}
          position={bullet.position}
          direction={bullet.direction}
          speed={bullet.speed}
          weaponType={bullet.weaponType}
          playerId={bullet.playerId}
        />
      ))}
    </>
  );
};

export default BulletManager;