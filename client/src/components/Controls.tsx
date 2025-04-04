import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayer } from '../lib/stores/initializeStores';

const Controls = () => {
  const { camera } = useThree();
  const { updatePosition, updateRotation } = usePlayer();
  const isLocked = useRef(false);
  
  // Keep track of the mouse movement
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const mouseMoveRef = useRef({ x: 0, y: 0 });
  
  // Set up mouse movement handling
  useEffect(() => {
    console.log('MouseControls component mounted');
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!document.pointerLockElement) {
        console.log('Mouse move ignored - pointer not locked');
        return;
      }
      
      isLocked.current = true;
      
      // Log mouse movement for debugging
      if (e.movementX !== 0 || e.movementY !== 0) {
        console.log(`Mouse moved: x=${e.movementX}, y=${e.movementY}`);
      }
      
      // Accumulate mouse movement
      mouseMoveRef.current.x += e.movementX;
      mouseMoveRef.current.y += e.movementY;
    };
    
    // Add event listener for mouse movement
    document.addEventListener('mousemove', handleMouseMove);
    
    // Clean up event listener on unmount
    return () => {
      console.log('MouseControls component unmounted');
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  // Update camera rotation based on accumulated mouse movement
  useFrame(() => {
    if (!isLocked.current) return;
    
    // Calculate rotation based on accumulated mouse movement
    const rotationSpeed = 0.002;
    const xRotation = mouseMoveRef.current.x * rotationSpeed;
    const yRotation = mouseMoveRef.current.y * rotationSpeed;
    
    // Reset accumulated mouse movement
    mouseMoveRef.current.x = 0;
    mouseMoveRef.current.y = 0;
    
    // Update rotation euler angles
    euler.current.y -= xRotation;
    euler.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.current.x - yRotation));
    
    // Apply rotation to camera
    camera.rotation.copy(euler.current);
    
    // Update player rotation state (only y rotation/yaw)
    updateRotation(euler.current.y);
    
    // Update player position to match camera
    updatePosition(camera.position);
  });
  
  return null;
};

export default Controls;
