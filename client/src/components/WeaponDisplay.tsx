import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
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
  
  // Store last mouse movement for view following effect
  const lastMouseX = useRef(0);
  const lastMouseY = useRef(0);
  const mouseDeltaX = useRef(0);
  const mouseDeltaY = useRef(0);
  
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
  const viewFollowStrength = 0.15; // How much the weapon follows the view
  
  // Setup mouse movement tracking for view-following effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isControlsLocked) return;
      
      // Calculate mouse delta since last frame
      if (lastMouseX.current !== 0) {
        mouseDeltaX.current = (e.movementX || 0) * 0.002; // Scale down movement for subtle effect
        mouseDeltaY.current = (e.movementY || 0) * 0.002;
      }
      
      lastMouseX.current = e.clientX;
      lastMouseY.current = e.clientY;
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isControlsLocked]);
  
  // Set up weapon position and rotation
  useEffect(() => {
    if (pistolRef.current) {
      // Position weapon in the lower right portion of the screen
      pistolRef.current.position.set(0.3, -0.3, -0.5);
      // Slightly rotate the weapon for a better angle
      pistolRef.current.rotation.set(0, -Math.PI/12, 0);
    }
  }, []);
  
  // Handle weapon animation and view following
  useFrame((_, delta) => {
    time.current += delta;
    
    if (!pistolRef.current || !isControlsLocked || !isVisible) return;
    
    // Reset position for idle state
    let targetPosX = 0.3;
    let targetPosY = -0.3;
    let targetRotZ = 0;
    let targetRotX = 0;
    let targetRotY = -Math.PI/12;
    
    // Bobbing effect when moving
    if (isMoving) {
      const bobOffsetY = Math.sin(time.current * bobSpeed) * bobAmount;
      const bobOffsetX = Math.cos(time.current * bobSpeed) * bobAmount * 0.5;
      
      targetPosY = -0.3 + bobOffsetY;
      targetPosX = 0.3 + bobOffsetX;
    } else {
      // Subtle breathing movement when idle
      const breathingOffset = Math.sin(time.current * 1.5) * 0.003;
      targetPosY = -0.3 + breathingOffset;
    }
    
    // Left-right sway based on movement
    if (left) targetRotZ = swayAmount;
    if (right) targetRotZ = -swayAmount;
    
    // Apply view-following effect based on mouse movement
    // This makes the weapon follow the player's view direction
    targetRotY += mouseDeltaX.current * viewFollowStrength * 5;
    targetRotX += mouseDeltaY.current * viewFollowStrength * 3;
    
    // Gradually decay mouse movement delta
    mouseDeltaX.current *= 0.9;
    mouseDeltaY.current *= 0.9;
    
    // Apply position and rotation with lerping for smooth transitions
    pistolRef.current.position.x += (targetPosX - pistolRef.current.position.x) * 5 * delta;
    pistolRef.current.position.y += (targetPosY - pistolRef.current.position.y) * 5 * delta;
    pistolRef.current.rotation.z += (targetRotZ - pistolRef.current.rotation.z) * 3 * delta;
    pistolRef.current.rotation.y += (targetRotY - pistolRef.current.rotation.y) * 2 * delta;
    pistolRef.current.rotation.x += (targetRotX - pistolRef.current.rotation.x) * 2 * delta;
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