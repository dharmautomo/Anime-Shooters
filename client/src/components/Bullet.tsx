import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Trail } from '@react-three/drei';
import { useAudio } from '../lib/stores/useAudio';

interface BulletProps {
  position: THREE.Vector3;
  direction: THREE.Vector3;
  speed?: number;
  lifetime?: number; // in seconds
  onHit?: (position: THREE.Vector3, normal: THREE.Vector3) => void;
}

const Bullet: React.FC<BulletProps> = ({
  position,
  direction,
  speed = 75, // Increased speed for better feel
  lifetime = 1.5,
  onHit
}) => {
  const bulletRef = useRef<THREE.Mesh>(null);
  const [isDead, setIsDead] = useState(false);
  const startTime = useRef(Date.now());
  const { createPositionalSound } = useAudio();
  
  // Create normalized direction vector and store in ref for performance
  const directionRef = useRef(direction.clone().normalize());
  
  // Store original position for distance calculation
  const originalPosition = useRef(position.clone());
  
  // Simple raycaster for collision detection
  const raycaster = useRef(new THREE.Raycaster(
    position.clone(),
    directionRef.current,
    0,
    0.5 // Only check short distance ahead of bullet
  ));
  
  useFrame((state, delta) => {
    if (isDead || !bulletRef.current) return;
    
    // Check if bullet has exceeded lifetime
    const now = Date.now();
    const elapsedTime = (now - startTime.current) / 1000; // convert to seconds
    
    if (elapsedTime > lifetime) {
      setIsDead(true);
      return;
    }
    
    // Move bullet forward
    const moveAmount = speed * delta;
    const movement = directionRef.current.clone().multiplyScalar(moveAmount);
    bulletRef.current.position.add(movement);
    
    // Update raycaster position and direction
    raycaster.current.set(
      bulletRef.current.position.clone(),
      directionRef.current
    );
    
    // Get a list of objects the bullet could hit (ideally from a scene colliders array)
    // For now, just check ground collision
    if (bulletRef.current.position.y <= 0.05) {
      // Hit the ground
      bulletRef.current.position.y = 0.05; // prevent going below ground
      
      if (onHit) {
        // Create a normal vector pointing up for ground impact
        const normal = new THREE.Vector3(0, 1, 0);
        onHit(bulletRef.current.position.clone(), normal);
      }
      
      // Play impact sound when bullet hits something
      const impactSound = createPositionalSound(
        '/sounds/hit.mp3',
        bulletRef.current.position.clone(),
        0.2 // Lower volume for impact
      );
      
      if (impactSound) {
        impactSound.play();
      }
      
      setIsDead(true);
    }
    
    // Check if we've gone too far (optional limit on bullet travel distance)
    const distance = bulletRef.current.position.distanceTo(originalPosition.current);
    if (distance > 100) { // Max distance of 100 units
      setIsDead(true);
    }
  });
  
  // When bullet is "dead" (hit something or expired), clean up
  useEffect(() => {
    if (isDead) {
      // Could trigger any other cleanup or effects here
      const timeout = setTimeout(() => {
        // Component will be removed by parent when isDead is true
      }, 100);
      
      return () => clearTimeout(timeout);
    }
  }, [isDead]);
  
  if (isDead) return null;
  
  return (
    <group>
      {/* Bullet mesh - smaller size makes it look faster and more like a real bullet */}
      <mesh ref={bulletRef} position={position.clone()}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#ffff00" emissive="#ff8800" emissiveIntensity={3} />
        
        {/* Improved tracer/trail effect */}
        <Trail
          width={0.08}
          length={10}
          color="#ff8800"
          attenuation={(width) => width * 2}
          local={false}
        />
      </mesh>
    </group>
  );
};

export default Bullet;