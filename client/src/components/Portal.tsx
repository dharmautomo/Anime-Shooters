import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { usePlayer } from '../lib/stores/usePlayer';

interface PortalProps {
  position: [number, number, number];
  destination: string;
  isEntry?: boolean;
  referrer?: string;
}

const Portal = ({ position, destination, isEntry = false, referrer }: PortalProps) => {
  const { playerName, position: playerPosition, rotation, health } = usePlayer();
  const textRef = useRef<any>(null);
  const [hovering, setHovering] = useState(false);
  const [time, setTime] = useState(0);
  const collisionThreshold = 2.5; // Increased from 1.5 to match the larger portal size
  const hasEnteredPortal = useRef(false);
  
  // Animate portal and check for collision
  useFrame((_, delta) => {
    // Update time for portal animation
    setTime(prev => prev + delta * 0.5);
    
    // Rotate portal text to always face player
    if (textRef.current) {
      textRef.current.lookAt(playerPosition);
    }
    
    // Check if player is close to the portal
    const distance = new THREE.Vector3(
      position[0], 
      position[1], 
      position[2]
    ).distanceTo(playerPosition);
    
    // Show hover effect when close
    setHovering(distance < collisionThreshold * 1.5);
    
    // Collision detection - if player enters the portal
    if (distance < collisionThreshold && !hasEnteredPortal.current) {
      // Set flag to prevent multiple redirections
      hasEnteredPortal.current = true;
      
      // Create URL with player parameters
      const params = new URLSearchParams();
      params.append('username', playerName);
      params.append('speed', '5'); // Default speed
      params.append('color', 'red'); // Default color
      
      // Add the referrer (which game they come from)
      const currentUrl = window.location.href.split('?')[0];
      params.append('ref', referrer || currentUrl);
      
      // Add portal=true parameter
      params.append('portal', 'true');
      
      // Redirect to the destination
      window.location.href = `${destination}?${params.toString()}`;
    }
  });
  
  // Portal colors
  const color1 = isEntry ? new THREE.Color('#4287f5') : new THREE.Color('#f542b9');
  const color2 = isEntry ? new THREE.Color('#42f5e3') : new THREE.Color('#f5e642');
  
  // Style for the portal label - increased font size
  const textStyle = {
    color: '#ffffff',
    fontSize: 0.35, // Increased from 0.2
    maxWidth: 3, // Increased from 2
    lineHeight: 1,
    textAlign: 'center' as const,
    outlineWidth: 0.02, // Increased from 0.01
    outlineColor: '#000000',
    fontWeight: 'bold' as const, // Make the text bold
  };
  
  return (
    <group position={[position[0], position[1], position[2]]}>
      {/* Glowing outer ring - increased size */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[2.0, 0.15, 20, 64]} /> {/* Increased from [1.2, 0.1, 16, 50] */}
        <meshStandardMaterial 
          color={isEntry ? '#00ffff' : '#ff00ff'} 
          emissive={isEntry ? '#00ffff' : '#ff00ff'} 
          emissiveIntensity={hovering ? 4 : 2} // Increased intensity
        />
      </mesh>
      
      {/* Portal surface - increased size */}
      <mesh>
        <circleGeometry args={[1.8, 40]} /> {/* Increased from [1, 32] */}
        <meshStandardMaterial 
          color={isEntry ? '#4287f5' : '#f542b9'}
          emissive={isEntry ? '#4287f5' : '#f542b9'}
          emissiveIntensity={2} // Increased from 1.5
          transparent={true}
          opacity={0.8}
        />
      </mesh>
      
      {/* Portal particles for effect - increased size and range */}
      {[...Array(7)].map((_, i) => ( // Increased particle count from 5 to 7
        <mesh 
          key={i} 
          position={[
            Math.sin(time + i * 1.5) * 0.9, // Increased range from 0.5 to 0.9
            Math.cos(time + i * 1.5) * 0.9, // Increased range from 0.5 to 0.9
            0.1
          ]}
        >
          <sphereGeometry args={[0.08, 10, 10]} /> {/* Increased from [0.05, 8, 8] */}
          <meshStandardMaterial 
            color={i % 2 === 0 ? color1 : color2}
            emissive={i % 2 === 0 ? color1 : color2}
            emissiveIntensity={2.5} // Increased from 2
          />
        </mesh>
      ))}
      
      {/* Portal label - position raised slightly */}
      <Text
        ref={textRef}
        position={[0, 2.4, 0]} // Increased height from 1.8 to 2.4
        {...textStyle}
      >
        {isEntry ? 'Entry Portal' : 'Vibeverse Portal'}
      </Text>
    </group>
  );
};

export default Portal;