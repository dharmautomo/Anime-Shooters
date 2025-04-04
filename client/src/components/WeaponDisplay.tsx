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
    console.log('Weapon display initialized');
  }, []);
  
  // Handle weapon animation with simplified positioning
  useFrame((state, delta) => {
    time.current += delta;
    
    if (!pistolRef.current || !isVisible) return;
    
    // Basic position - fixed offset from camera
    const cameraPosition = state.camera.position.clone();
    const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(state.camera.quaternion);
    const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(state.camera.quaternion);
    const cameraDown = new THREE.Vector3(0, -1, 0).applyQuaternion(state.camera.quaternion);
    
    // Position pistol relative to camera with fixed offsets in view space
    const pistolPosition = cameraPosition.clone()
      .add(cameraDirection.clone().multiplyScalar(0.5))  // Move forward
      .add(cameraRight.clone().multiplyScalar(0.3))     // Move right
      .add(cameraDown.clone().multiplyScalar(0.3));     // Move down
    
    // Update position and rotation
    pistolRef.current.position.copy(pistolPosition);
    pistolRef.current.quaternion.copy(state.camera.quaternion);
    
    // Add bobbing effect when moving
    if (isMoving) {
      const bobY = Math.sin(time.current * bobSpeed) * bobAmount;
      const bobX = Math.cos(time.current * bobSpeed) * bobAmount * 0.5;
      
      pistolRef.current.position.add(
        cameraRight.clone().multiplyScalar(bobX).add(
          cameraDown.clone().multiplyScalar(-bobY)
        )
      );
    }
    
    // Add left-right sway based on movement
    if (left || right) {
      const swayAmount = left ? 0.1 : -0.1;
      
      // Create a rotation matrix for the Z-axis (roll)
      const rotationMatrix = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 0, 1).applyQuaternion(state.camera.quaternion),
        swayAmount * delta
      );
      
      // Apply the rotation to the pistol's quaternion
      const rotationQuaternion = new THREE.Quaternion().setFromRotationMatrix(rotationMatrix);
      pistolRef.current.quaternion.premultiply(rotationQuaternion);
    }
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