import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMultiplayer } from '../lib/stores/useMultiplayer';
import { usePlayer } from '../lib/stores/usePlayer';
import { useAudio } from '../lib/stores/useAudio';
import { checkCollision } from '../lib/utils/collisionDetection';

interface BulletProps {
  position: THREE.Vector3 | [number, number, number];
  velocity: THREE.Vector3 | [number, number, number];
  owner: string;
}

const Bullet = ({ position, velocity, owner }: BulletProps) => {
  const bulletRef = useRef<THREE.Mesh>(null);
  const initialPos = useRef(
    position instanceof THREE.Vector3 
      ? new THREE.Vector3().copy(position) 
      : new THREE.Vector3(position[0], position[1], position[2])
  );
  
  const velocityVector = useRef(
    velocity instanceof THREE.Vector3 
      ? new THREE.Vector3().copy(velocity) 
      : new THREE.Vector3(velocity[0], velocity[1], velocity[2])
  );
  
  const { checkBulletCollision, removeBullet } = useMultiplayer();
  const { playerId } = usePlayer();
  const { playHit, playSound } = useAudio();
  
  // Bullet lifetime and speed
  const lifetime = useRef(3000); // 3 seconds
  const speed = 2.5; // Increased bullet speed for better gameplay
  
  // Set up bullet
  useEffect(() => {
    // Play shooting sound when bullet is created (only for bullets that are not owned by other players)
    if (owner === playerId) {
      // Use direct Web Audio API for more reliable sound
      playSound('gunshot');
      console.log("Playing gunshot sound for bullet using Web Audio API");
    }
    
    // Start lifetime countdown
    const timeoutId = setTimeout(() => {
      if (bulletRef.current) {
        // Remove bullet after lifetime expires
        removeBullet(bulletRef.current.uuid);
        console.log("Bullet expired and removed");
      }
    }, lifetime.current);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [removeBullet, owner, playerId, playHit, playSound]);
  
  // Update bullet position each frame
  useFrame(() => {
    if (bulletRef.current) {
      // Move bullet in its velocity direction
      const movement = velocityVector.current.clone().multiplyScalar(speed);
      bulletRef.current.position.add(movement);
      
      // Check for collisions with players
      const collision = checkBulletCollision(
        bulletRef.current.position,
        owner
      );
      
      // If collision occurred, remove the bullet
      if (collision) {
        removeBullet(bulletRef.current.uuid);
      }
    }
  });
  
  return (
    <group>
      {/* Main bullet - realistic metal projectile */}
      <mesh 
        ref={bulletRef} 
        position={initialPos.current}
        rotation={[Math.PI/2, 0, 0]} // Rotated to align with flight direction
        userData={{ isBullet: true, owner }}
      >
        {/* Bullet is elongated with a pointed tip */}
        <cylinderGeometry args={[0.05, 0.07, 0.2, 8]} />
        <meshStandardMaterial 
          color="#b39b6f" 
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* Bullet base (shell casing color) */}
      <mesh
        position={[
          initialPos.current.x,
          initialPos.current.y,
          initialPos.current.z - 0.1
        ]}
      >
        <cylinderGeometry args={[0.07, 0.07, 0.03, 8]} />
        <meshStandardMaterial 
          color="#d4af37" 
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      {/* Subtle smoke trail */}
      <mesh
        position={[
          initialPos.current.x, 
          initialPos.current.y, 
          initialPos.current.z - 0.15
        ]}
      >
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial 
          color="#aaaaaa" 
          transparent={true}
          opacity={0.4}
        />
      </mesh>
      
      {/* Very subtle glow/light */}
      <pointLight
        position={initialPos.current}
        color="#fffaf0"
        intensity={0.8}
        distance={2}
        decay={2}
      />
    </group>
  );
};

export default Bullet;
