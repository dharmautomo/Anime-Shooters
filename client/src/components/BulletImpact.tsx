import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BulletImpactProps {
  position: THREE.Vector3;
  normal: THREE.Vector3;
  type?: 'ground' | 'wall' | 'player';
  lifetime?: number; // in seconds
}

const BulletImpact: React.FC<BulletImpactProps> = ({
  position,
  normal,
  type = 'ground',
  lifetime = 1.2  // Increased lifetime for better visibility
}) => {
  const [isDead, setIsDead] = useState(false);
  const startTime = useRef(Date.now());
  const particlesRef = useRef<THREE.Points>(null);
  const decalRef = useRef<THREE.Mesh>(null);
  const sparkRef = useRef<THREE.Mesh>(null);
  
  // Calculate a rotation that aligns with the impact normal
  const getQuaternionFromNormal = (normal: THREE.Vector3): THREE.Quaternion => {
    // Create a quaternion that rotates the default "up" vector to match the normal
    const upVector = new THREE.Vector3(0, 1, 0);
    
    // If the normal is too similar to the up vector, use a different reference
    if (normal.dot(upVector) > 0.99) {
      return new THREE.Quaternion(); // Default rotation (identity)
    }
    
    // Create quaternion from the rotation between up vector and normal
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(upVector, normal);
    return quaternion;
  };
  
  // Generate particles for impact effect
  const createParticles = () => {
    const particleCount = 30; // Increased particle count for better effect
    const particles = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);
    const particleColors = new Float32Array(particleCount * 3);
    
    // Calculate particle positions
    for (let i = 0; i < particleCount; i++) {
      // Calculate random displacement for particles to spread out from impact
      const randomOffset = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      );
      
      // Ensure particles mainly go in the direction of the normal (ricochet effect)
      randomOffset.add(normal.clone().multiplyScalar(0.2));
      
      // Position
      particles[i * 3] = randomOffset.x;
      particles[i * 3 + 1] = randomOffset.y;
      particles[i * 3 + 2] = randomOffset.z;
      
      // Size (random between 0.02 and 0.06) - smaller particles look better
      particleSizes[i] = 0.02 + Math.random() * 0.04;
      
      // Color - use different colors based on surface type
      let r = 0.8, g = 0.8, b = 0.8; // Default: white/gray (wall)
      
      if (type === 'ground') {
        r = 0.6; g = 0.5; b = 0.4; // Brown for ground
      } else if (type === 'player') {
        r = 0.8; g = 0.1; b = 0.1; // Red for player hits
      }
      
      // Add some yellow/orange sparks for all impacts
      if (Math.random() > 0.5) {
        r = 1.0; g = 0.6; b = 0.0; // Yellow-orange for sparks
      }
      
      // Add randomness to colors
      r += (Math.random() - 0.5) * 0.2;
      g += (Math.random() - 0.5) * 0.2;
      b += (Math.random() - 0.5) * 0.2;
      
      particleColors[i * 3] = r;
      particleColors[i * 3 + 1] = g;
      particleColors[i * 3 + 2] = b;
    }
    
    return { positions: particles, sizes: particleSizes, colors: particleColors };
  };
  
  // Generate particle properties
  const particleData = useRef(createParticles());
  
  useFrame((state, delta) => {
    if (isDead) return;
    
    // Check lifetime
    const now = Date.now();
    const elapsedTime = (now - startTime.current) / 1000;
    
    if (elapsedTime > lifetime) {
      setIsDead(true);
      return;
    }
    
    // Update particles - move them outward and fade over time
    if (particlesRef.current) {
      const particles = particlesRef.current;
      
      // Scale particles as they age - faster growth at start, slower at end
      const progress = elapsedTime / lifetime;
      particles.scale.set(
        1 + progress * 3, 
        1 + progress * 3, 
        1 + progress * 3
      );
      
      // Fade particles by changing opacity - faster fade at end
      const material = particles.material as THREE.PointsMaterial;
      material.opacity = Math.max(0, 1 - (progress * 1.5));
    }
    
    // Update flash/spark effect - very quick bright flash at the beginning
    if (sparkRef.current) {
      const flashDuration = 0.15; // Very brief flash
      const material = sparkRef.current.material as THREE.MeshBasicMaterial;
      
      if (elapsedTime < flashDuration) {
        // Flash quickly grows and fades
        const flashProgress = elapsedTime / flashDuration;
        sparkRef.current.scale.set(
          1 + flashProgress * 2,
          1 + flashProgress * 2,
          1 + flashProgress * 2
        );
        material.opacity = Math.max(0, 1 - (flashProgress * 2)); 
      } else {
        // Hide after flash duration
        material.opacity = 0;
      }
    }
    
    // Fade decal (bullet hole)
    if (decalRef.current) {
      const material = decalRef.current.material as THREE.MeshBasicMaterial;
      // Fade in quickly, then fade out slowly
      const fadeInDuration = 0.08;
      
      if (elapsedTime < fadeInDuration) {
        // Very quick fade in
        material.opacity = elapsedTime / fadeInDuration;
      } else {
        // Slower fade out for the rest of the lifetime
        material.opacity = 1 - ((elapsedTime - fadeInDuration) / (lifetime - fadeInDuration));
      }
    }
  });
  
  // Cleanup when impact effect is done
  useEffect(() => {
    if (isDead) {
      const timeout = setTimeout(() => {
        // Component will be unmounted when parent sees isDead
      }, 100);
      
      return () => clearTimeout(timeout);
    }
  }, [isDead]);
  
  if (isDead) return null;
  
  // Calculate orientation based on normal
  const quaternion = getQuaternionFromNormal(normal);
  
  // Get impact colors based on surface type
  const getImpactColors = () => {
    switch(type) {
      case 'player':
        return { 
          particles: '#ff0000',
          decal: '#880000',
          spark: '#ff6666'
        };
      case 'wall':
        return {
          particles: '#cccccc',
          decal: '#555555',
          spark: '#ffffff'
        };
      case 'ground':
      default:
        return {
          particles: '#bbaa88',
          decal: '#665544',
          spark: '#ffcc88'
        };
    }
  };
  
  const colors = getImpactColors();
  
  return (
    <group position={position}>
      {/* Initial flash/spark at impact point */}
      <mesh 
        ref={sparkRef}
        position={normal.clone().multiplyScalar(0.02)}
        quaternion={quaternion}
      >
        <circleGeometry args={[0.1, 16]} />
        <meshBasicMaterial 
          color={colors.spark}
          transparent 
          opacity={1}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Particles for impact effect */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleData.current.positions.length / 3}
            array={particleData.current.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={particleData.current.colors.length / 3}
            array={particleData.current.colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          vertexColors
          transparent
          opacity={1}
          depthWrite={false}
          sizeAttenuation={true}
        />
      </points>
      
      {/* Decal for bullet hole */}
      <mesh 
        ref={decalRef} 
        position={normal.clone().multiplyScalar(0.01)} // Slight offset to prevent z-fighting
        quaternion={quaternion}
      >
        <circleGeometry args={[0.05, 16]} />
        <meshBasicMaterial 
          color={colors.decal}
          transparent 
          opacity={0}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

export default BulletImpact;