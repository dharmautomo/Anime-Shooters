import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WeaponType } from '../lib/stores/useWeapons';
import { usePlayer } from '../lib/stores/initializeStores';

interface BulletProps {
  position: THREE.Vector3;
  direction: THREE.Vector3;
  speed: number;
  weaponType: WeaponType;
  playerId: string;
  id: string;
  onHit?: (bulletId: string) => void;
}

const BULLET_COLORS = {
  [WeaponType.PISTOL]: '#ffff00', // Yellow
  [WeaponType.RIFLE]: '#00ffff',  // Cyan
  [WeaponType.SHOTGUN]: '#ff0000' // Red
};

const BULLET_SIZES = {
  [WeaponType.PISTOL]: 0.1,
  [WeaponType.RIFLE]: 0.07,
  [WeaponType.SHOTGUN]: 0.05
};

const BULLET_TRAIL_LENGTHS = {
  [WeaponType.PISTOL]: 1,
  [WeaponType.RIFLE]: 1.5,
  [WeaponType.SHOTGUN]: 0.7
};

const Bullet = ({ 
  position, 
  direction, 
  speed, 
  weaponType, 
  playerId,
  id,
  onHit 
}: BulletProps) => {
  const bulletRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Mesh>(null);
  const lifetime = useRef<number>(0);
  const { playerId: localPlayerId } = usePlayer();
  
  // Set initial position
  useEffect(() => {
    if (bulletRef.current) {
      bulletRef.current.position.copy(position);
    }
    
    if (trailRef.current) {
      trailRef.current.position.copy(position);
      // Point the trail in the direction of travel
      trailRef.current.lookAt(
        position.clone().add(direction.clone().multiplyScalar(1))
      );
    }
  }, [position, direction]);
  
  // Update bullet position
  useFrame((_, delta) => {
    lifetime.current += delta;
    
    if (bulletRef.current && trailRef.current) {
      // Calculate movement distance for this frame
      const moveDistance = speed * delta;
      
      // Update position
      bulletRef.current.position.add(
        direction.clone().multiplyScalar(moveDistance)
      );
      
      // Update trail position
      trailRef.current.position.copy(bulletRef.current.position);
      
      // Keep trail oriented in the direction of travel
      trailRef.current.lookAt(
        bulletRef.current.position.clone().add(direction.clone().multiplyScalar(1))
      );
      
      // Destroy bullet after 5 seconds
      if (lifetime.current > 5) {
        onHit?.(id);
      }
    }
  });
  
  // Different color for own bullets vs enemy bullets
  const bulletColor = playerId === localPlayerId 
    ? BULLET_COLORS[weaponType] 
    : '#ffffff';
  
  const bulletSize = BULLET_SIZES[weaponType];
  const trailLength = BULLET_TRAIL_LENGTHS[weaponType];
  
  return (
    <group>
      {/* Bullet sphere */}
      <mesh ref={bulletRef} castShadow>
        <sphereGeometry args={[bulletSize, 8, 8]} />
        <meshStandardMaterial 
          color={bulletColor} 
          emissive={bulletColor} 
          emissiveIntensity={2}
        />
      </mesh>
      
      {/* Bullet trail */}
      <mesh ref={trailRef} castShadow rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry 
          args={[
            0, // top radius (cone)
            bulletSize * 0.7, // bottom radius
            trailLength, // height
            8, // segments
            1, // height segments
            false // open ended
          ]} 
        />
        <meshStandardMaterial 
          color={bulletColor} 
          emissive={bulletColor}
          emissiveIntensity={1.5}
          transparent={true}
          opacity={0.7}
        />
      </mesh>
    </group>
  );
};

export default Bullet;