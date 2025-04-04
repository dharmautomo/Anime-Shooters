import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CrosshairProps {
  color?: string;
  size?: number;
  thickness?: number;
  gap?: number;
}

const Crosshair = ({
  color = '#ffffff',
  size = 0.03,
  thickness = 0.003,
  gap = 0.005
}: CrosshairProps) => {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  
  // Create a 2D HTML crosshair overlay
  useEffect(() => {
    // Create a crosshair element
    const crosshairContainer = document.createElement('div');
    crosshairContainer.id = 'crosshair-container';
    crosshairContainer.style.position = 'fixed';
    crosshairContainer.style.top = '50%';
    crosshairContainer.style.left = '50%';
    crosshairContainer.style.transform = 'translate(-50%, -50%)';
    crosshairContainer.style.pointerEvents = 'none';
    crosshairContainer.style.zIndex = '1000';
    
    // Create the crosshair lines
    const createCrosshairLine = (rotation: string, width: string, height: string) => {
      const line = document.createElement('div');
      line.style.position = 'absolute';
      line.style.backgroundColor = color;
      line.style.width = width;
      line.style.height = height;
      line.style.transform = rotation;
      return line;
    };
    
    // Vertical top line
    const topLine = createCrosshairLine('translate(-50%, 0)', '2px', '15px');
    topLine.style.top = '-20px';
    topLine.style.left = '50%';
    
    // Vertical bottom line
    const bottomLine = createCrosshairLine('translate(-50%, 0)', '2px', '15px');
    bottomLine.style.bottom = '-20px';
    bottomLine.style.left = '50%';
    
    // Horizontal left line
    const leftLine = createCrosshairLine('translate(0, -50%)', '15px', '2px');
    leftLine.style.left = '-20px';
    leftLine.style.top = '50%';
    
    // Horizontal right line
    const rightLine = createCrosshairLine('translate(0, -50%)', '15px', '2px');
    rightLine.style.right = '-20px';
    rightLine.style.top = '50%';
    
    // Center dot
    const centerDot = createCrosshairLine('translate(-50%, -50%)', '4px', '4px');
    centerDot.style.left = '50%';
    centerDot.style.top = '50%';
    centerDot.style.borderRadius = '50%';
    
    // Add all parts to the container
    crosshairContainer.appendChild(topLine);
    crosshairContainer.appendChild(bottomLine);
    crosshairContainer.appendChild(leftLine);
    crosshairContainer.appendChild(rightLine);
    crosshairContainer.appendChild(centerDot);
    
    // Add the crosshair to the DOM
    document.body.appendChild(crosshairContainer);
    
    // Cleanup when component unmounts
    return () => {
      if (document.getElementById('crosshair-container')) {
        document.body.removeChild(crosshairContainer);
      }
    };
  }, [color]);
  
  // We also include a 3D crosshair as a backup
  useEffect(() => {
    if (!groupRef.current) return;
    
    // Position crosshair in front of camera
    groupRef.current.position.z = -1; // Further away to avoid clipping
    
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
      {/* We'll keep a minimal 3D crosshair as backup */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.003, 8, 8]} />
        <meshBasicMaterial color={color} depthTest={false} />
      </mesh>
    </group>
  );
};

export default Crosshair;