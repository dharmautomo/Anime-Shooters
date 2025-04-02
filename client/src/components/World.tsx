import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import Portal from './Portal';
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
        // Big tree positions
        const bigTreePositions = [
          [-15, 0, -10],  // Original big tree
          [15, 0, -15],   // Right side of path
          [-30, 0, -20],  // Further left
          [25, 0, -30],   // Further right
          [-20, 0, 15],   // Behind player
          [18, 0, 25],    // Behind player on right
          [-40, 0, 0],    // Far left
          [35, 0, 5]      // Far right
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
            <group key={`big-tree-${i}`} position={[pos[0], pos[1], pos[2]]}>
              {/* Trunk */}
              <mesh position={[0, 2, 0]} castShadow receiveShadow>
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
        // Create an array to store tree data
        const treeData = [
          // Left side of the path
          [-20, 0, -30], [-15, 0, -25], [-25, 0, -20], [-18, 0, -15], [-22, 0, -10], 
          [-10, 0, -35], [-5, 0, -28], [-12, 0, -22], [-8, 0, -15], [-15, 0, -5],
          [-30, 0, -35], [-35, 0, -25], [-40, 0, -15], [-38, 0, -5], [-32, 0, 5],
          [-25, 0, 10], [-18, 0, 15], [-28, 0, 20], [-22, 0, 30], [-35, 0, 35],
          
          // Right side of the path
          [20, 0, -30], [15, 0, -25], [25, 0, -20], [18, 0, -15], [22, 0, -10],
          [10, 0, -35], [5, 0, -28], [12, 0, -22], [8, 0, -15], [15, 0, -5],
          [30, 0, -35], [35, 0, -25], [40, 0, -15], [38, 0, -5], [32, 0, 5],
          [25, 0, 10], [18, 0, 15], [28, 0, 20], [22, 0, 30], [35, 0, 35],
          
          // Further back trees
          [-45, 0, -45], [-35, 0, -50], [-25, 0, -55], [-15, 0, -60], [-5, 0, -65],
          [5, 0, -65], [15, 0, -60], [25, 0, -55], [35, 0, -50], [45, 0, -45],
          
          // Further forward trees
          [-45, 0, 45], [-35, 0, 50], [-25, 0, 55], [-15, 0, 60], [-5, 0, 65],
          [5, 0, 65], [15, 0, 60], [25, 0, 55], [35, 0, 50], [45, 0, 45],
          
          // Additional trees - left far flank
          [-60, 0, -40], [-55, 0, -30], [-65, 0, -20], [-58, 0, -10], [-62, 0, 0], 
          [-59, 0, 10], [-64, 0, 20], [-57, 0, 30], [-63, 0, 40],
          
          // Additional trees - right far flank
          [60, 0, -40], [55, 0, -30], [65, 0, -20], [58, 0, -10], [62, 0, 0], 
          [59, 0, 10], [64, 0, 20], [57, 0, 30], [63, 0, 40],
          
          // Dense forest - left intermediate trees 
          [-15, 0, -45], [-23, 0, -39], [-31, 0, -32], [-18, 0, -27], [-27, 0, -22],
          [-11, 0, -19], [-22, 0, -17], [-33, 0, -15], [-29, 0, -9], [-37, 0, -11],
          [-14, 0, -10], [-20, 0, -4], [-32, 0, -2], [-26, 0, 8], [-37, 0, 12],
          [-19, 0, 19], [-31, 0, 23], [-23, 0, 29], [-33, 0, 32], [-25, 0, 38],
          
          // Dense forest - right intermediate trees
          [15, 0, -45], [23, 0, -39], [31, 0, -32], [18, 0, -27], [27, 0, -22],
          [11, 0, -19], [22, 0, -17], [33, 0, -15], [29, 0, -9], [37, 0, -11],
          [14, 0, -10], [20, 0, -4], [32, 0, -2], [26, 0, 8], [37, 0, 12],
          [19, 0, 19], [31, 0, 23], [23, 0, 29], [33, 0, 32], [25, 0, 38]
        ];
        
        // Pre-compute all randomized values for each tree
        const trees = treeData.map((pos, i) => {
          // Calculate stable random offsets
          const offsetX = (Math.sin(i * 327.21) * 2 - 1);
          const offsetZ = (Math.cos(i * 189.55) * 2 - 1);
          
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
            position: [pos[0] + offsetX, pos[1], pos[2] + offsetZ],
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
        return trees.map((tree, i) => (
          <group key={`small-tree-${i}`} position={tree.position}>
            <mesh position={[0, 1.5, 0]} castShadow>
              <cylinderGeometry args={[
                tree.trunk.topRadius, 
                tree.trunk.bottomRadius, 
                tree.trunk.height, 
                8
              ]} />
              <meshStandardMaterial color={tree.trunk.color} />
            </mesh>
            <mesh position={[0, tree.foliage.y, 0]} castShadow>
              <sphereGeometry args={[tree.foliage.size, 16, 16]} />
              <meshStandardMaterial color={tree.foliage.color} />
            </mesh>
          </group>
        ));
      }, [])}
      
      {/* MOUNTAINS - using useMemo to prevent re-rendering */}
      {useMemo(() => {
        // Mountain positions 
        const farMountainPositions = [-60, -45, -30, -15, 0, 15, 30, 45, 60];
        const midMountainPositions = [-50, -35, -20, -5, 10, 25, 40, 55];
        
        // Dimmer color for distant mountains
        const farMountainColor = new THREE.Color(mountainColor).multiplyScalar(0.9);
        
        return (
          <>
            {/* Far background mountains */}
            {farMountainPositions.map((x, i) => (
              <group key={`bg-mountain-${i}`} position={[x, 0, -80]}>
                <mesh position={[0, 7 + (i % 4 * 2), 0]} castShadow>
                  <coneGeometry args={[8 + (i % 3 * 2), 12 + (i % 4 * 3), 5]} />
                  <meshStandardMaterial color={farMountainColor} />
                </mesh>
              </group>
            ))}
            
            {/* Mid-range mountains */}
            {midMountainPositions.map((x, i) => (
              <group key={`mid-mountain-${i}`} position={[x, 0, -60]}>
                <mesh position={[0, 5 + (i % 3 * 2), 0]} castShadow>
                  <coneGeometry args={[7 + (i % 3 * 2), 10 + (i % 3 * 4), 5]} />
                  <meshStandardMaterial color={mountainColor} />
                </mesh>
              </group>
            ))}
          </>
        );
      }, [mountainColor])}
      
      {/* Hills - using useMemo to prevent re-rendering */}
      {useMemo(() => {
        // Left side hill positions
        const leftHillPositions = [
          [-40, 0, -40], [-30, 0, -35], [-45, 0, -25], [-20, 0, -40], 
          [-50, 0, -15], [-35, 0, -10], [-25, 0, -5], [-40, 0, 5], 
          [-30, 0, 15], [-45, 0, 25], [-35, 0, 35], [-25, 0, 45]
        ];
        
        // Right side hill positions
        const rightHillPositions = [
          [40, 0, -40], [30, 0, -35], [45, 0, -25], [20, 0, -40], 
          [50, 0, -15], [35, 0, -10], [25, 0, -5], [40, 0, 5], 
          [30, 0, 15], [45, 0, 25], [35, 0, 35], [25, 0, 45]
        ];
        
        // Process all hills
        const processHills = (hillPositions, side) => {
          return hillPositions.map((pos, i) => {
            // Compute stable properties
            const height = 1.5 + (i % 3);
            const size = 3 + (i % 4);
            // Generate a deterministic color value between 0-0.3
            const colorBlend = Math.abs(Math.sin(i * 123.456)) * 0.3;
            
            return (
              <group key={`hill-${side}-${i}`} position={[pos[0], pos[1], pos[2]]}>
                <mesh position={[0, height, 0]} castShadow receiveShadow>
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
      
      {/* Exit Portal - Leads to the Vibeverse */}
      <Portal 
        position={[0, 1, -15]} 
        destination="http://portal.pieter.com" 
        isEntry={false} 
      />
      
      {/* Entry Portal - If coming from another game */}
      {isComingFromPortal() && referrerUrl && (
        <Portal 
          position={[0, 1, 15]} 
          destination={referrerUrl} 
          isEntry={true}
          referrer={referrerUrl} 
        />
      )}
    </>
  );
};

export default World;
