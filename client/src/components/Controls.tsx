import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { usePlayer } from '../lib/stores/usePlayer';

const Controls = () => {
  const { camera } = useThree();
  const { updatePosition, updateRotation } = usePlayer();
  
  // Set up mouse movement handling
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Update rotation based on mouse movement
      const rotationSpeed = 0.002;
      const xRotation = e.movementX * rotationSpeed;
      
      // Apply rotation to camera
      camera.rotation.y -= xRotation;
      
      // Update player rotation state
      updateRotation(camera.rotation.y);
      
      // Update player position to match camera
      updatePosition(camera.position);
    };
    
    // Add event listener for mouse movement
    document.addEventListener('mousemove', handleMouseMove);
    
    // Clean up event listener on unmount
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [camera, updatePosition, updateRotation]);
  
  return null;
};

export default Controls;
