import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

const World = () => {
  // Load textures
  const floorTexture = useTexture('/textures/asphalt.png');
  const wallTexture = useTexture('/textures/wood.jpg');
  const obstacleTexture = useTexture('/textures/sand.jpg');
  
  // Repeat textures for floor and walls
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(10, 10);
  wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
  wallTexture.repeat.set(3, 3);
  
  // Define obstacle positions
  const obstacles = [
    { position: [10, 1, 10], size: [2, 2, 2] },
    { position: [-10, 1, 10], size: [2, 2, 2] },
    { position: [10, 1, -10], size: [2, 2, 2] },
    { position: [-10, 1, -10], size: [2, 2, 2] },
    { position: [0, 1, 0], size: [3, 2, 3] },
    { position: [5, 1, -5], size: [1, 3, 1] },
    { position: [-5, 1, 5], size: [1, 3, 1] }
  ];
  
  return (
    <>
      {/* Ambient light */}
      <ambientLight intensity={0.5} />
      
      {/* Directional light for shadows */}
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1} 
        castShadow 
        shadow-mapSize-width={2048} 
        shadow-mapSize-height={2048}
      />
      
      {/* Floor */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]} 
        receiveShadow
      >
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial 
          map={floorTexture} 
          roughness={0.8}
        />
      </mesh>
      
      {/* Surrounding walls */}
      {/* North wall */}
      <mesh position={[0, 5, -50]} castShadow receiveShadow>
        <boxGeometry args={[100, 10, 1]} />
        <meshStandardMaterial map={wallTexture} />
      </mesh>
      
      {/* South wall */}
      <mesh position={[0, 5, 50]} castShadow receiveShadow>
        <boxGeometry args={[100, 10, 1]} />
        <meshStandardMaterial map={wallTexture} />
      </mesh>
      
      {/* East wall */}
      <mesh position={[50, 5, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[100, 10, 1]} />
        <meshStandardMaterial map={wallTexture} />
      </mesh>
      
      {/* West wall */}
      <mesh position={[-50, 5, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[100, 10, 1]} />
        <meshStandardMaterial map={wallTexture} />
      </mesh>
      
      {/* Obstacles */}
      {obstacles.map((obstacle, index) => (
        <mesh 
          key={index} 
          position={obstacle.position} 
          castShadow 
          receiveShadow
          userData={{ isObstacle: true }}
        >
          <boxGeometry args={obstacle.size} />
          <meshStandardMaterial map={obstacleTexture} />
        </mesh>
      ))}
      
      {/* Skybox */}
      <mesh>
        <sphereGeometry args={[500, 60, 40]} />
        <meshBasicMaterial
          map={useTexture('/textures/sky.png')}
          side={THREE.BackSide}
        />
      </mesh>
    </>
  );
};

export default World;
