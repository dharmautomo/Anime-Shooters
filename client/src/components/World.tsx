import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import Portal from './Portal';
import { useEffect, useState } from 'react';

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
      
      {/* BIG TREES - Multiple large trees around the map */}
      {[
        [-15, 0, -10],  // Original big tree
        [15, 0, -15],   // Right side of path
        [-30, 0, -20],  // Further left
        [25, 0, -30],   // Further right
        [-20, 0, 15],   // Behind player
        [18, 0, 25],    // Behind player on right
        [-40, 0, 0],    // Far left
        [35, 0, 5]      // Far right
      ].map((pos, i) => (
        <group key={`big-tree-${i}`} position={[pos[0], pos[1], pos[2]]}>
          {/* Trunk */}
          <mesh position={[0, 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.6 + Math.random() * 0.2, 0.8 + Math.random() * 0.4, 3.5 + Math.random(), 8]} />
            <meshStandardMaterial color={i % 2 === 0 ? "#6f4e37" : "#8b5a2b"} />
          </mesh>
          
          {/* Foliage - with some variation */}
          <mesh position={[0, 5 + (i % 2 * 0.5), 0]} castShadow>
            <sphereGeometry args={[3 + (i % 3 * 0.5), 16, 16]} />
            <meshStandardMaterial color={i % 3 === 0 ? "#6b8e23" : i % 3 === 1 ? "#556b2f" : "#8fbc8f"} />
          </mesh>
          <mesh position={[0.8 + (i % 2 * 0.4), 4 + (i % 3 * 0.3), 0.8]} castShadow>
            <sphereGeometry args={[2.2 + (i % 2 * 0.6), 16, 16]} />
            <meshStandardMaterial color={i % 3 === 0 ? "#9acd32" : i % 3 === 1 ? "#6b8e23" : "#8fbc8f"} />
          </mesh>
          <mesh position={[-1.2 - (i % 2 * 0.5), 4.5 + (i % 3 * 0.2), -0.4 - (i % 2 * 0.3)]} castShadow>
            <sphereGeometry args={[2.8 + (i % 3 * 0.4), 16, 16]} />
            <meshStandardMaterial color={i % 3 === 0 ? "#6b8e23" : i % 3 === 1 ? "#9acd32" : "#556b2f"} />
          </mesh>
        </group>
      ))}
      
      {/* SMALLER TREES - Even more trees for a denser forest feel */}
      {[
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
      ].map((pos, i) => (
        <group key={i} position={[pos[0] + (Math.random() * 2 - 1), pos[1], pos[2] + (Math.random() * 2 - 1)]}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <cylinderGeometry args={[0.2 + Math.random() * 0.2, 0.4 + Math.random() * 0.2, 2.8 + Math.random() * 0.5, 8]} />
            <meshStandardMaterial color={i % 2 === 0 ? "#6f4e37" : "#8b5a2b"} />
          </mesh>
          <mesh position={[0, 3 + (Math.random() * 0.4 - 0.2), 0]} castShadow>
            {/* Vary the tree sizes slightly */}
            <sphereGeometry args={[1 + Math.random() * 0.8, 16, 16]} />
            {/* Vary the tree colors slightly */}
            <meshStandardMaterial color={i % 5 === 0 ? "#6b8e23" : i % 5 === 1 ? "#9acd32" : i % 5 === 2 ? "#8fbc8f" : i % 5 === 3 ? "#556b2f" : "#7c9340"} />
          </mesh>
        </group>
      ))}
      
      {/* MOUNTAINS and HILLS - Expanded with more variety */}
      {/* Far background mountains */}
      {[-60, -45, -30, -15, 0, 15, 30, 45, 60].map((x, i) => (
        <group key={`bg-mountain-${i}`} position={[x, 0, -80]}>
          <mesh position={[0, 7 + (i % 4 * 2), 0]} castShadow>
            <coneGeometry args={[8 + (i % 3 * 2), 12 + (i % 4 * 3), 5]} />
            <meshStandardMaterial color={new THREE.Color(mountainColor).multiplyScalar(0.9)} />
          </mesh>
        </group>
      ))}
      
      {/* Mid-range mountains */}
      {[-50, -35, -20, -5, 10, 25, 40, 55].map((x, i) => (
        <group key={`mid-mountain-${i}`} position={[x, 0, -60]}>
          <mesh position={[0, 5 + (i % 3 * 2), 0]} castShadow>
            <coneGeometry args={[7 + (i % 3 * 2), 10 + (i % 3 * 4), 5]} />
            <meshStandardMaterial color={mountainColor} />
          </mesh>
        </group>
      ))}
      
      {/* Hills on left side */}
      {[
        [-40, 0, -40], [-30, 0, -35], [-45, 0, -25], [-20, 0, -40], 
        [-50, 0, -15], [-35, 0, -10], [-25, 0, -5], [-40, 0, 5], 
        [-30, 0, 15], [-45, 0, 25], [-35, 0, 35], [-25, 0, 45]
      ].map((pos, i) => (
        <group key={`hill-left-${i}`} position={[pos[0], pos[1], pos[2]]}>
          <mesh position={[0, 1.5 + (i % 3), 0]} castShadow receiveShadow>
            <sphereGeometry args={[3 + (i % 4), 16, 16]} />
            <meshStandardMaterial 
              color={new THREE.Color('#6b8e23').lerp(new THREE.Color('#4a7023'), Math.random() * 0.3)} 
              roughness={0.8}
            />
          </mesh>
        </group>
      ))}
      
      {/* Hills on right side */}
      {[
        [40, 0, -40], [30, 0, -35], [45, 0, -25], [20, 0, -40], 
        [50, 0, -15], [35, 0, -10], [25, 0, -5], [40, 0, 5], 
        [30, 0, 15], [45, 0, 25], [35, 0, 35], [25, 0, 45]
      ].map((pos, i) => (
        <group key={`hill-right-${i}`} position={[pos[0], pos[1], pos[2]]}>
          <mesh position={[0, 1.5 + (i % 3), 0]} castShadow receiveShadow>
            <sphereGeometry args={[3 + (i % 4), 16, 16]} />
            <meshStandardMaterial 
              color={new THREE.Color('#6b8e23').lerp(new THREE.Color('#4a7023'), Math.random() * 0.3)} 
              roughness={0.8}
            />
          </mesh>
        </group>
      ))}
      
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
