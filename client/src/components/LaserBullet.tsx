import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface LaserBulletProps {
  position: THREE.Vector3 | [number, number, number];
  velocity: THREE.Vector3 | [number, number, number];
  owner: string;
  id?: string;
}

const LaserBullet = ({ position, velocity, owner, id }: LaserBulletProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Mesh>(null);
  const posRef = useRef(position instanceof THREE.Vector3 ? position.clone() : new THREE.Vector3(...position));
  const velRef = useRef(velocity instanceof THREE.Vector3 ? velocity.clone() : new THREE.Vector3(...velocity));
  const startTimeRef = useRef(Date.now());
  const MAX_LIFETIME = 2000; // 2 seconds
  
  // Normalize velocity for consistent speed
  useEffect(() => {
    const velocity = velRef.current;
    const speed = 30; // Fast laser speed
    velocity.normalize().multiplyScalar(speed);
  }, []);
  
  // Movement and lifetime management
  useFrame((_, delta) => {
    if (!meshRef.current || !trailRef.current) return;
    
    // Update position
    const velocity = velRef.current;
    const position = posRef.current;
    
    position.add(velocity.clone().multiplyScalar(delta));
    
    // Apply to mesh
    meshRef.current.position.copy(position);
    
    // Update trail position
    if (trailRef.current) {
      trailRef.current.position.copy(position);
      
      // Point trail in direction of movement
      const direction = velocity.clone().normalize();
      trailRef.current.lookAt(position.clone().add(direction));
      
      // Adjust trail scale for better visual effect
      trailRef.current.scale.z = 1 + Math.sin(Date.now() * 0.01) * 0.2;
    }
    
    // Fade out as it reaches end of lifetime
    const age = Date.now() - startTimeRef.current;
    const lifePercentage = age / MAX_LIFETIME;
    
    if (lifePercentage > 0.7) {
      const opacity = 1 - ((lifePercentage - 0.7) / 0.3);
      
      // Apply to material
      const material = meshRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0, opacity);
      
      if (trailRef.current) {
        const trailMaterial = trailRef.current.material as THREE.MeshBasicMaterial;
        trailMaterial.opacity = Math.max(0, opacity);
      }
    }
  });
  
  return (
    <>
      {/* Main laser bullet */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial 
          color="#ff3333" 
          transparent 
          opacity={0.9}
        />
      </mesh>
      
      {/* Laser trail */}
      <mesh ref={trailRef}>
        <cylinderGeometry args={[0.05, 0.15, 1.5, 8]} />
        <meshBasicMaterial 
          color="#ff6666" 
          transparent 
          opacity={0.7}
        />
      </mesh>
    </>
  );
};

export default LaserBullet;