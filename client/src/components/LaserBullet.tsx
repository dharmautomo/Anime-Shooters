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
      {/* Main laser bullet - glowing core */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshBasicMaterial 
          color="#ff3333" 
          transparent 
          opacity={0.9}
          toneMapped={false}
        />
        
        {/* Add point light to make bullet glow */}
        <pointLight
          color="#ff0000"
          intensity={5}
          distance={3}
          decay={2}
        />
      </mesh>
      
      {/* Outer glow layer */}
      <mesh position={posRef.current.toArray()}>
        <sphereGeometry args={[0.25, 12, 12]} />
        <meshBasicMaterial 
          color="#ff6666" 
          transparent 
          opacity={0.4}
          toneMapped={false}
        />
      </mesh>
      
      {/* Laser trail */}
      <mesh ref={trailRef}>
        <cylinderGeometry args={[0.05, 0.18, 2.5, 8]} />
        <meshBasicMaterial 
          color="#ff6666" 
          transparent 
          opacity={0.7}
          toneMapped={false}
        />
      </mesh>
      
      {/* Small particles following the bullet */}
      {[...Array(3)].map((_, i) => (
        <mesh 
          key={i} 
          position={[
            posRef.current.x - velRef.current.normalize().x * (i * 0.2), 
            posRef.current.y - velRef.current.normalize().y * (i * 0.2), 
            posRef.current.z - velRef.current.normalize().z * (i * 0.2)
          ]}
        >
          <sphereGeometry args={[0.05 - (i * 0.01), 8, 8]} />
          <meshBasicMaterial 
            color="#ff9999" 
            transparent 
            opacity={0.5 - (i * 0.1)}
            toneMapped={false}
          />
        </mesh>
      ))}
    </>
  );
};

export default LaserBullet;