import { useRef, useEffect, useMemo } from 'react';
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
  const groupRef = useRef<THREE.Group>(null);
  const collisionChecked = useRef<boolean>(false);
  
  // Convert position and velocity to Vector3 if they aren't already
  const initialPos = useMemo(() => {
    return position instanceof THREE.Vector3 
      ? new THREE.Vector3().copy(position) 
      : new THREE.Vector3(position[0], position[1], position[2]);
  }, [position]);
  
  const velocityVector = useMemo(() => {
    return velocity instanceof THREE.Vector3 
      ? new THREE.Vector3().copy(velocity) 
      : new THREE.Vector3(velocity[0], velocity[1], velocity[2]);
  }, [velocity]);
  
  // Get necessary functions from stores
  const multiplayerState = useMultiplayer(state => ({
    checkBulletCollision: state.checkBulletCollision,
    removeBullet: state.removeBullet
  }));
  const playerState = usePlayer(state => ({
    playerId: state.playerId
  }));
  const { playSound } = useAudio();
  
  // Bullet settings
  const lifetime = useRef(3000); // 3 seconds
  const speed = 2.0; // Slightly reduced speed to make bullets more visible
  
  // Logging for debug - check bullet initialization
  useEffect(() => {
    console.log(`Bullet initialized: ID ${bulletId.current}, owner: ${owner}, position:`, initialPos);
  }, [owner, initialPos]);
  
  // Set up bullet and play sound
  useEffect(() => {
    // Play shooting sound when bullet is created (only for bullets that are not owned by other players)
    if (owner === playerState.playerId) {
      // Use direct Web Audio API for more reliable sound
      console.log(`Owner's bullet - playing gunshot sound for bullet ${bulletId.current}`);
      try {
        playSound('gunshot');
      } catch (error) {
        console.error(`Error playing gunshot sound: ${error}`);
      }
    }
    
    // Start lifetime countdown
    const timeoutId = setTimeout(() => {
      // Use the stored bullet ID for removing
      console.log(`Bullet with ID ${bulletId.current} expired after ${lifetime.current}ms and will be removed`);
      try {
        multiplayerState.removeBullet(bulletId.current);
      } catch (error) {
        console.error(`Failed to remove expired bullet ${bulletId.current}:`, error);
      }
    }, lifetime.current);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [multiplayerState.removeBullet, owner, playerState.playerId, playSound]);
  
  // Set up the initial position of all bullet elements
  useEffect(() => {
    if (groupRef.current) {
      // Set initial position for all items in the group
      const basePosition = initialPos.clone();
      // Position the main bullet
      if (bulletRef.current) {
        bulletRef.current.position.copy(basePosition);
      }
      
      // Update trail positions based on the base position
      if (groupRef.current.children.length > 1) {
        const trailElements = groupRef.current.children.slice(1); // Skip the main bullet
        
        // Bullet base
        if (trailElements[0]) {
          trailElements[0].position.set(
            basePosition.x, 
            basePosition.y, 
            basePosition.z - 0.15
          );
        }
        
        // First smoke trail
        if (trailElements[1]) {
          trailElements[1].position.set(
            basePosition.x, 
            basePosition.y, 
            basePosition.z - 0.25
          );
        }
        
        // Second smoke trail
        if (trailElements[2]) {
          trailElements[2].position.set(
            basePosition.x, 
            basePosition.y, 
            basePosition.z - 0.4
          );
        }
        
        // Point light
        if (trailElements[3]) {
          trailElements[3].position.copy(basePosition);
        }
      }
    }
  }, [initialPos]);
  
  // Update bullet position each frame
  useFrame(() => {
    if (!bulletRef.current || !groupRef.current) return;
    
    // Move bullet in its velocity direction
    const movement = velocityVector.clone().multiplyScalar(speed);
    
    // Update bullet position
    bulletRef.current.position.add(movement);
    const currentPosition = bulletRef.current.position.clone();
    
    // Occasional debug log
    if (Math.random() < 0.005) { // Reduced frequency to 0.5% to avoid console spam
      console.log(`Bullet ${bulletId.current} position:`, 
        currentPosition.x,
        currentPosition.y,
        currentPosition.z
      );
    }
    
    // Update the position of all bullet parts to match the main bullet
    const trailElements = groupRef.current.children.slice(1); // Skip the main bullet
    
    // Update bullet base position
    if (trailElements[0]) {
      trailElements[0].position.set(
        currentPosition.x, 
        currentPosition.y, 
        currentPosition.z - 0.15
      );
    }
    
    // Update first smoke trail position
    if (trailElements[1]) {
      trailElements[1].position.set(
        currentPosition.x, 
        currentPosition.y, 
        currentPosition.z - 0.25
      );
    }
    
    // Update second smoke trail position
    if (trailElements[2]) {
      trailElements[2].position.set(
        currentPosition.x, 
        currentPosition.y, 
        currentPosition.z - 0.4
      );
    }
    
    // Update light position
    if (trailElements[3]) {
      trailElements[3].position.copy(currentPosition);
    }
    
    // Check for collisions with players - throttle checks to every other frame
    if (!collisionChecked.current) {
      try {
        const collision = multiplayerState.checkBulletCollision(
          currentPosition,
          owner
        );
        
        // If collision occurred, remove the bullet
        if (collision) {
          console.log(`Bullet with ID ${bulletId.current} collided and will be removed`);
          multiplayerState.removeBullet(bulletId.current);
        }
      } catch (error) {
        console.error(`Error checking bullet collision for ${bulletId.current}:`, error);
      }
      
      // Toggle the flag
      collisionChecked.current = true;
    } else {
      // Reset the flag for the next frame
      collisionChecked.current = false;
    }
  });
  
  return (
    <group ref={groupRef}>
      {/* Main bullet - larger and more visible projectile */}
      <mesh 
        ref={bulletRef} 
        position={initialPos}
        rotation={[Math.PI/2, 0, 0]} // Rotated to align with flight direction
        userData={{ isBullet: true, owner, id: bulletId.current }}
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
      <mesh>
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
      <mesh>
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
      <mesh>
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshStandardMaterial 
          color="#aaaaaa" 
          transparent={true}
          opacity={0.5}
        />
      </mesh>
      
      {/* Stronger glow/light */}
      <pointLight
        color="#ff7700"
        intensity={1.5}
        distance={3}
        decay={2}
      />
    </group>
  );
};

export default Bullet;
