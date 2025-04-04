import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface CrosshairProps {
  color?: string;
  size?: number;
  thickness?: number;
  gap?: number;
}

const Crosshair = ({
  color = '#ffffff',
  size = 0.01,
  thickness = 0.001,
  gap = 0.002
}: CrosshairProps) => {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  
  // Update crosshair position to always be in front of camera
  useEffect(() => {
    if (!groupRef.current) return;
    
    // Position crosshair in front of camera
    groupRef.current.position.z = -0.2;
    
    // Make crosshair face the camera
    groupRef.current.lookAt(camera.position);
    
    // Add the crosshair to the camera
    camera.add(groupRef.current);
    
    // Cleanup function
    return () => {
      if (groupRef.current) {
        camera.remove(groupRef.current);
      }
    };
  }, [camera]);
  
  return (
    <group ref={groupRef}>
      {/* Top line */}
      <mesh position={[0, size / 2 + gap / 2, 0]}>
        <boxGeometry args={[thickness, size, thickness]} />
        <meshBasicMaterial color={color} />
      </mesh>
      
      {/* Bottom line */}
      <mesh position={[0, -size / 2 - gap / 2, 0]}>
        <boxGeometry args={[thickness, size, thickness]} />
        <meshBasicMaterial color={color} />
      </mesh>
      
      {/* Left line */}
      <mesh position={[-size / 2 - gap / 2, 0, 0]}>
        <boxGeometry args={[size, thickness, thickness]} />
        <meshBasicMaterial color={color} />
      </mesh>
      
      {/* Right line */}
      <mesh position={[size / 2 + gap / 2, 0, 0]}>
        <boxGeometry args={[size, thickness, thickness]} />
        <meshBasicMaterial color={color} />
      </mesh>
      
      {/* Center dot (optional) */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[thickness * 1.5, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
};

export default Crosshair;