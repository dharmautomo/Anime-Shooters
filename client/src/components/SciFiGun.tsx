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
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Load the model - useGLTF caches automatically
  const { scene: model } = useGLTF('/models/scifi-gun/scene.gltf');
  
  // Only run this once on initialization or when scale changes
  useEffect(() => {
    // Skip if we've already initialized and scale hasn't changed
    if (hasInitialized && scale === 0.5) return;
    
    // Clear any existing children
    if (groupRef.current) {
      while (groupRef.current.children.length > 0) {
        groupRef.current.remove(groupRef.current.children[0]);
      }
      
      try {
        if (model) {
          console.log('SciFi Gun model loaded successfully');
          
          // Clone the model to avoid modifying the cached original
          const modelClone = model.clone();
          
          // Scale the model
          modelClone.scale.set(scale, scale, scale);
          
          // Add the model to the group
          groupRef.current.add(modelClone);
        } else {
          // If model loading failed, use the fallback
          console.log('Using fallback gun model');
          createFallbackGun(groupRef, scale);
        }
      } catch (error) {
        console.error('Error setting up gun model:', error);
        createFallbackGun(groupRef, scale);
      }
      
      // Mark as initialized
      setHasInitialized(true);
    }
  }, [model, scale, hasInitialized]);

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
    // Only show caption in the editor mode or for other players
    // Don't show it in first-person view to avoid visual clutter
    if (!props.visible || props.position?.[2] === -1.2) return null;
    
    return (
      <sprite position={[0, 0.5, 0]} scale={[0.6, 0.2, 1]}>
        <spriteMaterial 
          transparent={true}
          opacity={0.5}
          depthTest={false}
          map={(() => {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 64;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.font = '10px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText("Gun: Anatomy by Doctor Jana (CC-BY-4.0)", canvas.width/2, canvas.height/2);
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