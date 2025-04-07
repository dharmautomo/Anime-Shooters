import React, { useRef, useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface SciFiGunProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export function SciFiGun({ 
  position = [0, 0, 0], 
  rotation = [0, 0, 0], 
  scale = 0.01 
}: SciFiGunProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/sci-fi-gun/scene.gltf', true);
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [loadError, setLoadError] = useState(false);

  // Load and setup the model
  useEffect(() => {
    if (scene && !model && !loadError) {
      try {
        // Clone the scene to avoid modifying the original
        const clonedScene = scene.clone();
        
        // Apply material fix for missing textures
        clonedScene.traverse((node) => {
          if ((node as THREE.Mesh).isMesh) {
            const mesh = node as THREE.Mesh;
            
            // Check if material has texture issues
            if (mesh.material) {
              // If it's an array of materials
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((mat: THREE.Material) => {
                  // Make sure material has basic properties
                  if ((mat as any).color) {
                    // Set generic colors based on material name for robustness
                    if (mat.name.includes('barrel') || mat.name.includes('barrel')) {
                      (mat as any).color.set('#303030'); // Dark gray for barrel
                    } else if (mat.name.includes('scope')) {
                      (mat as any).color.set('#1a1a1a'); // Black for scope
                    } else {
                      (mat as any).color.set('#505050'); // Medium gray for everything else
                    }
                  }
                });
              } 
              // Single material
              else if ((mesh.material as any).color) {
                // Set a default color if textures fail to load
                (mesh.material as any).color.set('#484848');
              }
            }
          }
        });
        
        // Apply scale to the model for proper sizing
        clonedScene.scale.set(scale, scale, scale);
        
        // Add to the group ref
        if (groupRef.current) {
          groupRef.current.add(clonedScene);
        }
        
        // Store the model reference
        setModel(clonedScene);
        
        console.log('Sci-Fi Gun model loaded successfully!');
      } catch (error) {
        console.error('Error loading Sci-Fi Gun model:', error);
        setLoadError(true);
      }
    }
  }, [scene, scale, model, loadError]);

  // Add license attribution
  const AttributionTag = () => (
    <sprite position={[0, 0.2, 0]} scale={[0.5, 0.1, 1]}>
      <spriteMaterial 
        transparent={true}
        depthTest={false}
        map={(() => {
          const canvas = document.createElement('canvas');
          canvas.width = 512;
          canvas.height = 64;
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.font = 'bold 16px Arial';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText("Low Poly Sci-Fi Gun by Doctor Jana", canvas.width/2, canvas.height/2 - 10);
          ctx.font = '12px Arial';
          ctx.fillText("CC-BY-4.0 License", canvas.width/2, canvas.height/2 + 10);
          return new THREE.CanvasTexture(canvas);
        })()}
      />
    </sprite>
  );

  return (
    <group
      ref={groupRef}
      position={new THREE.Vector3(...position)}
      rotation={new THREE.Euler(...rotation)}
    >
      {/* Attribution tag */}
      <AttributionTag />
    </group>
  );
}

// Preload the model
useGLTF.preload('/models/sci-fi-gun/scene.gltf');

export default SciFiGun;