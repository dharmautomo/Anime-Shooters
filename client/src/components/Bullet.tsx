import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMultiplayer } from '../lib/stores/useMultiplayer';
import { usePlayer } from '../lib/stores/usePlayer';
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
  
  // Bullet lifetime and speed
  const lifetime = useRef(3000); // 3 seconds
  const speed = 1.0; // Increase bullet speed for better gameplay
  
  // Set up bullet
  useEffect(() => {
    // Start lifetime countdown
    const timeoutId = setTimeout(() => {
      if (bulletRef.current) {
        // Remove bullet after lifetime expires
        removeBullet(bulletRef.current.uuid);
      }
    }, lifetime.current);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [removeBullet]);
  
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
      {/* Main bullet */}
      <mesh 
        ref={bulletRef} 
        position={initialPos.current}
        userData={{ isBullet: true, owner }}
      >
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial 
          color="#ff7700" 
          emissive="#ff5500"
          emissiveIntensity={2}
          transparent={true}
          opacity={0.9}
        />
      </mesh>
      
      {/* Bullet trail */}
      <mesh
        position={initialPos.current}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.01, 0.05, 1, 8]} />
        <meshStandardMaterial 
          color="#ffaa00" 
          emissive="#ffcc00"
          emissiveIntensity={1.5}
          transparent={true}
          opacity={0.6}
        />
      </mesh>
      
      {/* Bullet glow */}
      <pointLight
        position={initialPos.current}
        color="#ff7700"
        intensity={1}
        distance={2}
        decay={2}
      />
    </group>
  );
};

export default Bullet;
