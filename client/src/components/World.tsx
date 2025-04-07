import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import Portal from './Portal';
import BabyMonster from './BabyMonster';
import { useEffect, useState, useMemo } from 'react';

// Helper function to check if coming from portal
const isComingFromPortal = () => {
  return new URLSearchParams(window.location.search).get('portal') === 'true';
};

const World = () => {
  const [referrerUrl, setReferrerUrl] = useState<string | null>(null);
  
  // Get the referrer from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferrerUrl(ref);
    }
  }, []);
  // Load textures
  const grassTexture = useTexture('/textures/grass.png');
  const sandTexture = useTexture('/textures/sand.jpg');
  const skyTexture = useTexture('/textures/sky.png');
  
  // Repeat textures
  grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(30, 30);
  
  // Colors for countryside aesthetic
  const mountainColor = new THREE.Color('#5c8474'); // Green-blue mountains
  const pathColor = new THREE.Color('#d9be7c'); // Sandy path
  
  return (
    <>
      {/* Warmer ambient light for sunny day feel */}
      <ambientLight intensity={0.7} color="#fff8e6" />
      
      {/* Directional light for a sunny day */}
      <directionalLight 
        position={[20, 40, 10]} 
        intensity={1.2} 
        castShadow 
        shadow-mapSize-width={2048} 
        shadow-mapSize-height={2048}
        color="#fffaf0"
      />
      
      {/* Ground plane with grass texture */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.05, 0]} 
        receiveShadow
      >
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial 
          map={grassTexture} 
          roughness={0.8}
          color="#a0d850"
        />
      </mesh>
      
      {/* Dirt path - using a slightly elevated mesh to avoid z-fighting */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.04, 0]} 
        receiveShadow
      >
        <planeGeometry args={[4, 80]} />
        <meshStandardMaterial 
          map={sandTexture} 
          roughness={0.9}
          color={pathColor}
        />
      </mesh>
      
      {/* Houses and barn have been removed */}
      
      {/* BIG TREES - Multiple large trees around the map - using useMemo to prevent re-rendering */}
      {useMemo(() => {
        // Big tree positions - increased spacing
        const bigTreePositions = [
          [-22, 0, -15],   // Original big tree - moved further
          [22, 0, -22],    // Right side of path - moved further
          [-45, 0, -30],   // Further left - moved further
          [38, 0, -45],    // Further right - moved further
          [-30, 0, 22],    // Behind player - moved further
          [27, 0, 38],     // Behind player on right - moved further
          [-60, 0, 0],     // Far left - moved further
          [52, 0, 8]       // Far right - moved further
        ];
        
        return bigTreePositions.map((pos, i) => {
          // Calculate deterministic properties for each tree to avoid randomness
          const trunkTopRadius = 0.6 + (Math.sin(i * 567.89) * 0.1 + 0.1);
          const trunkBottomRadius = 0.8 + (Math.cos(i * 345.67) * 0.2 + 0.2);
          const trunkHeight = 3.5 + (Math.sin(i * 234.56) * 0.5);
          
          // Foliage offsets
          const foliage1Y = 5 + (i % 2 * 0.5);
          const foliage1Size = 3 + (i % 3 * 0.5);
          
          const foliage2X = 0.8 + (i % 2 * 0.4);
          const foliage2Y = 4 + (i % 3 * 0.3);
          const foliage2Z = 0.8;
          const foliage2Size = 2.2 + (i % 2 * 0.6);
          
          const foliage3X = -1.2 - (i % 2 * 0.5);
          const foliage3Y = 4.5 + (i % 3 * 0.2);
          const foliage3Z = -0.4 - (i % 2 * 0.3);
          const foliage3Size = 2.8 + (i % 3 * 0.4);
          
          // Stable colors
          const trunkColor = i % 2 === 0 ? "#6f4e37" : "#8b5a2b";
          const foliage1Color = i % 3 === 0 ? "#6b8e23" : i % 3 === 1 ? "#556b2f" : "#8fbc8f";
          const foliage2Color = i % 3 === 0 ? "#9acd32" : i % 3 === 1 ? "#6b8e23" : "#8fbc8f";
          const foliage3Color = i % 3 === 0 ? "#6b8e23" : i % 3 === 1 ? "#9acd32" : "#556b2f";
          
          return (
            <group key={`big-tree-${i}`} position={[pos[0], 0, pos[2]]}>
              {/* Elevate the entire trunk slightly to ensure it rests completely on the ground */}
              <mesh position={[0, trunkHeight/2, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[trunkTopRadius, trunkBottomRadius, trunkHeight, 8]} />
                <meshStandardMaterial color={trunkColor} />
              </mesh>
              
              {/* Foliage - with some variation */}
              <mesh position={[0, foliage1Y, 0]} castShadow>
                <sphereGeometry args={[foliage1Size, 16, 16]} />
                <meshStandardMaterial color={foliage1Color} />
              </mesh>
              <mesh position={[foliage2X, foliage2Y, foliage2Z]} castShadow>
                <sphereGeometry args={[foliage2Size, 16, 16]} />
                <meshStandardMaterial color={foliage2Color} />
              </mesh>
              <mesh position={[foliage3X, foliage3Y, foliage3Z]} castShadow>
                <sphereGeometry args={[foliage3Size, 16, 16]} />
                <meshStandardMaterial color={foliage3Color} />
              </mesh>
            </group>
          );
        });
      }, [])}
      
      {/* SMALLER TREES - Even more trees for a denser forest feel - using useMemo to prevent re-rendering */}
      {useMemo(() => {
        // Create an array to store tree data with further increased spacing (multiplied positions by ~2)
        const treeData = [
          // Left side of the path
          [-45, 0, -65], [-36, 0, -56], [-58, 0, -45], [-40, 0, -33], [-50, 0, -22], 
          [-23, 0, -80], [-12, 0, -63], [-28, 0, -50], [-18, 0, -33], [-35, 0, -12],
          [-68, 0, -80], [-80, 0, -58], [-90, 0, -33], [-85, 0, -12], [-72, 0, 12],
          [-58, 0, 22], [-40, 0, 33], [-63, 0, 45], [-50, 0, 68], [-80, 0, 80],
          
          // Right side of the path
          [45, 0, -65], [33, 0, -58], [58, 0, -45], [40, 0, -33], [50, 0, -22],
          [23, 0, -80], [12, 0, -63], [28, 0, -50], [18, 0, -33], [33, 0, -12],
          [68, 0, -80], [80, 0, -58], [90, 0, -33], [85, 0, -12], [72, 0, 12],
          [58, 0, 22], [40, 0, 33], [63, 0, 45], [50, 0, 68], [80, 0, 80],
          
          // Further back trees
          [-100, 0, -100], [-78, 0, -112], [-58, 0, -124], [-33, 0, -135], [-12, 0, -145],
          [12, 0, -145], [33, 0, -135], [58, 0, -124], [78, 0, -112], [100, 0, -100],
          
          // Further forward trees
          [-100, 0, 100], [-78, 0, 112], [-58, 0, 124], [-33, 0, 135], [-12, 0, 145],
          [12, 0, 145], [33, 0, 135], [58, 0, 124], [78, 0, 112], [100, 0, 100],
          
          // Additional trees - left far flank
          [-135, 0, -90], [-122, 0, -68], [-145, 0, -45], [-130, 0, -22], [-140, 0, 0], 
          [-134, 0, 22], [-145, 0, 45], [-130, 0, 68], [-142, 0, 90],
          
          // Additional trees - right far flank
          [135, 0, -90], [122, 0, -68], [145, 0, -45], [130, 0, -22], [140, 0, 0], 
          [134, 0, 22], [145, 0, 45], [130, 0, 68], [142, 0, 90],
          
          // Less dense forest - left intermediate trees with even more spacing
          [-33, 0, -100], [-52, 0, -88], [-70, 0, -72], [-40, 0, -62], [-62, 0, -50],
          [-25, 0, -44], [-50, 0, -38], [-75, 0, -33], [-65, 0, -20], [-85, 0, -25],
          [-32, 0, -22], [-45, 0, -10], [-72, 0, -5], [-58, 0, 18], [-85, 0, 28],
          [-44, 0, 44], [-70, 0, 50], [-52, 0, 66], [-75, 0, 72], [-58, 0, 85],
          
          // Less dense forest - right intermediate trees with even more spacing
          [33, 0, -100], [52, 0, -88], [70, 0, -72], [40, 0, -62], [62, 0, -50],
          [25, 0, -44], [50, 0, -38], [75, 0, -33], [65, 0, -20], [85, 0, -25],
          [32, 0, -22], [45, 0, -10], [72, 0, -5], [58, 0, 18], [85, 0, 28],
          [44, 0, 44], [70, 0, 50], [52, 0, 66], [75, 0, 72], [58, 0, 85]
        ];
        
        // Pre-compute all randomized values for each tree
        const trees = treeData.map((pos, i) => {
          // Calculate stable random offsets - even more spread (multiplier 8 instead of 5)
          const offsetX = (Math.sin(i * 327.21) * 8 - 4);
          const offsetZ = (Math.cos(i * 189.55) * 8 - 4);
          
          // Calculate trunk properties
          const trunkTopRadius = 0.2 + (Math.sin(i * 43.12) * 0.1 + 0.1);
          const trunkBottomRadius = 0.4 + (Math.cos(i * 79.31) * 0.1 + 0.1);
          const trunkHeight = 2.8 + (Math.sin(i * 123.45) * 0.25 + 0.25);
          
          // Calculate foliage properties
          const foliageY = 3 + (Math.sin(i * 231.67) * 0.2 + 0.2);
          const foliageSize = 1 + (Math.cos(i * 192.87) * 0.4 + 0.4);
          
          // Stable color selection
          const trunkColor = i % 2 === 0 ? "#6f4e37" : "#8b5a2b";
          const foliageColor = i % 5 === 0 ? "#6b8e23" : 
                               i % 5 === 1 ? "#9acd32" : 
                               i % 5 === 2 ? "#8fbc8f" : 
                               i % 5 === 3 ? "#556b2f" : "#7c9340";
          
          return {
            // Modify position: ensure the y value is 0 to place trees properly on the ground
            position: [pos[0] + offsetX, 0, pos[2] + offsetZ],
            trunk: {
              topRadius: trunkTopRadius,
              bottomRadius: trunkBottomRadius,
              height: trunkHeight,
              color: trunkColor
            },
            foliage: {
              y: foliageY,
              size: foliageSize,
              color: foliageColor
            }
          };
        });
        
        // Return the JSX with stable values
        return trees.map((tree, i) => {
          // Convert the position array to Vector3 tuple to fix TypeScript error
          const position: [number, number, number] = [
            tree.position[0] as number, 
            tree.position[1] as number, 
            tree.position[2] as number
          ];
          
          return (
            <group key={`small-tree-${i}`} position={position}>
              {/* Position trunk at trunkHeight/2 to ensure proper grounding */}
              <mesh position={[0, tree.trunk.height/2, 0]} castShadow>
                <cylinderGeometry args={[
                  tree.trunk.topRadius, 
                  tree.trunk.bottomRadius, 
                  tree.trunk.height, 
                  8
                ]} />
                <meshStandardMaterial color={tree.trunk.color} />
              </mesh>
              {/* Update foliage y position to be relative to new trunk position */}
              <mesh position={[0, tree.trunk.height + tree.foliage.size * 0.5, 0]} castShadow>
                <sphereGeometry args={[tree.foliage.size, 16, 16]} />
                <meshStandardMaterial color={tree.foliage.color} />
              </mesh>
            </group>
          );
        });
      }, [])}
      
      {/* MOUNTAINS - using useMemo to prevent re-rendering */}
      {useMemo(() => {
        // Mountain positions with more spacing
        const farMountainPositions = [-120, -90, -60, -30, 0, 30, 60, 90, 120];
        const midMountainPositions = [-100, -70, -40, -10, 20, 50, 80, 110];
        
        // Dimmer color for distant mountains
        const farMountainColor = new THREE.Color(mountainColor).multiplyScalar(0.9);
        
        return (
          <>
            {/* Far background mountains */}
            {farMountainPositions.map((x, i) => {
              // Add more randomness to mountain positions
              const offsetX = (Math.sin(i * 152.76) * 15);
              
              // Calculate cone size and height for proper grounding
              const baseRadius = 8 + (i % 3 * 2);
              const height = 12 + (i % 4 * 3);
              
              return (
                <group key={`bg-mountain-${i}`} position={[x + offsetX, 0, -120]}>
                  {/* Position y=height/2 to ensure the cone's base is at ground level */}
                  <mesh position={[0, height/2, 0]} castShadow>
                    <coneGeometry args={[baseRadius, height, 5]} />
                    <meshStandardMaterial color={farMountainColor} />
                  </mesh>
                </group>
              );
            })}
            
            {/* Mid-range mountains */}
            {midMountainPositions.map((x, i) => {
              // Add more randomness to mountain positions
              const offsetX = (Math.cos(i * 89.43) * 12);
              
              // Calculate cone size and height for proper grounding
              const baseRadius = 7 + (i % 3 * 2);
              const height = 10 + (i % 3 * 4);
              
              return (
                <group key={`mid-mountain-${i}`} position={[x + offsetX, 0, -90]}>
                  {/* Position y=height/2 to ensure the cone's base is at ground level */}
                  <mesh position={[0, height/2, 0]} castShadow>
                    <coneGeometry args={[baseRadius, height, 5]} />
                    <meshStandardMaterial color={mountainColor} />
                  </mesh>
                </group>
              );
            })}
          </>
        );
      }, [mountainColor])}
      
      {/* Hills - using useMemo to prevent re-rendering */}
      {useMemo(() => {
        // Left side hill positions - even more spacing for less crowding
        const leftHillPositions = [
          [-90, 0, -90], [-68, 0, -80], [-102, 0, -58], [-45, 0, -90], 
          [-112, 0, -33], [-78, 0, -22], [-58, 0, -12], [-90, 0, 12], 
          [-68, 0, 33], [-102, 0, 58], [-78, 0, 78], [-58, 0, 102]
        ];
        
        // Right side hill positions - even more spacing for less crowding
        const rightHillPositions = [
          [90, 0, -90], [68, 0, -80], [102, 0, -58], [45, 0, -90], 
          [112, 0, -33], [78, 0, -22], [58, 0, -12], [90, 0, 12], 
          [68, 0, 33], [102, 0, 58], [78, 0, 78], [58, 0, 102]
        ];
        
        // Process all hills with additional random offsets, ensuring they're grounded
        const processHills = (hillPositions: number[][], side: string) => {
          return hillPositions.map((pos, i) => {
            // Add stable random offsets for more random spread
            const offsetX = (Math.sin(i * 123.45) * 10 - 5);
            const offsetZ = (Math.cos(i * 78.91) * 10 - 5);
            
            // Instead of using spheres for hills, we'll use half-spheres (hemispheres)
            // that sit directly on the ground
            const size = 3 + (i % 4);
            
            // Generate a deterministic color value between 0-0.3
            const colorBlend = Math.abs(Math.sin(i * 123.456)) * 0.3;
            
            return (
              <group key={`hill-${side}-${i}`} position={[pos[0] + offsetX, 0, pos[2] + offsetZ]}>
                {/* Create a simple mound for the hill using a sphere that's positioned to sit on the ground */}
                <mesh position={[0, size/2, 0]} castShadow receiveShadow>
                  {/* Use regular sphere but position it so that the bottom is at ground level */}
                  <sphereGeometry args={[size, 16, 16]} />
                  <meshStandardMaterial 
                    color={new THREE.Color('#6b8e23').lerp(new THREE.Color('#4a7023'), colorBlend)} 
                    roughness={0.8}
                  />
                </mesh>
              </group>
            );
          });
        };
        
        return (
          <>
            {/* Left side hills */}
            {processHills(leftHillPositions, 'left')}
            {/* Right side hills */}
            {processHills(rightHillPositions, 'right')}
          </>
        );
      }, [])}
      
      {/* Skybox */}
      <mesh>
        <sphereGeometry args={[500, 60, 40]} />
        <meshBasicMaterial
          map={skyTexture}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Baby Monster - Animated 3D Character */}
      <BabyMonster 
        position={[8, 0, -8]} 
        scale={0.8} 
        rotation={Math.PI / 4}
      />
      
      {/* Exit Portal - Leads to the Vibeverse */}
      <Portal 
        position={[0, 1.5, -15]} 
        destination="http://portal.pieter.com" 
        isEntry={false} 
      />
      
      {/* Entry Portal - If coming from another game */}
      {isComingFromPortal() && referrerUrl && (
        <Portal 
          position={[0, 1.5, 15]} 
          destination={referrerUrl} 
          isEntry={true}
          referrer={referrerUrl} 
        />
      )}
    </>
  );
};

export default World;
