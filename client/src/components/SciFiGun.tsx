import React, { useRef, useState, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Define props for the SciFiGun component
interface SciFiGunProps {
  position?: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
  visible?: boolean;
}

// Create fallback model for when the GLTF fails to load
function createFallbackGun(groupRef: React.RefObject<THREE.Group>, scale: number) {
  if (!groupRef.current) return;

  // Clear any existing children
  while (groupRef.current.children.length > 0) {
    groupRef.current.remove(groupRef.current.children[0]);
  }

  const gunGroup = new THREE.Group();
  
  // Main gun body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.1, 0.6),
    new THREE.MeshStandardMaterial({ color: '#666666', metalness: 0.8, roughness: 0.2 })
  );
  body.position.z = 0.1;
  
  // Gun barrel
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8),
    new THREE.MeshStandardMaterial({ color: '#444444', metalness: 0.9, roughness: 0.1 })
  );
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = 0.45;
  
  // Handle
  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.2, 0.08),
    new THREE.MeshStandardMaterial({ color: '#333333', metalness: 0.5, roughness: 0.5 })
  );
  handle.position.y = -0.15;
  handle.position.z = 0;
  
  // Scope/sight
  const scope = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8),
    new THREE.MeshStandardMaterial({ color: '#111111', metalness: 0.7, roughness: 0.3 })
  );
  scope.position.y = 0.08;
  scope.position.z = 0.1;
  
  // Add all parts to the gun group
  gunGroup.add(body, barrel, handle, scope);
  gunGroup.scale.set(scale, scale, scale);
  
  groupRef.current.add(gunGroup);
}

function SciFiGunModel({ position = [0, 0, 0], scale = 0.5, rotation = [0, 0, 0], visible = true }: SciFiGunProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [loadError, setLoadError] = useState(false);
  
  // Load the model
  let modelData;
  try {
    modelData = useGLTF('/models/scifi-gun/scene.gltf');
  } catch (error) {
    console.error('Error loading GLTF model:', error);
    setLoadError(true);
  }
  
  const model = modelData?.scene;
  
  useEffect(() => {
    if (model && !loadError) {
      console.log('SciFi Gun model loaded successfully');
      
      // Clear any existing children
      if (groupRef.current) {
        while (groupRef.current.children.length > 0) {
          groupRef.current.remove(groupRef.current.children[0]);
        }
        
        // Clone the model to avoid modifying the cached original
        const modelClone = model.clone();
        
        // Scale the model
        modelClone.scale.set(scale, scale, scale);
        
        // Add the model to the group
        groupRef.current.add(modelClone);
      }
    } else if (loadError || !model) {
      console.log('Using fallback gun model');
      createFallbackGun(groupRef, scale);
    }
  }, [model, loadError, scale]);

  // Apply animations/effects
  useFrame((_, delta) => {
    if (groupRef.current) {
      // Apply the rotation
      groupRef.current.rotation.x = rotation[0];
      groupRef.current.rotation.y = rotation[1];
      groupRef.current.rotation.z = rotation[2];
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      visible={visible}
      castShadow
      receiveShadow
    />
  );
}

// Main component with credit caption
export function SciFiGun(props: SciFiGunProps) {
  // Add caption with attribution when visible in third-person view
  const addModelCredit = () => {
    if (!props.visible) return null;
    
    return (
      <sprite position={[0, 0.3, 0]} scale={[1.5, 0.4, 1]}>
        <spriteMaterial 
          transparent={true}
          depthTest={false}
          map={(() => {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 128;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.font = 'bold 20px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText("Sci-Fi Gun by Anatomy by Doctor Jana", canvas.width/2, canvas.height/2);
            ctx.font = '14px Arial';
            ctx.fillText("CC-BY-4.0 License", canvas.width/2, canvas.height/2 + 24);
            return new THREE.CanvasTexture(canvas);
          })()}
        />
      </sprite>
    );
  };
  
  return (
    <group position={props.position}>
      {addModelCredit()}
      <SciFiGunModel {...props} />
    </group>
  );
}

// Preload the model
useGLTF.preload('/models/scifi-gun/scene.gltf');

export default SciFiGun;