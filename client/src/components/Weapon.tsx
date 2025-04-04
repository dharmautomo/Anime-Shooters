import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useWeapon, WeaponType } from '../lib/stores/initializeStores';
import { useKeyboardControls } from '@react-three/drei';
import { Controls, ControlsType } from '../App';

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
  
  // Create a mapping of control keys to their index in the keymap for type safety
  // This is necessary because useKeyboardControls expects numeric indexes
  const controlMap = {
    forward: 0,
    backward: 1,
    left: 2,
    right: 3,
    jump: 4,
    shoot: 5,
    reload: 6,
    sprint: 7,
    weaponSlot1: 8,
    weaponSlot2: 9,
    weaponSlot3: 10
  };
  
  // Check if player is sprinting
  const isSprinting = useKeyboardControls((state) => Boolean(state[controlMap.sprint]));
  
  // Check if player is moving
  const isMovingForward = useKeyboardControls((state) => Boolean(state[controlMap.forward]));
  const isMovingBackward = useKeyboardControls((state) => Boolean(state[controlMap.backward]));
  const isMovingLeft = useKeyboardControls((state) => Boolean(state[controlMap.left]));
  const isMovingRight = useKeyboardControls((state) => Boolean(state[controlMap.right]));
  const isMoving = isMovingForward || isMovingBackward || isMovingLeft || isMovingRight;
  
  // Handle weapon movement animations (bobbing while walking, recoil, etc.)
  useFrame((state, delta) => {
    if (weaponRef.current && !isThirdPerson) {
      // Weapon bob effect simulating walking
      const t = state.clock.getElapsedTime();
      
      if (isReloading) {
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
        
        // Add slight horizontal movement during reload
        weaponRef.current.rotation.z = Math.sin(t * 5) * 0.03;
      } else if (isSprinting && isMoving) {
        // Sprinting animation - lower weapon position
        weaponRef.current.position.y = THREE.MathUtils.lerp(
          weaponRef.current.position.y,
          position[1] - 0.15, // Lower the weapon
          delta * 10
        );
        
        // Tilt weapon forward when sprinting
        weaponRef.current.rotation.x = THREE.MathUtils.lerp(
          weaponRef.current.rotation.x,
          rotation[0] + 0.7, // Tilt forward
          delta * 8
        );
        
        // Add more intense swaying when sprinting
        const sprintBobIntensity = 0.02;
        weaponRef.current.position.x = position[0] + Math.sin(t * 10) * sprintBobIntensity;
        
        // Slightly rotate when sprinting to simulate arm movement
        weaponRef.current.rotation.z = Math.sin(t * 10) * 0.04;
      } else if (isMoving) {
        // Regular walking animation with enhanced bob effect
        const walkBobIntensity = 0.015;
        
        // Vertical bobbing - more pronounced when walking
        weaponRef.current.position.y = position[1] + Math.sin(t * 5) * walkBobIntensity;
        
        // Horizontal swaying while walking
        weaponRef.current.position.x = position[0] + Math.sin(t * 2.5) * walkBobIntensity;
        
        // Slight rotation changes to simulate natural arm movement
        weaponRef.current.rotation.z = Math.sin(t * 5) * 0.025;
        
        // Reset rotation toward normal slowly
        weaponRef.current.rotation.x = THREE.MathUtils.lerp(
          weaponRef.current.rotation.x, 
          rotation[0] + Math.sin(t * 5) * 0.015, // Add slight up/down movement
          delta * 5
        );
      } else {
        // Idle animation - gentle weapon sway
        const idleSwayIntensity = 0.005;
        
        // Very subtle vertical floating
        weaponRef.current.position.y = position[1] + Math.sin(t * 1.5) * idleSwayIntensity;
        
        // Subtle horizontal drifting
        weaponRef.current.position.x = position[0] + Math.sin(t * 1) * idleSwayIntensity;
        
        // Subtle rotation changes
        weaponRef.current.rotation.z = Math.sin(t * 0.8) * 0.01;
        
        // Reset rotation smoothly back to normal
        weaponRef.current.rotation.x = THREE.MathUtils.lerp(
          weaponRef.current.rotation.x, 
          rotation[0], 
          delta * 3
        );
      }
      
      // Adjust z-position smoothly based on state
      if (isSprinting && isMoving) {
        weaponRef.current.position.z = THREE.MathUtils.lerp(
          weaponRef.current.position.z,
          position[2] + 0.1, // Move slightly further out when sprinting
          delta * 5
        );
      } else {
        weaponRef.current.position.z = THREE.MathUtils.lerp(
          weaponRef.current.position.z,
          position[2],
          delta * 5
        );
      }
      
      // Shooting recoil effect - overrides other animations temporarily
      if (isShooting) {
        // Temporary recoil based on weapon type
        const recoilIntensity = currentWeapon.type === WeaponType.Pistol ? 0.05 : 
                               (currentWeapon.type === WeaponType.Rifle ? 0.08 : 0.12);
        
        // Apply recoil
        weaponRef.current.position.z = position[2] + recoilIntensity;
        weaponRef.current.rotation.x = rotation[0] - recoilIntensity * 2; // Tilt up with recoil
        
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
      (state) => state[controlMap.reload],
      (pressed) => {
        if (pressed) reloadWeapon();
      }
    );
    
    // Subscribe to shoot key
    const unsubscribeShoot = subscribeKeys(
      (state) => state[controlMap.shoot],
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
  }, [currentWeapon.automatic, currentWeapon.fireRate, isThirdPerson, reloadWeapon, shootWeapon, subscribeKeys, controlMap]);
  
  // Enhanced weapon models with more visible size and colors
  const renderWeaponModel = () => {
    switch(currentWeapon.type) {
      case WeaponType.Pistol:
        return (
          <>
            {/* Main gun body */}
            <mesh position={[0, 0, -0.3]}>
              <boxGeometry args={[0.15, 0.15, 0.25]} />
              <meshStandardMaterial color="#3a3a3a" metalness={0.9} roughness={0.2} emissive="#222222" emissiveIntensity={0.2} />
            </mesh>
            {/* Handle */}
            <mesh position={[0, -0.1, -0.15]}>
              <boxGeometry args={[0.12, 0.2, 0.12]} />
              <meshStandardMaterial color="#222222" metalness={0.5} roughness={0.3} />
            </mesh>
            {/* Barrel */}
            <mesh position={[0, 0, -0.05]}>
              <cylinderGeometry args={[0.04, 0.04, 0.35, 8]} />
              <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Gun sight */}
            <mesh position={[0, 0.08, -0.3]}>
              <boxGeometry args={[0.03, 0.03, 0.05]} />
              <meshStandardMaterial color="#777777" />
            </mesh>
            {/* Trigger */}
            <mesh position={[0, -0.14, -0.2]}>
              <boxGeometry args={[0.05, 0.05, 0.03]} />
              <meshStandardMaterial color="#111111" />
            </mesh>
          </>
        );
        
      case WeaponType.Rifle:
        return (
          <>
            {/* Main body */}
            <mesh position={[0, 0, -0.5]}>
              <boxGeometry args={[0.15, 0.15, 0.7]} />
              <meshStandardMaterial color="#4d4d4d" metalness={0.9} roughness={0.2} emissive="#333333" emissiveIntensity={0.2} />
            </mesh>
            {/* Handle/grip */}
            <mesh position={[0, -0.13, -0.3]}>
              <boxGeometry args={[0.12, 0.25, 0.15]} />
              <meshStandardMaterial color="#333333" metalness={0.5} roughness={0.3} />
            </mesh>
            {/* Long barrel */}
            <mesh position={[0, 0, -0.1]}>
              <cylinderGeometry args={[0.04, 0.04, 0.9, 8]} />
              <meshStandardMaterial color="#555555" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Front sight */}
            <mesh position={[0, 0.08, -0.7]}>
              <boxGeometry args={[0.05, 0.05, 0.03]} />
              <meshStandardMaterial color="#777777" />
            </mesh>
            {/* Magazine */}
            <mesh position={[0, -0.2, -0.45]}>
              <boxGeometry args={[0.1, 0.15, 0.25]} />
              <meshStandardMaterial color="#666666" />
            </mesh>
          </>
        );
        
      case WeaponType.Shotgun:
        return (
          <>
            {/* Main body */}
            <mesh position={[0, 0, -0.4]}>
              <boxGeometry args={[0.15, 0.15, 0.6]} />
              <meshStandardMaterial color="#654321" metalness={0.3} roughness={0.3} emissive="#441100" emissiveIntensity={0.2} />
            </mesh>
            {/* Wooden handle */}
            <mesh position={[0, -0.12, -0.25]}>
              <boxGeometry args={[0.12, 0.22, 0.15]} />
              <meshStandardMaterial color="#8b4513" metalness={0.2} roughness={0.8} emissive="#552200" emissiveIntensity={0.1} />
            </mesh>
            {/* Long double barrel */}
            <group position={[0, 0.02, -0.05]}>
              <mesh position={[0.04, 0, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 0.75, 8]} />
                <meshStandardMaterial color="#333333" metalness={0.6} roughness={0.4} />
              </mesh>
              <mesh position={[-0.04, 0, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 0.75, 8]} />
                <meshStandardMaterial color="#333333" metalness={0.6} roughness={0.4} />
              </mesh>
            </group>
            {/* Pump grip */}
            <mesh position={[0, 0.07, -0.3]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.025, 0.025, 0.15, 8]} />
              <meshStandardMaterial color="#222222" />
            </mesh>
            {/* Shell loading area */}
            <mesh position={[0, 0.04, -0.5]}>
              <boxGeometry args={[0.13, 0.03, 0.1]} />
              <meshStandardMaterial color="#555555" />
            </mesh>
          </>
        );
        
      default:
        return (
          <mesh>
            <boxGeometry args={[0.15, 0.15, 0.4]} />
            <meshStandardMaterial color="#444444" />
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
      {/* Spotlight to ensure weapon is visible */}
      <spotLight
        position={[0, 0.5, 0]}
        angle={0.6}
        penumbra={0.5}
        intensity={0.8}
        color="#ffffff"
        castShadow={false}
        distance={3}
      />
      
      {/* Basic weapon model */}
      {renderWeaponModel()}
      
      {/* Enhanced muzzle flash during shooting */}
      {isShooting && (
        <group position={[0, 0, 
          currentWeapon.type === WeaponType.Pistol ? -0.45 : 
          currentWeapon.type === WeaponType.Rifle ? 0.55 : 
          currentWeapon.type === WeaponType.Shotgun ? 0.6 : -0.9
        ]}>
          {/* Central flash */}
          <mesh>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial 
              color="#ffff00" 
              emissive="#ff7800"
              emissiveIntensity={2}
              toneMapped={false}
            />
          </mesh>
          
          {/* Outer glow */}
          <mesh>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial 
              color="#ff5500" 
              emissive="#ff3300"
              emissiveIntensity={1.5}
              transparent={true}
              opacity={0.7}
            />
          </mesh>
          
          {/* Flash rays */}
          {[...Array(8)].map((_, i) => (
            <mesh 
              key={i} 
              position={[
                Math.sin(i/8 * Math.PI * 2) * 0.05,
                Math.cos(i/8 * Math.PI * 2) * 0.05,
                -0.02
              ]}
              scale={[0.02, 0.02, 0.08 + Math.random() * 0.05]}
            >
              <boxGeometry />
              <meshStandardMaterial 
                color="#ffcc00" 
                emissive="#ff8800"
                emissiveIntensity={2}
                toneMapped={false}
              />
            </mesh>
          ))}
          
          {/* Light source */}
          <pointLight 
            color="#ff7700" 
            intensity={5} 
            distance={2} 
            decay={2}
          />
        </group>
      )}
    </group>
  );
};

export default Weapon;