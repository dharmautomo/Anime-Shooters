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
  
  // Handle weapon animation - much simpler approach
  useFrame((_, delta) => {
    time.current += delta;
    
    if (!pistolRef.current || !isControlsLocked || !isVisible) return;
    
    // Simply align rotation with camera
    pistolRef.current.quaternion.copy(camera.quaternion);
    
    // Fixed position in camera space (lower right corner of view)
    pistolRef.current.position.copy(camera.position);
    
    // Forward direction vector (camera is looking down negative Z)
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(camera.quaternion);
    forward.multiplyScalar(-0.5); // Move 0.5 units in front of camera
    
    // Right direction vector
    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(camera.quaternion);
    right.multiplyScalar(0.3); // Move 0.3 units to the right
    
    // Down direction vector
    const down = new THREE.Vector3(0, -1, 0);
    down.applyQuaternion(camera.quaternion);
    down.multiplyScalar(0.3); // Move 0.3 units down
    
    // Apply all offsets to position pistol in lower right corner of view
    pistolRef.current.position.add(forward);
    pistolRef.current.position.add(right);
    pistolRef.current.position.add(down);
    
    // Add bobbing effect when moving
    if (isMoving) {
      const bobY = Math.sin(time.current * bobSpeed) * bobAmount;
      const bobX = Math.cos(time.current * bobSpeed * 0.5) * bobAmount * 0.5;
      
      const bobVecY = new THREE.Vector3(0, 1, 0);
      bobVecY.applyQuaternion(camera.quaternion);
      bobVecY.multiplyScalar(bobY);
      
      const bobVecX = new THREE.Vector3(1, 0, 0);
      bobVecX.applyQuaternion(camera.quaternion);
      bobVecX.multiplyScalar(bobX);
      
      pistolRef.current.position.add(bobVecY);
      pistolRef.current.position.add(bobVecX);
    }
    
    // Apply left-right sway based on movement
    if (left || right) {
      const swayAmount = left ? 0.1 : -0.1;
      pistolRef.current.rotateZ(swayAmount * delta);
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