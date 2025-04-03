import { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { usePlayer } from '../lib/stores/initializeStores';
import { useIsMobile, usePerformanceSettings } from '../hooks/use-is-mobile';

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
  const navigationAttempted = useRef(false);
  
  // Get device-specific performance settings
  const isMobile = useIsMobile();
  const { particleCount, particleDetail } = usePerformanceSettings();
  
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
    // Dynamically set fontSize based on device
    fontSize: isMobile ? 0.4 : 0.35, // Larger on mobile for better visibility
    maxWidth: 3,
    lineHeight: 1,
    textAlign: 'center' as const,
    outlineWidth: 0.02,
    outlineColor: '#000000',
    fontWeight: 'bold' as const,
  }), [isMobile]);
  
  // Function to safely handle portal navigation
  const navigateToDestination = () => {
    if (navigationAttempted.current) return; // Prevent multiple attempts
    
    try {
      navigationAttempted.current = true;
      
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
      
      // Add mobile parameter if needed
      if (isMobile) {
        params.append('mobile', 'true');
      }
      
      // For mobile: Use safer window.location replacement method
      window.location.replace(`${destination}?${params.toString()}`);
      
      console.log(`Navigating to ${destination}`);
    } catch (error) {
      console.error("Failed to navigate to portal destination:", error);
      // Reset the flag if navigation fails
      navigationAttempted.current = false;
      hasEnteredPortal.current = false;
    }
  };
  
  // Add a touch handler for mobile devices
  useEffect(() => {
    // For mobile, add a global click handler to prevent issues with portal navigation
    if (isMobile) {
      const handleTouch = () => {
        if (hasEnteredPortal.current && !navigationAttempted.current) {
          navigateToDestination();
        }
      };
      
      document.addEventListener('touchend', handleTouch);
      return () => document.removeEventListener('touchend', handleTouch);
    }
  }, [isMobile]);
  
  // Animate portal and check for collision
  useFrame((_, delta) => {
    // Update time for portal animation - use smaller delta on mobile for better performance
    setTime(prev => prev + delta * (isMobile ? 0.3 : 0.5));
    
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
      
      // On desktop, navigate immediately
      // On mobile, this will be handled by the touch handler
      if (!isMobile) {
        navigateToDestination();
      }
    }
  });
  
  // Create memoized particles to prevent recreation on each render - optimized for mobile
  const particles = useMemo(() => {
    // Return an array of particle meshes - fewer on mobile
    return Array.from({ length: particleCount }).map((_, i) => (
      <mesh 
        key={i} 
        position={[
          Math.sin(i * 1.5) * 0.9, 
          Math.cos(i * 1.5) * 0.9, 
          0.1
        ]}
      >
        <sphereGeometry args={[0.08, particleDetail, particleDetail]} />
        <meshStandardMaterial 
          color={i % 2 === 0 ? colors.color1 : colors.color2}
          emissive={i % 2 === 0 ? colors.color1 : colors.color2}
          emissiveIntensity={2.5}
          // Optimize for mobile
          fog={false}
          flatShading={isMobile}
        />
      </mesh>
    ));
  }, [colors, particleCount, particleDetail, isMobile]);
  
  // Update particle positions in useFrame
  useFrame(() => {
    if (!groupRef.current) return;
    
    // Update positions of particle meshes based on current time
    groupRef.current.children.forEach((child, i) => {
      if (i >= 2 && i < 2 + particleCount) { // Only update actual particles
        const particleIndex = i - 2;
        child.position.x = Math.sin(time + particleIndex * 1.5) * 0.9;
        child.position.y = Math.cos(time + particleIndex * 1.5) * 0.9;
      }
    });
  });
  
  // Geometry segments optimized for mobile
  const torusSegments = isMobile ? 16 : 64;
  const circleSegments = isMobile ? 20 : 40;
  
  return (
    <group ref={groupRef} position={[position[0], position[1], position[2]]}>
      {/* Glowing outer ring - optimized for mobile */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[2.0, 0.15, isMobile ? 8 : 20, torusSegments]} />
        <meshStandardMaterial 
          color={isEntry ? '#00ffff' : '#ff00ff'} 
          emissive={isEntry ? '#00ffff' : '#ff00ff'} 
          emissiveIntensity={hovering ? 4 : 2}
          transparent={true}
          opacity={0.9}
          fog={false}
          flatShading={isMobile}
        />
      </mesh>
      
      {/* Portal surface - optimized for mobile */}
      <mesh>
        <circleGeometry args={[1.8, circleSegments]} />
        <meshStandardMaterial 
          color={isEntry ? '#4287f5' : '#f542b9'}
          emissive={isEntry ? '#4287f5' : '#f542b9'}
          emissiveIntensity={2}
          transparent={true}
          opacity={0.8}
          side={THREE.DoubleSide} // Ensure portal is visible from both sides
          fog={false}
          flatShading={isMobile}
        />
      </mesh>
      
      {/* Portal particles for effect - precomputed and optimized for mobile */}
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