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
      {/* Main bullet - larger and brighter */}
      <mesh 
        ref={bulletRef} 
        position={initialPos.current}
        userData={{ isBullet: true, owner }}
      >
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial 
          color="#ff5500" 
          emissive="#ff3300"
          emissiveIntensity={4}
          transparent={true}
          opacity={0.9}
        />
      </mesh>
      
      {/* Bullet core - bright center */}
      <mesh
        position={initialPos.current}
      >
        <sphereGeometry args={[0.08, 10, 10]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive="#ffffff"
          emissiveIntensity={5}
          transparent={true}
          opacity={0.95}
        />
      </mesh>
      
      {/* Bullet trail - longer and more impressive */}
      <mesh
        position={initialPos.current}
        rotation={[0, 0, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.03, 0.12, 3, 8]} />
        <meshStandardMaterial 
          color="#ffaa00" 
          emissive="#ffcc00"
          emissiveIntensity={3}
          transparent={true}
          opacity={0.8}
        />
      </mesh>
      
      {/* Additional spark effect */}
      <mesh
        position={initialPos.current}
      >
        <octahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial 
          color="#ffdd00" 
          emissive="#ffff00"
          emissiveIntensity={2}
          transparent={true}
          opacity={0.5}
        />
      </mesh>
      
      {/* Bullet glow - much brighter */}
      <pointLight
        position={initialPos.current}
        color="#ff7700"
        intensity={4}
        distance={5}
        decay={2}
      />
    </group>
  );
};

export default Bullet;
