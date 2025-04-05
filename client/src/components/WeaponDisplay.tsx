import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useKeyboardControls } from '@react-three/drei';
import { Controls } from '../App';
import { useGameControls } from '../lib/stores/useGameControls';

interface WeaponDisplayProps {
  isVisible: boolean;
}

const WeaponDisplay = ({ isVisible }: WeaponDisplayProps) => {
  const { camera } = useThree();
  const pistolRef = useRef<THREE.Group>(null);
  const { isControlsLocked } = useGameControls();
  
  // Get movement keys for weapon sway animation
  const forward = useKeyboardControls((state) => state[Controls.forward]);
  const backward = useKeyboardControls((state) => state[Controls.backward]);
  const left = useKeyboardControls((state) => state[Controls.left]);
  const right = useKeyboardControls((state) => state[Controls.right]);
  
  // Track movement for sway effect
  const isMoving = forward || backward || left || right;
  
  // Track time for animations
  const time = useRef(0);
  
  // Animation parameters
  const bobSpeed = 4; // Speed of the bobbing effect
  const bobAmount = 0.015; // Amount of bobbing
  const swayAmount = 0.08; // Amount of weapon sway
  
  // Setup weapon position and visibility
  useEffect(() => {
    console.log('Weapon display initialized');
    
    // Make the pistol a child of the camera
    if (pistolRef.current) {
      // Remove the pistol from its current parent if it has one
      if (pistolRef.current.parent && pistolRef.current.parent !== camera) {
        pistolRef.current.parent.remove(pistolRef.current);
      }
      
      // If it's not already a child of the camera, add it
      if (pistolRef.current.parent !== camera) {
        camera.add(pistolRef.current);
      }
    }
    
    // Cleanup function
    return () => {
      if (pistolRef.current && pistolRef.current.parent === camera) {
        camera.remove(pistolRef.current);
      }
    };
  }, [camera]);
  
  // Handle weapon animation and positioning
  useFrame((_, delta) => {
    time.current += delta;
    
    if (!pistolRef.current || !isControlsLocked || !isVisible) return;
    
    // Position the weapon in the bottom right corner of the screen
    // These coordinates are relative to the camera
    let posX = 0.4;
    let posY = -0.3;
    const posZ = -0.5;
    
    // Add bobbing effect when moving
    if (isMoving) {
      const bobOffsetY = Math.sin(time.current * bobSpeed) * bobAmount;
      const bobOffsetX = Math.cos(time.current * bobSpeed) * bobAmount * 0.5;
      
      posY += bobOffsetY;
      posX += bobOffsetX;
    } else {
      // Subtle breathing movement when idle
      const breathingOffset = Math.sin(time.current * 1.5) * 0.003;
      posY += breathingOffset;
    }
    
    // Apply position directly - this is in local camera space so it stays fixed in view
    pistolRef.current.position.set(posX, posY, posZ);
    
    // Reset rotation to base values
    pistolRef.current.rotation.set(0, -Math.PI/12, 0);
    
    // Add movement-based rotation effects
    let targetRotZ = 0;
    if (left) targetRotZ = swayAmount;
    if (right) targetRotZ = -swayAmount;
    pistolRef.current.rotation.z = targetRotZ;
    
    // Add forward/backward tilt
    let targetRotX = 0;
    if (forward) targetRotX = -swayAmount * 0.5;
    if (backward) targetRotX = swayAmount * 0.5;
    pistolRef.current.rotation.x = targetRotX;
  });
  
  return (
    <group ref={pistolRef} visible={isVisible && isControlsLocked}>
      {/* Pistol body */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.08, 0.15, 0.25]} />
        <meshStandardMaterial color="#111" roughness={0.5} metalness={0.7} />
      </mesh>
      
      {/* Pistol grip */}
      <mesh position={[0, -0.13, 0.05]} rotation={[0.3, 0, 0]} castShadow>
        <boxGeometry args={[0.07, 0.15, 0.1]} />
        <meshStandardMaterial color="#222" roughness={0.8} metalness={0.3} />
      </mesh>
      
      {/* Pistol barrel */}
      <mesh position={[0, 0.05, -0.15]} castShadow>
        <boxGeometry args={[0.05, 0.05, 0.1]} />
        <meshStandardMaterial color="#111" roughness={0.3} metalness={0.9} />
      </mesh>
      
      {/* Trigger */}
      <mesh position={[0, -0.05, 0.1]} castShadow>
        <boxGeometry args={[0.03, 0.03, 0.05]} />
        <meshStandardMaterial color="#333" roughness={0.5} metalness={0.5} />
      </mesh>
      
      {/* Muzzle */}
      <mesh position={[0, 0.05, -0.22]} castShadow>
        <cylinderGeometry args={[0.02, 0.03, 0.04, 16]} />
        <meshStandardMaterial color="#000" roughness={0.2} metalness={1} />
      </mesh>
      
      {/* Slide */}
      <mesh position={[0, 0.075, -0.05]} castShadow>
        <boxGeometry args={[0.08, 0.05, 0.2]} />
        <meshStandardMaterial color="#222" roughness={0.4} metalness={0.8} />
      </mesh>
      
      {/* Sight */}
      <mesh position={[0, 0.11, -0.13]} castShadow>
        <boxGeometry args={[0.02, 0.02, 0.02]} />
        <meshStandardMaterial color="#fff" emissive="#ff0000" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
};

export default WeaponDisplay;