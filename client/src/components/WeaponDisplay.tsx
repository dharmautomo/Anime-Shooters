import { useRef, useEffect, useState } from 'react';
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
  
  // Track last camera rotation to detect changes
  const prevCameraRotation = useRef(new THREE.Euler());
  const cameraRotationDelta = useRef(new THREE.Vector2(0, 0));
  
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
  const viewFollowStrength = 0.5; // How much the weapon follows the view
  
  // Debug for development
  const [debugInfo, setDebugInfo] = useState('');
  
  // Set up weapon position and rotation
  useEffect(() => {
    if (pistolRef.current) {
      // Position weapon in the lower right portion of the screen, but slightly more centered
      pistolRef.current.position.set(0.25, -0.25, -0.5);
      // Slightly rotate the weapon for a better angle
      pistolRef.current.rotation.set(0, -Math.PI/12, 0);
      // Scale up the weapon a bit for better visibility
      pistolRef.current.scale.set(1.1, 1.1, 1.1);
    }
    
    // Initialize previous camera rotation
    prevCameraRotation.current.copy(camera.rotation);
    
    // Log for debugging
    console.log('Weapon display initialized, tracking camera rotation');
  }, [camera]);
  
  // Handle weapon animation and view following
  useFrame((_, delta) => {
    time.current += delta;
    
    if (!pistolRef.current || !isControlsLocked || !isVisible) return;
    
    // Calculate camera rotation delta for view following
    const rotDeltaX = camera.rotation.x - prevCameraRotation.current.x;
    const rotDeltaY = camera.rotation.y - prevCameraRotation.current.y;
    
    // Update camera rotation deltas with smoothing
    cameraRotationDelta.current.x = rotDeltaX * 10; // Scale for better response
    cameraRotationDelta.current.y = rotDeltaY * 10;
    
    // Store current camera rotation for next frame
    prevCameraRotation.current.copy(camera.rotation);
    
    // Reset position for idle state
    let targetPosX = 0.25;
    let targetPosY = -0.25;
    let targetRotZ = 0;
    let targetRotX = 0;
    let targetRotY = -Math.PI/12;
    
    // Bobbing effect when moving
    if (isMoving) {
      const bobOffsetY = Math.sin(time.current * bobSpeed) * bobAmount;
      const bobOffsetX = Math.cos(time.current * bobSpeed) * bobAmount * 0.5;
      
      targetPosY = -0.25 + bobOffsetY;
      targetPosX = 0.25 + bobOffsetX;
    } else {
      // Subtle breathing movement when idle
      const breathingOffset = Math.sin(time.current * 1.5) * 0.003;
      targetPosY = -0.25 + breathingOffset;
    }
    
    // Left-right sway based on movement
    if (left) targetRotZ = swayAmount;
    if (right) targetRotZ = -swayAmount;
    
    // Apply view-following effect based on camera rotation changes
    // This makes the weapon follow the player's view direction
    targetRotY += cameraRotationDelta.current.y * viewFollowStrength;
    targetRotX += cameraRotationDelta.current.x * viewFollowStrength;
    
    // Add slight tilt based on camera's current rotation for more immersion
    // This makes the weapon feel more connected to the camera view
    targetRotY += (camera.rotation.y + Math.PI/2) * 0.1;
    targetRotX += camera.rotation.x * 0.1;
    
    // Add position shift based on rotation (makes the weapon move slightly in the direction you're looking)
    // This creates more realistic inertia feel for the weapon
    targetPosX -= cameraRotationDelta.current.y * 0.15; // Move horizontally based on yaw change
    targetPosY -= cameraRotationDelta.current.x * 0.15; // Move vertically based on pitch change
    
    // Apply position and rotation with lerping for smooth transitions
    pistolRef.current.position.x += (targetPosX - pistolRef.current.position.x) * 5 * delta;
    pistolRef.current.position.y += (targetPosY - pistolRef.current.position.y) * 5 * delta;
    pistolRef.current.rotation.z += (targetRotZ - pistolRef.current.rotation.z) * 3 * delta;
    pistolRef.current.rotation.y += (targetRotY - pistolRef.current.rotation.y) * 5 * delta;
    pistolRef.current.rotation.x += (targetRotX - pistolRef.current.rotation.x) * 5 * delta;
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