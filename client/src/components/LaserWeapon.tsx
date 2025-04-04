import { useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameControls } from '../lib/stores/useGameControls';
import { useAudio } from '../lib/stores/useAudio';

interface LaserWeaponProps {
  position: [number, number, number];
  rotation: [number, number, number];
  onShoot: () => void;
}

const LaserWeapon = ({ position, rotation, onShoot }: LaserWeaponProps) => {
  const [isShooting, setIsShooting] = useState(false);
  const laserRef = useRef<THREE.Mesh>(null);
  const laserGroupRef = useRef<THREE.Group>(null);
  const cooldownRef = useRef(false);
  const laserSound = useRef<HTMLAudioElement | null>(null);
  const { createPositionalSound } = useAudio();
  
  // Create a timeout reference to control shooting rate
  const lastShootTime = useRef(0);
  const FIRE_RATE = 200; // milliseconds
  const LASER_LENGTH = 50; // How far the laser beam extends
  
  // Initialize laser sound
  useEffect(() => {
    // Create laser sound
    laserSound.current = new Audio('/sounds/laser.mp3');
    laserSound.current.volume = 0.3;
    
    return () => {
      if (laserSound.current) {
        laserSound.current.pause();
      }
    };
  }, []);
  
  // Handle mouse events for shooting
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // Left mouse button only
        setIsShooting(true);
      }
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        setIsShooting(false);
      }
    };
    
    // Add event listeners
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);
  
  // Animation loop for laser
  useFrame((_, delta) => {
    if (!laserRef.current || !laserGroupRef.current) return;
    
    // Hide laser beam when not shooting
    laserRef.current.visible = isShooting;
    
    // Shoot logic with cooldown
    if (isShooting && !cooldownRef.current) {
      const now = Date.now();
      if (now - lastShootTime.current > FIRE_RATE) {
        // Play sound effect
        if (laserSound.current) {
          laserSound.current.currentTime = 0;
          laserSound.current.play().catch(e => console.error("Error playing laser sound:", e));
        }
        
        // Call the shoot callback
        onShoot();
        
        // Update last shoot time
        lastShootTime.current = now;
        
        // Set cooldown flag
        cooldownRef.current = true;
        
        // Reset cooldown after fire rate time
        setTimeout(() => {
          cooldownRef.current = false;
        }, FIRE_RATE);
      }
    }
    
    // Animate laser effect when shooting
    if (isShooting && laserRef.current) {
      // Pulsate the laser
      const pulse = Math.sin(Date.now() * 0.01) * 0.1 + 0.9;
      laserRef.current.scale.set(0.05, 0.05, LASER_LENGTH * pulse);
      
      // Make the laser glow
      const material = laserRef.current.material as THREE.MeshBasicMaterial;
      material.color.setRGB(1, 0.2 + Math.sin(Date.now() * 0.01) * 0.1, 0.2);
    }
  });
  
  return (
    <group position={new THREE.Vector3(...position)} rotation={[0, rotation[1], 0]} ref={laserGroupRef}>
      {/* Weapon model */}
      <mesh position={[0.3, -0.2, -0.5]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.2, 0.2, 0.6]} />
        <meshStandardMaterial color={'#666'} />
      </mesh>
      
      {/* Laser beam */}
      <mesh 
        ref={laserRef} 
        position={[0.3, -0.15, -LASER_LENGTH/2 - 0.8]}
        visible={false}
      >
        <cylinderGeometry args={[0.05, 0.05, LASER_LENGTH, 8]} />
        <meshBasicMaterial color="red" transparent opacity={0.7} />
      </mesh>
    </group>
  );
};

export default LaserWeapon;