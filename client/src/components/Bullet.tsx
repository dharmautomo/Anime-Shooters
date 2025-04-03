import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAudio } from '../lib/stores/useAudio';
import { useMultiplayer, usePlayer } from '../lib/stores/initializeStores';
import { checkCollision } from '../lib/utils/collisionDetection';
import { useIsMobile, usePerformanceSettings } from '../hooks/use-is-mobile';

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
  
  // Get device-specific performance settings
  const isMobile = useIsMobile();
  const { particleDetail } = usePerformanceSettings();
  
  // Calculate throttle rate for mobile optimization
  const collisionThrottleRate = isMobile ? 3 : 2; // Check collision less frequently on mobile
  const frameCounter = useRef(0);
  
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
  
  // Bullet settings - adjust for mobile
  const lifetime = useRef(isMobile ? 2500 : 3000); // Shorter lifetime on mobile
  const speed = isMobile ? 2.2 : 2.0; // Slightly faster on mobile so bullets don't stay on screen as long
  
  // Reduce logging on mobile devices
  const shouldLog = !isMobile || Math.random() < 0.001;
  
  // Minimal logging for debug - check bullet initialization
  useEffect(() => {
    if (shouldLog) {
      console.log(`Bullet initialized: ID ${bulletId.current}, owner: ${owner}`);
    }
  }, [owner, shouldLog]);
  
  // Set up bullet and play sound
  useEffect(() => {
    // Play shooting sound when bullet is created (only for bullets that are not owned by other players)
    if (owner === playerState.playerId) {
      try {
        playSound('gunshot');
      } catch (error) {
        console.error(`Error playing gunshot sound: ${error}`);
      }
    }
    
    // Start lifetime countdown
    const timeoutId = setTimeout(() => {
      try {
        multiplayerState.removeBullet(bulletId.current);
        if (shouldLog) {
          console.log(`Bullet ${bulletId.current} expired after ${lifetime.current}ms`);
        }
      } catch (error) {
        console.error(`Failed to remove expired bullet ${bulletId.current}:`, error);
      }
    }, lifetime.current);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [multiplayerState.removeBullet, owner, playerState.playerId, playSound, shouldLog]);
  
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
        
        // First smoke trail - only on non-mobile or high-end mobile
        if (trailElements[1]) {
          trailElements[1].position.set(
            basePosition.x, 
            basePosition.y, 
            basePosition.z - 0.25
          );
        }
        
        // Second smoke trail - only on non-mobile
        if (!isMobile && trailElements[2]) {
          trailElements[2].position.set(
            basePosition.x, 
            basePosition.y, 
            basePosition.z - 0.4
          );
        }
        
        // Point light
        if (trailElements[trailElements.length - 1]) {
          trailElements[trailElements.length - 1].position.copy(basePosition);
        }
      }
    }
  }, [initialPos, isMobile]);
  
  // Update bullet position each frame
  useFrame(() => {
    if (!bulletRef.current || !groupRef.current) return;
    
    // Count frames for throttling
    frameCounter.current = (frameCounter.current + 1) % collisionThrottleRate;
    
    // Move bullet in its velocity direction
    const movement = velocityVector.clone().multiplyScalar(speed);
    
    // Update bullet position
    bulletRef.current.position.add(movement);
    const currentPosition = bulletRef.current.position.clone();
    
    // Super occasional debug log - much less on mobile
    if (!isMobile && Math.random() < 0.001) {
      console.log(`Bullet ${bulletId.current} position:`, 
        currentPosition.x.toFixed(2),
        currentPosition.y.toFixed(2),
        currentPosition.z.toFixed(2)
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
    
    // Update first smoke trail position if it exists
    if (trailElements[1]) {
      trailElements[1].position.set(
        currentPosition.x, 
        currentPosition.y, 
        currentPosition.z - 0.25
      );
    }
    
    // Update second smoke trail position - skip on mobile
    if (!isMobile && trailElements[2]) {
      trailElements[2].position.set(
        currentPosition.x, 
        currentPosition.y, 
        currentPosition.z - 0.4
      );
    }
    
    // Update light position (always last element)
    const lightIndex = isMobile ? 2 : 3;
    if (trailElements[lightIndex]) {
      trailElements[lightIndex].position.copy(currentPosition);
    }
    
    // Check for collisions with players - throttle checks more aggressively on mobile
    if (frameCounter.current === 0) {
      try {
        const collision = multiplayerState.checkBulletCollision(
          currentPosition,
          owner
        );
        
        // If collision occurred, remove the bullet
        if (collision) {
          if (shouldLog) {
            console.log(`Bullet ${bulletId.current} collided`);
          }
          multiplayerState.removeBullet(bulletId.current);
        }
      } catch (error) {
        console.error(`Error checking bullet collision for ${bulletId.current}:`, error);
      }
    }
  });
  
  // Reduce geometry details based on device
  const cylinderSegments = isMobile ? 6 : 8;
  const sphereSegments = isMobile ? particleDetail : 12;
  
  return (
    <group ref={groupRef}>
      {/* Main bullet - larger and more visible projectile */}
      <mesh 
        ref={bulletRef} 
        position={initialPos}
        rotation={[Math.PI/2, 0, 0]} // Rotated to align with flight direction
        userData={{ isBullet: true, owner, id: bulletId.current }}
      >
        {/* Bullet is elongated with a pointed tip - optimized for mobile */}
        <cylinderGeometry args={[0.08, 0.12, 0.3, cylinderSegments]} />
        <meshStandardMaterial 
          color="#f7d359" // More visible bright gold color
          emissive="#ff6a00" // Orange glow
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
          fog={false} // Disable fog for better performance
          flatShading={isMobile} // Use flat shading on mobile
        />
      </mesh>
      
      {/* Bullet base with bright color */}
      <mesh>
        <cylinderGeometry args={[0.12, 0.12, 0.05, cylinderSegments]} />
        <meshStandardMaterial 
          color="#ff3d00" // Bright orange-red
          emissive="#ff0000" // Red glow
          emissiveIntensity={0.7}
          metalness={0.9}
          roughness={0.1}
          fog={false}
          flatShading={isMobile}
        />
      </mesh>
      
      {/* Enhanced smoke/fire trail - only one trail on mobile */}
      <mesh>
        <sphereGeometry args={[0.15, sphereSegments, sphereSegments]} />
        <meshStandardMaterial 
          color="#ff9d00" 
          emissive="#ff4500"
          emissiveIntensity={0.8}
          transparent={true}
          opacity={0.6}
          fog={false}
          flatShading={isMobile}
        />
      </mesh>
      
      {/* Secondary smoke trail - only on desktop */}
      {!isMobile && (
        <mesh>
          <sphereGeometry args={[0.12, sphereSegments, sphereSegments]} />
          <meshStandardMaterial 
            color="#aaaaaa" 
            transparent={true}
            opacity={0.5}
            fog={false}
          />
        </mesh>
      )}
      
      {/* Optimized glow/light - use different intensity based on device */}
      <pointLight
        color="#ff7700"
        intensity={isMobile ? 1.0 : 1.5}
        distance={isMobile ? 2 : 3}
        decay={2}
      />
    </group>
  );
};

export default Bullet;
