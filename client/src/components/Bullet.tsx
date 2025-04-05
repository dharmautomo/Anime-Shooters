import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayer, useMultiplayer } from '../lib/stores/initializeStores';

interface BulletProps {
  position: THREE.Vector3;
  direction: THREE.Vector3;
  bulletId: string;
  playerId: string;
  speed?: number;
  onHit?: () => void;
}

const Bullet = ({ position, direction, bulletId, playerId, speed = 30, onHit }: BulletProps) => {
  const bulletRef = useRef<THREE.Mesh>(null);
  const { otherPlayers } = useMultiplayer();
  const { playerId: localPlayerId, addScore } = usePlayer();
  const distanceTraveled = useRef(0);
  const lifespan = useRef(5); // Seconds before bullet disappears
  const hitDetected = useRef(false);
  
  // Initialize bullet
  useEffect(() => {
    if (bulletRef.current) {
      // Set initial position
      bulletRef.current.position.copy(position);
      
      // Log bullet creation
      console.log(`Bullet created: ${bulletId} by player ${playerId}`);
    }
    
    return () => {
      // Clean up any resources
      console.log(`Bullet removed: ${bulletId}`);
    };
  }, [bulletId, playerId, position]);
  
  // Update bullet position and check for collisions
  useFrame((_, delta) => {
    if (bulletRef.current && !hitDetected.current) {
      // Move bullet in direction
      const movement = direction.clone().multiplyScalar(speed * delta);
      bulletRef.current.position.add(movement);
      
      // Update distance traveled
      distanceTraveled.current += movement.length();
      
      // Update lifespan
      lifespan.current -= delta;
      
      // Delete bullet if it has lived too long
      if (lifespan.current <= 0) {
        hitDetected.current = true;
        if (onHit) onHit();
      }
      
      // Check for collisions with other players
      Object.values(otherPlayers).forEach((otherPlayer) => {
        // Skip if this is a bullet from the same player
        if (otherPlayer.id === playerId) return;
        
        // Create a bounding sphere for the bullet
        const bulletPosition = bulletRef.current!.position;
        const bulletRadius = 0.1;
        
        // Create a bounding box for the player (simplified)
        const playerPosition = new THREE.Vector3(
          otherPlayer.position.x,
          otherPlayer.position.y,
          otherPlayer.position.z
        );
        const playerRadius = 0.5; // Approximate player radius
        
        // Check distance between bullet and player
        const distance = bulletPosition.distanceTo(playerPosition);
        
        // If collision detected
        if (distance < (bulletRadius + playerRadius) && !hitDetected.current) {
          console.log(`Bullet ${bulletId} hit player ${otherPlayer.id}`);
          hitDetected.current = true;
          
          // If this is a local player's bullet, award points
          if (playerId === localPlayerId) {
            console.log('Score +1 for hit');
            addScore(1);
          }
          
          // Trigger hit effect
          if (onHit) onHit();
        }
      });
    }
  });
  
  // All bullets have the same smaller size now
  const bulletSize = 0.01;
  
  return (
    <mesh ref={bulletRef} castShadow>
      <sphereGeometry args={[bulletSize, 8, 8]} />
      <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
    </mesh>
  );
};

export default Bullet;