import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWeapon, WeaponType } from '../lib/stores/initializeStores';
import { usePlayer, useMultiplayer } from '../lib/stores/initializeStores';

interface BulletProps {
  position: [number, number, number];
  direction: THREE.Vector3;
  speed?: number;
  owner: string;
  bulletId: string;
  onHit?: (position: THREE.Vector3, normal: THREE.Vector3) => void;
  onComplete?: () => void;
}

const Bullet: React.FC<BulletProps> = ({
  position,
  direction,
  speed = 1,
  owner,
  bulletId,
  onHit,
  onComplete,
}: BulletProps) => {
  const bulletRef = useRef<THREE.Mesh>(null);
  const bulletInitialPos = useRef(new THREE.Vector3(...position));
  const bulletDirection = useRef(new THREE.Vector3().copy(direction));
  const creationTime = useRef(Date.now());
  const maxDistance = 100; // Maximum travel distance
  const bulletSize = 0.05; // Bullet radius
  
  // Get other players positions for collision detection
  const { otherPlayers } = useMultiplayer();
  const { playerId, position: playerPosition, health } = usePlayer();
  const { processBulletHit, removeBullet } = useWeapon();
  
  // Handle bullet movement and collision detection
  useFrame((state, delta) => {
    if (!bulletRef.current) return;
    
    // Don't process bullets from self-shooting
    if (owner === playerId && bulletRef.current.position.distanceTo(playerPosition) < 2) {
      return;
    }
    
    // Move bullet in its direction
    const moveAmount = speed * delta * 50; // Speed factor
    bulletRef.current.position.add(
      bulletDirection.current.clone().multiplyScalar(moveAmount)
    );
    
    // Check if bullet has traveled too far or too long (5 seconds max lifetime)
    const distanceTraveled = bulletRef.current.position.distanceTo(bulletInitialPos.current);
    const timeAlive = Date.now() - creationTime.current;
    
    if (distanceTraveled > maxDistance || timeAlive > 5000) {
      // Clean up the bullet
      if (onComplete) onComplete();
      removeBullet(bulletId);
      return;
    }
    
    // Perform collision detection with other players
    // Only check if we're the owner of the bullet
    if (owner === playerId) {
      // Check collisions with other players
      for (const otherPlayerId in otherPlayers) {
        const otherPlayer = otherPlayers[otherPlayerId];
        
        // Skip if player is already dead
        if (otherPlayer.health <= 0) continue;
        
        const playerPos = new THREE.Vector3(
          otherPlayer.position.x,
          otherPlayer.position.y + 1, // Aim at center mass
          otherPlayer.position.z
        );
        
        // Simple sphere collision detection
        const hitDistance = bulletRef.current.position.distanceTo(playerPos);
        if (hitDistance < 1.0) { // Player hit box size
          // Handle player hit
          const hitPosition = bulletRef.current.position.clone();
          const hitNormal = new THREE.Vector3().subVectors(hitPosition, playerPos).normalize();
          
          // Process hit in weapon store
          processBulletHit(bulletId, hitPosition, otherPlayerId);
          
          if (onHit) onHit(hitPosition, hitNormal);
          return;
        }
      }
    } else if (health > 0) {
      // We didn't fire this bullet, check if it hits us
      const ourPosition = new THREE.Vector3(
        playerPosition.x,
        playerPosition.y + 1, // Aim at center mass
        playerPosition.z
      );
      
      const hitDistance = bulletRef.current.position.distanceTo(ourPosition);
      if (hitDistance < 1.0) { // Player hit box size
        // We got hit
        const hitPosition = bulletRef.current.position.clone();
        
        // Let the server handle the rest via game state updates
        removeBullet(bulletId);
        return;
      }
    }
    
    // Simple ground collision detection
    if (bulletRef.current.position.y < 0.1) {
      const hitPosition = bulletRef.current.position.clone();
      hitPosition.y = 0;
      const hitNormal = new THREE.Vector3(0, 1, 0);
      
      // Process the hit with the ground
      processBulletHit(bulletId, hitPosition);
      
      if (onHit) onHit(hitPosition, hitNormal);
      return;
    }
    
    // More complex environment collision could be added here
  });
  
  return (
    <mesh
      ref={bulletRef}
      position={position}
    >
      {/* Different bullet appearance based on weapon type */}
      <sphereGeometry args={[bulletSize, 8, 8]} />
      <meshBasicMaterial color="#ffff00" />
    </mesh>
  );
};

export default Bullet;