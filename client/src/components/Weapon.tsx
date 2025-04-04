import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useKeyboardControls } from '@react-three/drei';
import { Controls } from '../App';
import { usePlayer } from '../lib/stores/initializeStores';

interface WeaponProps {
  position?: [number, number, number];
}

const Weapon = ({ position = [0.3, -0.3, -0.5] }: WeaponProps) => {
  const weaponRef = useRef<THREE.Group>(null);
  
  // Get movement inputs for weapon sway
  const forward = useKeyboardControls((state) => state[Controls.forward]);
  const backward = useKeyboardControls((state) => state[Controls.backward]);
  const left = useKeyboardControls((state) => state[Controls.left]);
  const right = useKeyboardControls((state) => state[Controls.right]);
  const sprint = useKeyboardControls((state) => state[Controls.sprint]);
  
  // Get player state
  const { health } = usePlayer();
  
  // Animation parameters
  const swayAmount = 0.002; // How much the weapon sways when moving
  const bobAmount = 0.005; // How much the weapon bobs up and down when walking
  const bobSpeed = 10; // Speed of the bob cycle
  
  // Weapon animation (sway and bob)
  useFrame((_, delta) => {
    if (!weaponRef.current || health <= 0) return;
    
    // Initial position
    const [x, y, z] = position;
    let newX = x;
    let newY = y;
    
    // Movement state
    const isMoving = forward || backward || left || right;
    const isSprinting = sprint && (forward || backward);
    
    // Weapon sway based on movement direction
    if (forward) newX += swayAmount;
    if (backward) newX -= swayAmount;
    if (left) newX += swayAmount * 1.5;
    if (right) newX -= swayAmount * 1.5;
    
    // Weapon bob up and down when walking/running
    if (isMoving) {
      // Get the current time for smooth bob animation
      const time = Date.now() * 0.001;
      
      // Calculate bob effect - use sine wave for up/down motion
      const bobSpeedMultiplier = isSprinting ? 1.5 : 1.0;
      const bobHeightMultiplier = isSprinting ? 1.5 : 1.0;
      
      // Apply bob effect to Y position
      newY += Math.sin(time * bobSpeed * bobSpeedMultiplier) * bobAmount * bobHeightMultiplier;
      
      // Apply subtle bob effect to X position (side to side)
      newX += Math.cos(time * bobSpeed * bobSpeedMultiplier * 0.5) * bobAmount * 0.5;
    }
    
    // Apply the calculated position with smooth interpolation
    weaponRef.current.position.x += (newX - weaponRef.current.position.x) * 5 * delta;
    weaponRef.current.position.y += (newY - weaponRef.current.position.y) * 5 * delta;
    weaponRef.current.position.z = z; // Keep Z position constant
    
    // Add subtle rotation sway for more realistic movement
    if (isMoving) {
      const rotationSpeed = 2 * delta;
      // Rotate slightly based on movement directions
      if (left) weaponRef.current.rotation.z += 0.01 * rotationSpeed;
      if (right) weaponRef.current.rotation.z -= 0.01 * rotationSpeed;
      if (forward) weaponRef.current.rotation.x += 0.005 * rotationSpeed;
      if (backward) weaponRef.current.rotation.x -= 0.005 * rotationSpeed;
    }
    
    // Gradually return to neutral rotation when not moving
    weaponRef.current.rotation.z *= 0.9;
    weaponRef.current.rotation.x *= 0.9;
  });
  
  return (
    <group ref={weaponRef} position={position}>
      {/* Pistol model */}
      <group rotation={[0, Math.PI, 0]} scale={0.15}>
        {/* Gun handle */}
        <mesh position={[0, -0.5, 0]} castShadow>
          <boxGeometry args={[0.8, 2, 0.5]} />
          <meshStandardMaterial color="#111111" roughness={0.5} metalness={0.5} />
        </mesh>
        
        {/* Gun barrel */}
        <mesh position={[0, 0.3, 1]} castShadow>
          <boxGeometry args={[0.5, 0.5, 3]} />
          <meshStandardMaterial color="#222222" roughness={0.4} metalness={0.7} />
        </mesh>
        
        {/* Trigger guard */}
        <mesh position={[0, -0.25, 0.5]} castShadow>
          <boxGeometry args={[0.6, 0.2, 0.8]} />
          <meshStandardMaterial color="#111111" roughness={0.5} metalness={0.6} />
        </mesh>
        
        {/* Trigger */}
        <mesh position={[0, -0.3, 0.7]} castShadow>
          <boxGeometry args={[0.1, 0.3, 0.1]} />
          <meshStandardMaterial color="#222222" roughness={0.4} metalness={0.5} />
        </mesh>
        
        {/* Gun top */}
        <mesh position={[0, 0.55, 0]} castShadow>
          <boxGeometry args={[0.6, 0.2, 2]} />
          <meshStandardMaterial color="#333333" roughness={0.3} metalness={0.8} />
        </mesh>
        
        {/* Sights */}
        <mesh position={[0, 0.7, -0.5]} castShadow>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.5} />
        </mesh>
        
        {/* Add a subtle light for better visibility */}
        <pointLight position={[0, 0, 0]} intensity={0.2} distance={1} color="#ffffff" />
      </group>
    </group>
  );
};

export default Weapon;