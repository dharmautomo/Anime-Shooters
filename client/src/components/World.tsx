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
      
      {/* BIG TREE */}
      <group position={[-15, 0, -10]}>
        {/* Trunk */}
        <mesh position={[0, 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.7, 1, 4, 8]} />
          <meshStandardMaterial color="#6f4e37" />
        </mesh>
        
        {/* Foliage */}
        <mesh position={[0, 5, 0]} castShadow>
          <sphereGeometry args={[3.5, 16, 16]} />
          <meshStandardMaterial color="#6b8e23" />
        </mesh>
        <mesh position={[1, 4, 1]} castShadow>
          <sphereGeometry args={[2.5, 16, 16]} />
          <meshStandardMaterial color="#9acd32" />
        </mesh>
        <mesh position={[-1.5, 4.5, -0.5]} castShadow>
          <sphereGeometry args={[3, 16, 16]} />
          <meshStandardMaterial color="#6b8e23" />
        </mesh>
      </group>
      
      {/* SMALLER TREES */}
      {[-20, 5, 25].map((x, i) => (
        <group key={i} position={[x, 0, -30 + i * 10]}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.5, 3, 8]} />
            <meshStandardMaterial color="#6f4e37" />
          </mesh>
          <mesh position={[0, 3, 0]} castShadow>
            <sphereGeometry args={[1.5, 16, 16]} />
            <meshStandardMaterial color="#9acd32" />
          </mesh>
        </group>
      ))}
      
      {/* MOUNTAINS in background */}
      {[-40, -20, 0, 20, 40].map((x, i) => (
        <group key={i} position={[x, 0, -60]}>
          <mesh position={[0, 5 + (i % 3 * 2), 0]} castShadow>
            <coneGeometry args={[10, 10 + (i % 3 * 4), 4]} />
            <meshStandardMaterial color={mountainColor} />
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
