import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useWeapon, WeaponType } from '../lib/stores/initializeStores';
import { useKeyboardControls } from '@react-three/drei';
import { Controls } from '../App';

interface WeaponProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  isThirdPerson?: boolean;
  scale?: number;
}

const Weapon: React.FC<WeaponProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  isThirdPerson = false,
  scale = 1,
}: WeaponProps) => {
  const weaponRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  
  // Get weapon state
  const {
    currentWeapon,
    ammo,
    totalAmmo,
    isReloading,
    isShooting,
    shootWeapon,
    reloadWeapon,
    finishReload
  } = useWeapon();
  
  // Track reload animation
  const [reloadAnimation, setReloadAnimation] = useState(false);
  
  // Track automatic weapon firing
  const isAutoFiringRef = useRef(false);
  
  // Handle weapon reloading animations
  useEffect(() => {
    if (isReloading && !reloadAnimation) {
      // Start reload animation
      setReloadAnimation(true);
      
      // Complete reload after animation time
      const reloadTimer = setTimeout(() => {
        finishReload();
        setReloadAnimation(false);
      }, currentWeapon.reloadTime * 1000);
      
      return () => clearTimeout(reloadTimer);
    }
  }, [isReloading, reloadAnimation, currentWeapon.reloadTime, finishReload]);
  
  // Handle weapon movement animations (bobbing while walking, recoil, etc.)
  useFrame((state, delta) => {
    if (weaponRef.current && !isThirdPerson) {
      // Weapon bob effect simulating walking
      const t = state.clock.getElapsedTime();
      
      if (!isReloading) {
        // Normal idle/walking animation
        weaponRef.current.position.y = position[1] + Math.sin(t * 2) * 0.01;
        weaponRef.current.position.x = position[0] + Math.sin(t * 1) * 0.005;
        
        // Reset rotation smoothly back to normal if not in reload animation
        weaponRef.current.rotation.x = THREE.MathUtils.lerp(
          weaponRef.current.rotation.x, 
          rotation[0], 
          delta * 5
        );
      } else {
        // Reload animation
        const reloadProgress = (state.clock.getElapsedTime() % currentWeapon.reloadTime) / currentWeapon.reloadTime;
        
        // Tilt the gun down during reload, then back up
        if (reloadProgress < 0.5) {
          // First half of animation - tilt down
          weaponRef.current.rotation.x = THREE.MathUtils.lerp(
            rotation[0],
            rotation[0] + 0.5,
            reloadProgress * 2
          );
        } else {
          // Second half - tilt back up
          weaponRef.current.rotation.x = THREE.MathUtils.lerp(
            rotation[0] + 0.5,
            rotation[0],
            (reloadProgress - 0.5) * 2
          );
        }
      }
      
      // Shooting recoil effect
      if (isShooting) {
        // Temporary recoil
        weaponRef.current.position.z = position[2] + 0.05;
        weaponRef.current.rotation.x = rotation[0] - 0.1;
        
        // Gradually return to normal position
        setTimeout(() => {
          if (weaponRef.current) {
            weaponRef.current.position.z = THREE.MathUtils.lerp(
              weaponRef.current.position.z,
              position[2],
              0.5
            );
          }
        }, 50);
      }
    }
  });
  
  // Handle reload key press
  const [subscribeKeys, getKeys] = useKeyboardControls();
  
  useEffect(() => {
    // Subscribe to reload key
    const unsubscribeReload = subscribeKeys(
      (state) => state[Controls.reload],
      (pressed) => {
        if (pressed) reloadWeapon();
      }
    );
    
    // Subscribe to shoot key
    const unsubscribeShoot = subscribeKeys(
      (state) => state[Controls.shoot],
      (pressed) => {
        // Handle single fire weapons
        if (pressed && !currentWeapon.automatic) {
          shootWeapon();
        }
        
        // Handle automatic weapons
        if (currentWeapon.automatic) {
          if (pressed) {
            // Start automatic firing
            isAutoFiringRef.current = true;
            
            // Create a function to continuously fire
            const autoFire = () => {
              if (isAutoFiringRef.current) {
                shootWeapon();
                // Continue firing at weapon's fire rate
                setTimeout(autoFire, 1000 / currentWeapon.fireRate);
              }
            };
            
            // Start the auto-fire sequence
            autoFire();
          } else {
            // Stop automatic firing
            isAutoFiringRef.current = false;
          }
        }
      }
    );
    
    // If we're not in first person, we need to listen for mouse clicks for third person shooting
    if (isThirdPerson) {
      const handleMouseDown = () => {
        if (!isThirdPerson) return;
        shootWeapon();
      };
      
      document.addEventListener('mousedown', handleMouseDown);
      
      return () => {
        unsubscribeReload();
        unsubscribeShoot();
        document.removeEventListener('mousedown', handleMouseDown);
      };
    }
    
    return () => {
      unsubscribeReload();
      unsubscribeShoot();
    };
  }, [currentWeapon.automatic, currentWeapon.fireRate, isThirdPerson, reloadWeapon, shootWeapon, subscribeKeys]);
  
  // Simple weapon models based on weapon type
  const renderWeaponModel = () => {
    switch(currentWeapon.type) {
      case WeaponType.Pistol:
        return (
          <>
            <mesh position={[0, 0, -0.3]}>
              <boxGeometry args={[0.1, 0.1, 0.2]} />
              <meshStandardMaterial color="#222" />
            </mesh>
            <mesh position={[0, -0.07, -0.15]}>
              <boxGeometry args={[0.08, 0.15, 0.1]} />
              <meshStandardMaterial color="#111" />
            </mesh>
            <mesh position={[0, 0, -0.05]}>
              <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
              <meshStandardMaterial color="#333" />
            </mesh>
          </>
        );
        
      case WeaponType.Rifle:
        return (
          <>
            <mesh position={[0, 0, -0.5]}>
              <boxGeometry args={[0.1, 0.1, 0.6]} />
              <meshStandardMaterial color="#444" />
            </mesh>
            <mesh position={[0, -0.1, -0.3]}>
              <boxGeometry args={[0.08, 0.2, 0.15]} />
              <meshStandardMaterial color="#222" />
            </mesh>
            <mesh position={[0, 0, -0.1]}>
              <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
              <meshStandardMaterial color="#333" />
            </mesh>
            <mesh position={[0, 0.05, -0.7]}>
              <boxGeometry args={[0.05, 0.05, 0.2]} />
              <meshStandardMaterial color="#333" />
            </mesh>
          </>
        );
        
      case WeaponType.Shotgun:
        return (
          <>
            <mesh position={[0, 0, -0.4]}>
              <boxGeometry args={[0.12, 0.12, 0.5]} />
              <meshStandardMaterial color="#654321" />
            </mesh>
            <mesh position={[0, -0.1, -0.25]}>
              <boxGeometry args={[0.1, 0.2, 0.15]} />
              <meshStandardMaterial color="#8b4513" />
            </mesh>
            <mesh position={[0, 0, -0.05]}>
              <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
              <meshStandardMaterial color="#111" />
            </mesh>
            <mesh position={[0, 0.07, -0.3]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
              <meshStandardMaterial color="#111" />
            </mesh>
          </>
        );
        
      default:
        return (
          <mesh>
            <boxGeometry args={[0.1, 0.1, 0.3]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        );
    }
  };
  
  return (
    <group 
      ref={weaponRef}
      position={position}
      rotation={rotation}
      scale={scale}
    >
      {/* Basic weapon model */}
      {renderWeaponModel()}
      
      {/* Muzzle flash during shooting (visible briefly) */}
      {isShooting && (
        <mesh position={[0, 0, -0.9]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#ffff00" />
        </mesh>
      )}
    </group>
  );
};

export default Weapon;