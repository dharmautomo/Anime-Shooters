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
}

interface WeaponSystemProps {
  position: THREE.Vector3;
}

const WeaponSystem = ({ position }: WeaponSystemProps) => {
  const { camera } = useThree();
  const { playerId, health } = usePlayer();
  const { isControlsLocked } = useGameControls();
  
  // Weapon definitions
  const weapons = useRef<Weapon[]>([
    {
      name: 'Primary',
      fireRate: 5, // 5 shots per second
      lastFired: 0,
      bulletSpeed: 30,
      damage: 10,
      fireSound: '/sounds/hit.mp3', // Using existing sound
      useJKey: false,
      useKKey: false
    },
    {
      name: 'Secondary',
      fireRate: 2, // 2 shots per second
      lastFired: 0,
      bulletSpeed: 20,
      damage: 25,
      fireSound: '/sounds/hit.mp3', // Using existing sound
      useJKey: true,
      useKKey: false
    },
    {
      name: 'Special',
      fireRate: 1, // 1 shot per second
      lastFired: 0,
      bulletSpeed: 15,
      damage: 40,
      fireSound: '/sounds/success.mp3', // Using existing sound
      useJKey: false,
      useKKey: true
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
  
  // Handle mouse click for shooting
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!isControlsLocked || health <= 0) return;
      
      // Left mouse button
      if (e.button === 0) {
        fireWeapon(0); // Primary weapon
      }
    };
    
    // Handle key presses for alternative weapons
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isControlsLocked || health <= 0) return;
      
      if (e.code === 'KeyJ') {
        fireWeapon(1); // Secondary weapon
      } else if (e.code === 'KeyK') {
        fireWeapon(2); // Special weapon
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
    
    // Check if weapon can fire based on fire rate
    if (now - weapon.lastFired < 1000 / weapon.fireRate) {
      return;
    }
    
    // Update last fired time
    weapons.current[weaponIndex].lastFired = now;
    
    // Get camera direction for bullet trajectory
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion).normalize();
    
    // Create bullet ID with weapon type for size determination
    let bulletId = generateId();
    if (weaponIndex === 2) { // Special weapon
      bulletId = `special-${bulletId}`;
    }
    
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
    playGunSound(weapon.fireSound);
    
    // Apply screen shake
    applyScreenShake(0.15, weaponIndex === 0 ? 0.03 : weaponIndex === 1 ? 0.05 : 0.08);
    
    console.log(`Fired ${weapon.name} weapon`);
  };
  
  // Function to play gun sound
  const playGunSound = (soundUrl: string) => {
    try {
      const sound = new Audio(soundUrl);
      sound.volume = 0.3;
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