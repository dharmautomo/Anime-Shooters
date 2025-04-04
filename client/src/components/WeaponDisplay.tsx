import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useWeapons, WeaponType } from '../lib/stores/useWeapons';

interface WeaponDisplayProps {
  isVisible: boolean;
}

// Simple placeholder models for weapons
const WeaponModels = {
  [WeaponType.PISTOL]: (props: any) => (
    <group {...props} scale={0.15} position={[0.3, -0.3, -0.5]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1, 0.5, 2]} />
        <meshStandardMaterial color="#555555" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, -0.4, 0.5]}>
        <boxGeometry args={[0.8, 1, 0.5]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0, -1.2]}>
        <boxGeometry args={[0.5, 0.5, 1]} />
        <meshStandardMaterial color="#444444" />
      </mesh>
    </group>
  ),
  [WeaponType.RIFLE]: (props: any) => (
    <group {...props} scale={0.15} position={[0.3, -0.3, -0.6]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1, 0.6, 5]} />
        <meshStandardMaterial color="#444444" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, -0.5, 0.5]}>
        <boxGeometry args={[0.8, 1.5, 0.5]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.3, 1]}>
        <boxGeometry args={[0.8, 0.4, 2]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0, -3]}>
        <cylinderGeometry args={[0.25, 0.25, 1, 16]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
    </group>
  ),
  [WeaponType.SHOTGUN]: (props: any) => (
    <group {...props} scale={0.15} position={[0.3, -0.25, -0.5]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1, 0.6, 4]} />
        <meshStandardMaterial color="#5a3b22" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, -0.6, 0.5]}>
        <boxGeometry args={[0.8, 1.5, 0.7]} />
        <meshStandardMaterial color="#3a2a1a" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0, -2.5]}>
        <cylinderGeometry args={[0.4, 0.4, 1, 16]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
        <boxGeometry args={[0.8, 0.3, 3]} />
        <meshStandardMaterial color="#594333" />
      </mesh>
    </group>
  )
};

const WeaponDisplay = ({ isVisible }: WeaponDisplayProps) => {
  const { currentWeapon, weapons } = useWeapons();
  const weaponRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  
  // Animation states
  const recoilAnimation = useRef<{
    active: boolean;
    startTime: number;
    duration: number;
  }>({
    active: false,
    startTime: 0,
    duration: 100 // ms
  });
  
  const reloadAnimation = useRef<{
    active: boolean;
    startTime: number;
    duration: number;
  }>({
    active: false,
    startTime: 0,
    duration: 1000 // ms
  });
  
  // Track weapon state changes
  useEffect(() => {
    const weaponState = weapons[currentWeapon];
    
    if (weaponState.isReloading) {
      // Start reload animation
      reloadAnimation.current = {
        active: true,
        startTime: performance.now(),
        duration: 1000 // 1 second
      };
    }
  }, [weapons, currentWeapon]);
  
  // Position and animate weapon
  useFrame((_, delta) => {
    if (!weaponRef.current || !isVisible) return;
    
    const now = performance.now();
    const weaponState = weapons[currentWeapon];
    let offsetY = 0;
    let offsetZ = 0;
    let rotationX = 0;
    
    // Check for recoil (recent shot)
    const timeSinceLastShot = now - weaponState.lastFired;
    if (timeSinceLastShot < 150) {
      // Apply recoil
      const recoilProgress = Math.min(1, timeSinceLastShot / 150);
      offsetZ = 0.1 * (1 - recoilProgress);
      rotationX = -0.1 * (1 - recoilProgress);
    }
    
    // Check for reload animation
    if (weaponState.isReloading) {
      const reloadProgress = Math.min(1, (now - reloadAnimation.current.startTime) / reloadAnimation.current.duration);
      
      // Rotating reload animation
      const angle = Math.sin(reloadProgress * Math.PI) * 0.3;
      rotationX = angle;
      offsetY = Math.sin(reloadProgress * Math.PI) * -0.1;
    }
    
    // Apply walking animation
    const walkingOffset = Math.sin(now * 0.005) * 0.02;
    
    // Apply all transformations
    if (weaponRef.current) {
      // Base position attached to camera
      weaponRef.current.position.copy(
        new THREE.Vector3(0, -0.2 + walkingOffset + offsetY, -0.5 + offsetZ)
      );
      
      // Apply rotation
      weaponRef.current.rotation.x = rotationX;
    }
  });
  
  // Dynamically select weapon model based on current weapon
  const WeaponModel = WeaponModels[currentWeapon];
  
  if (!isVisible) return null;
  
  return (
    <group ref={weaponRef} position={[0, -0.2, -0.5]}>
      {/* Render the appropriate weapon model */}
      <WeaponModel />
    </group>
  );
};

export default WeaponDisplay;