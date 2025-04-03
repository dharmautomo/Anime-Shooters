import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { usePlayer } from '../lib/stores/initializeStores';

interface PortalProps {
  position: [number, number, number];
  destination: string;
  isEntry?: boolean;
  referrer?: string;
}

const Portal = ({ position, destination, isEntry = false, referrer }: PortalProps) => {
  const { playerName, position: playerPosition, rotation, health } = usePlayer();
  const textRef = useRef<any>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [hovering, setHovering] = useState(false);
  const [time, setTime] = useState(0);
  const collisionThreshold = 2.5; // Increased from 1.5 to match the larger portal size
  const hasEnteredPortal = useRef(false);
  
  // Portal colors - use useMemo to prevent recreation on each render
  const colors = useMemo(() => {
    return {
      color1: isEntry ? new THREE.Color('#4287f5') : new THREE.Color('#f542b9'),
      color2: isEntry ? new THREE.Color('#42f5e3') : new THREE.Color('#f5e642')
    };
  }, [isEntry]);
  
  // Style for the portal label - use useMemo to prevent recreation
  const textStyle = useMemo(() => ({
    color: '#ffffff',
    fontSize: 0.35,
    maxWidth: 3,
    lineHeight: 1,
    textAlign: 'center' as const,
    outlineWidth: 0.02,
    outlineColor: '#000000',
    fontWeight: 'bold' as const,
  }), []);
  
  // Animate portal and check for collision
  useFrame((_, delta) => {
    // Update time for portal animation
    setTime(prev => prev + delta * 0.5);
    
    // Rotate portal text to always face player
    if (textRef.current) {
      textRef.current.lookAt(playerPosition);
    }
    
    // Make sure the entire portal group exists
    if (!groupRef.current) return;
    
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
      
      try {
        // Redirect to the destination
        window.location.href = `${destination}?${params.toString()}`;
      } catch (error) {
        console.error("Failed to navigate to portal destination:", error);
        // Reset the flag if navigation fails
        hasEnteredPortal.current = false;
      }
    }
  });
  
  // Create memoized particles to prevent recreation on each render
  const particles = useMemo(() => {
    // Return an array of particle meshes
    return Array.from({ length: 7 }).map((_, i) => (
      <mesh 
        key={i} 
        position={[
          Math.sin(i * 1.5) * 0.9, 
          Math.cos(i * 1.5) * 0.9, 
          0.1
        ]}
      >
        <sphereGeometry args={[0.08, 10, 10]} />
        <meshStandardMaterial 
          color={i % 2 === 0 ? colors.color1 : colors.color2}
          emissive={i % 2 === 0 ? colors.color1 : colors.color2}
          emissiveIntensity={2.5}
        />
      </mesh>
    ));
  }, [colors]);
  
  // Update particle positions in useFrame
  useFrame(() => {
    if (!groupRef.current) return;
    
    // Update positions of particle meshes based on current time
    groupRef.current.children.forEach((child, i) => {
      if (i >= 2 && i < 9) { // particles are children 2-8 (after the torus and circle)
        const particleIndex = i - 2;
        child.position.x = Math.sin(time + particleIndex * 1.5) * 0.9;
        child.position.y = Math.cos(time + particleIndex * 1.5) * 0.9;
      }
    });
  });
  
  return (
    <group ref={groupRef} position={[position[0], position[1], position[2]]}>
      {/* Glowing outer ring - increased size */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[2.0, 0.15, 20, 64]} />
        <meshStandardMaterial 
          color={isEntry ? '#00ffff' : '#ff00ff'} 
          emissive={isEntry ? '#00ffff' : '#ff00ff'} 
          emissiveIntensity={hovering ? 4 : 2}
          transparent={true}
          opacity={0.9}
        />
      </mesh>
      
      {/* Portal surface - increased size */}
      <mesh>
        <circleGeometry args={[1.8, 40]} />
        <meshStandardMaterial 
          color={isEntry ? '#4287f5' : '#f542b9'}
          emissive={isEntry ? '#4287f5' : '#f542b9'}
          emissiveIntensity={2}
          transparent={true}
          opacity={0.8}
          side={THREE.DoubleSide} // Ensure portal is visible from both sides
        />
      </mesh>
      
      {/* Portal particles for effect - precomputed */}
      {particles}
      
      {/* Portal label - position raised slightly */}
      <Text
        ref={textRef}
        position={[0, 2.4, 0]}
        {...textStyle}
      >
        {isEntry ? 'Entry Portal' : 'Vibeverse Portal'}
      </Text>
    </group>
  );
};

export default Portal;