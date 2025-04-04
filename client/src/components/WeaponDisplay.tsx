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
  
  // Set up weapon position and rotation
  useEffect(() => {
    if (pistolRef.current) {
      // Position weapon in the lower right portion of the screen
      pistolRef.current.position.set(0.3, -0.3, -0.5);
      // Slightly rotate the weapon for a better angle
      pistolRef.current.rotation.set(0, -Math.PI/12, 0);
    }
    
    console.log('Weapon display initialized');
  }, []);
  
  // Handle weapon animation
  useFrame((_, delta) => {
    time.current += delta;
    
    if (!pistolRef.current || !isControlsLocked || !isVisible) return;
    
    // IMPORTANT: Keep the weapon always in front of the camera
    // We do this by attaching it directly to the camera
    
    // First reset the weapon position relative to the world origin
    pistolRef.current.position.set(0, 0, 0);
    pistolRef.current.rotation.set(0, 0, 0);
    
    // Apply camera rotation to the weapon
    pistolRef.current.quaternion.copy(camera.quaternion);
    
    // Now, position the weapon in camera space (which is already rotated with the camera)
    // This is the key fix - we position the weapon AFTER applying camera rotation
    // These offsets are in the camera's local coordinate system
    const offsetX = 0.3;  // Right offset
    const offsetY = -0.3; // Down offset
    const offsetZ = -0.5; // Forward offset
    
    // Create the offset vector and apply it in the camera's local space
    const offset = new THREE.Vector3(offsetX, offsetY, offsetZ);
    offset.applyQuaternion(camera.quaternion);
    
    // Apply the offset to the weapon position (which is in world space)
    pistolRef.current.position.copy(camera.position).add(offset);
    
    // Add bobbing effect when moving (in local weapon space)
    if (isMoving) {
      const bobOffsetY = Math.sin(time.current * bobSpeed) * bobAmount;
      const bobOffsetX = Math.cos(time.current * bobSpeed) * bobAmount * 0.5;
      
      // Create bobbing vector in local space
      const bobOffset = new THREE.Vector3(bobOffsetX, bobOffsetY, 0);
      bobOffset.applyQuaternion(camera.quaternion);
      
      // Apply bobbing to position
      pistolRef.current.position.add(bobOffset);
    } else {
      // Subtle breathing movement when idle
      const breathingOffset = Math.sin(time.current * 1.5) * 0.003;
      
      // Create breathing vector in local space
      const breathVector = new THREE.Vector3(0, breathingOffset, 0);
      breathVector.applyQuaternion(camera.quaternion);
      
      // Apply breathing to position
      pistolRef.current.position.add(breathVector);
    }
    
    // Left-right sway based on movement
    let targetRotZ = 0;
    if (left) targetRotZ = swayAmount;
    if (right) targetRotZ = -swayAmount;
    
    // Apply rotation around local Z axis (for left-right sway)
    pistolRef.current.rotateZ(targetRotZ * delta * 3);
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