import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAudio } from '../lib/stores/useAudio';
import { useMultiplayer, usePlayer } from '../lib/stores/initializeStores';
import { checkCollision } from '../lib/utils/collisionDetection';

interface BulletProps {
  position: THREE.Vector3 | [number, number, number];
  velocity: THREE.Vector3 | [number, number, number];
  owner: string;
  id?: string; // Add optional ID parameter
}

const Bullet = ({ position, velocity, owner, id }: BulletProps) => {
  // Store the bullet ID for later use with removal - ensure we always have an ID
  const bulletId = useRef(id || `bullet-${Math.random().toString(36).substring(2, 9)}`);
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
  const speed = 2.0; // Slightly reduced speed to make bullets more visible
  
  // Logging for debug - check bullet initialization
  useEffect(() => {
    console.log(`Bullet initialized: ID ${bulletId.current}, owner: ${owner}, position:`, initialPos.current);
  }, [owner]);
  
  // Set up bullet
  useEffect(() => {
    // Play shooting sound when bullet is created (only for bullets that are not owned by other players)
    if (owner === playerId) {
      // Use direct Web Audio API for more reliable sound
      console.log(`Owner's bullet - playing gunshot sound for bullet ${bulletId.current}`);
      playSound('gunshot');
    }
    
    // Start lifetime countdown
    const timeoutId = setTimeout(() => {
      // Use the stored bullet ID for removing
      console.log(`Bullet with ID ${bulletId.current} expired after ${lifetime.current}ms and will be removed`);
      try {
        removeBullet(bulletId.current);
      } catch (error) {
        console.error(`Failed to remove expired bullet ${bulletId.current}:`, error);
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
      try {
        const collision = checkBulletCollision(
          bulletRef.current.position,
          owner
        );
        
        // If collision occurred, remove the bullet
        if (collision) {
          console.log(`Bullet with ID ${bulletId.current} collided and will be removed`);
          removeBullet(bulletId.current);
        }
      } catch (error) {
        console.error(`Error checking bullet collision for ${bulletId.current}:`, error);
      }
    }
  });
  
  return (
    <group>
      {/* Main bullet - larger and more visible projectile */}
      <mesh 
        ref={bulletRef} 
        position={initialPos.current}
        rotation={[Math.PI/2, 0, 0]} // Rotated to align with flight direction
        userData={{ isBullet: true, owner }}
      >
        {/* Bullet is elongated with a pointed tip - increased size */}
        <cylinderGeometry args={[0.08, 0.12, 0.3, 8]} />
        <meshStandardMaterial 
          color="#f7d359" // More visible bright gold color
          emissive="#ff6a00" // Orange glow
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* Bullet base with bright color */}
      <mesh
        position={[
          initialPos.current.x,
          initialPos.current.y,
          initialPos.current.z - 0.15
        ]}
      >
        <cylinderGeometry args={[0.12, 0.12, 0.05, 8]} />
        <meshStandardMaterial 
          color="#ff3d00" // Bright orange-red
          emissive="#ff0000" // Red glow
          emissiveIntensity={0.7}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      {/* Enhanced smoke/fire trail */}
      <mesh
        position={[
          initialPos.current.x, 
          initialPos.current.y, 
          initialPos.current.z - 0.25
        ]}
      >
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial 
          color="#ff9d00" 
          emissive="#ff4500"
          emissiveIntensity={0.8}
          transparent={true}
          opacity={0.6}
        />
      </mesh>
      
      {/* Secondary smoke trail */}
      <mesh
        position={[
          initialPos.current.x, 
          initialPos.current.y, 
          initialPos.current.z - 0.4
        ]}
      >
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshStandardMaterial 
          color="#aaaaaa" 
          transparent={true}
          opacity={0.5}
        />
      </mesh>
      
      {/* Stronger glow/light */}
      <pointLight
        position={initialPos.current}
        color="#ff7700"
        intensity={1.5}
        distance={3}
        decay={2}
      />
    </group>
  );
};

export default Bullet;
