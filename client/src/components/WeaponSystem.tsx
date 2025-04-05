import { useState, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import Bullet from './Bullet';
import { usePlayer } from '../lib/stores/initializeStores';
import { useGameControls } from '../lib/stores/useGameControls';

// Simple function to generate a unique ID instead of using uuid package
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

interface Weapon {
  name: string;
  fireRate: number; // shots per second
  lastFired: number;
  bulletSpeed: number;
  damage: number;
  fireSound: string;
  useJKey: boolean;
  useKKey: boolean;
  currentAmmo: number;
  maxAmmo: number;
  isReloading: boolean;
  reloadStartTime: number;
  reloadTime: number; // in milliseconds
}

interface WeaponSystemProps {
  position: THREE.Vector3;
}

// Weapon system global state for UI access
interface WeaponSystemState {
  ammo: number;
  maxAmmo: number;
  isReloading: boolean;
  reloadProgress: number;
}

// Make weapon state available to window for UI component
declare global {
  interface Window {
    weaponSystem?: WeaponSystemState;
  }
}

const WeaponSystem = ({ position }: WeaponSystemProps) => {
  const { camera } = useThree();
  const { playerId, health } = usePlayer();
  const { isControlsLocked } = useGameControls();
  
  // Ammo state for UI display
  const [ammo, setAmmo] = useState<number>(10);
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [reloadProgress, setReloadProgress] = useState<number>(0);
  
  // Single primary weapon
  const weapons = useRef<Weapon[]>([
    {
      name: 'Primary',
      fireRate: 5, // 5 shots per second
      lastFired: 0,
      bulletSpeed: 30,
      damage: 10,
      fireSound: '/sounds/hit.mp3', // Using existing sound
      useJKey: false,
      useKKey: false,
      currentAmmo: 10,
      maxAmmo: 10,
      isReloading: false,
      reloadStartTime: 0,
      reloadTime: 2000 // 2 seconds to reload
    }
  ]);
  
  const [bullets, setBullets] = useState<{
    id: string;
    position: THREE.Vector3;
    direction: THREE.Vector3;
    speed: number;
  }[]>([]);
  
  // Screen shake state
  const [shaking, setShaking] = useState(false);
  const shakeDuration = useRef(0);
  const shakeIntensity = useRef(0);
  const originalCameraPosition = useRef(new THREE.Vector3());
  
  // Make weapon state available to window for UI access
  useEffect(() => {
    window.weaponSystem = {
      ammo,
      maxAmmo: weapons.current[0].maxAmmo,
      isReloading,
      reloadProgress
    };
    
    return () => {
      delete window.weaponSystem;
    };
  }, [ammo, isReloading, reloadProgress]);
  
  // Update reload progress during reload animation
  useEffect(() => {
    if (!isReloading) return;
    
    const intervalId = setInterval(() => {
      const weapon = weapons.current[0];
      if (weapon.isReloading) {
        const elapsed = performance.now() - weapon.reloadStartTime;
        const progress = Math.min(1, elapsed / weapon.reloadTime);
        setReloadProgress(progress);
        
        // If reload complete, clear interval
        if (progress >= 1) {
          clearInterval(intervalId);
        }
      } else {
        clearInterval(intervalId);
      }
    }, 50);
    
    return () => clearInterval(intervalId);
  }, [isReloading]);
  
  // Function to reload weapon
  const reloadWeapon = (weaponIndex: number) => {
    const weapon = weapons.current[weaponIndex];
    
    // Already reloading or full ammo
    if (weapon.isReloading || weapon.currentAmmo === weapon.maxAmmo) {
      return;
    }
    
    console.log(`Reloading ${weapon.name} weapon`);
    
    // Start reload process
    weapon.isReloading = true;
    weapon.reloadStartTime = performance.now();
    setIsReloading(true);
    setReloadProgress(0);
    
    // Play reload sound
    playGunSound(weapon.fireSound, 0.2); // Using fire sound for reload since we don't have a specific reload sound
    
    // Complete reload after delay
    setTimeout(() => {
      if (weapons.current[weaponIndex]) {
        weapons.current[weaponIndex].currentAmmo = weapons.current[weaponIndex].maxAmmo;
        weapons.current[weaponIndex].isReloading = false;
        setAmmo(weapons.current[weaponIndex].maxAmmo);
        setIsReloading(false);
        setReloadProgress(1);
        console.log(`${weapons.current[weaponIndex].name} weapon reloaded`);
      }
    }, weapon.reloadTime);
  };
  
  // Handle mouse click for shooting
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!isControlsLocked || health <= 0) return;
      
      // Left mouse button
      if (e.button === 0) {
        fireWeapon(0); // Primary weapon
      }
    };
    
    // Handle key presses for the primary weapon and reloading
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isControlsLocked || health <= 0) return;
      
      if (e.code === 'KeyJ' || e.code === 'KeyK') {
        fireWeapon(0); // Primary weapon for all keys
      }
      
      // Handle reload key (R)
      if (e.code === 'KeyR') {
        reloadWeapon(0); // Reload primary weapon
      }
    };
    
    // Add event listeners
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isControlsLocked, health]);
  
  // Function to fire a weapon
  const fireWeapon = (weaponIndex: number) => {
    const weapon = weapons.current[weaponIndex];
    const now = performance.now();
    
    // Don't fire if reloading
    if (weapon.isReloading) {
      return;
    }
    
    // Don't fire if no ammo
    if (weapon.currentAmmo <= 0) {
      // Play empty click sound and show "empty" indicator
      console.log(`${weapon.name} weapon is empty! Press R to reload.`);
      return;
    }
    
    // Check if weapon can fire based on fire rate
    if (now - weapon.lastFired < 1000 / weapon.fireRate) {
      return;
    }
    
    // Update last fired time
    weapons.current[weaponIndex].lastFired = now;
    
    // Decrease ammo
    weapons.current[weaponIndex].currentAmmo--;
    setAmmo(weapons.current[weaponIndex].currentAmmo);
    
    // No auto-reload - user must manually press R key when empty
    
    // Get camera direction for bullet trajectory
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion).normalize();
    
    // Create bullet ID
    let bulletId = generateId();
    
    // Create a new bullet
    const newBullet = {
      id: bulletId,
      position: new THREE.Vector3(
        camera.position.x,
        camera.position.y,
        camera.position.z
      ).add(direction.clone().multiplyScalar(0.5)),
      direction,
      speed: weapon.bulletSpeed
    };
    
    // Add the bullet to the bullets array
    setBullets(prev => [...prev, newBullet]);
    
    // Play gunshot sound
    playGunSound(weapon.fireSound, 0.3);
    
    // Apply screen shake
    applyScreenShake(0.15, 0.05);
    
    console.log(`Fired ${weapon.name} weapon (${weapon.currentAmmo}/${weapon.maxAmmo} ammo)`);
  };
  
  // Function to play gun sound
  const playGunSound = (soundUrl: string, volume: number = 0.3) => {
    try {
      const sound = new Audio(soundUrl);
      sound.volume = volume;
      sound.play().catch(e => console.error('Error playing gunshot sound:', e));
    } catch (error) {
      console.error('Failed to play gunshot sound:', error);
    }
  };
  
  // Function to apply screen shake
  const applyScreenShake = (duration: number, intensity: number) => {
    if (!camera) return;
    
    // Save original camera position if not already shaking
    if (!shaking) {
      originalCameraPosition.current.copy(camera.position);
    }
    
    // Set shake parameters
    shakeDuration.current = duration;
    shakeIntensity.current = intensity;
    setShaking(true);
  };
  
  // Remove bullets when they hit something
  const handleBulletHit = (bulletId: string) => {
    setBullets(prev => prev.filter(bullet => bullet.id !== bulletId));
  };
  
  // Update screen shake effect
  useFrame((_, delta) => {
    // Handle screen shake
    if (shaking && camera) {
      shakeDuration.current -= delta;
      
      if (shakeDuration.current <= 0) {
        // Stop shaking
        setShaking(false);
        
        // Reset camera position
        camera.position.copy(originalCameraPosition.current);
      } else {
        // Apply shake effect
        const shakeOffset = new THREE.Vector3(
          (Math.random() - 0.5) * 2 * shakeIntensity.current,
          (Math.random() - 0.5) * 2 * shakeIntensity.current,
          (Math.random() - 0.5) * 2 * shakeIntensity.current
        );
        
        camera.position.copy(originalCameraPosition.current.clone().add(shakeOffset));
      }
    } else if (!shaking && camera) {
      // Store the current position when not shaking
      originalCameraPosition.current.copy(camera.position);
    }
  });
  
  return (
    <>
      {/* Render all active bullets */}
      {bullets.map(bullet => (
        <Bullet
          key={bullet.id}
          bulletId={bullet.id}
          playerId={playerId}
          position={bullet.position}
          direction={bullet.direction}
          speed={bullet.speed}
          onHit={() => handleBulletHit(bullet.id)}
        />
      ))}
    </>
  );
};

export default WeaponSystem;