import React, { useRef, useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { usePlayer } from '../lib/stores/initializeStores';

/**
 * First-person view of the gun, visible only to the player
 */
export function FirstPersonGun() {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/sci-fi-gun/scene.gltf', true);
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [loadError, setLoadError] = useState(false);
  const { camera } = useThree();
  
  // Movement animation state
  const [bobTime, setBobTime] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [prevPosition, setPrevPosition] = useState<THREE.Vector3 | null>(null);
  
  // Get player position to detect movement
  const position = usePlayer(state => state.position);
  
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
        const scale = 0.003;
        clonedScene.scale.set(scale, scale, scale);
        
        // Add to the group ref
        if (groupRef.current) {
          groupRef.current.add(clonedScene);
        }
        
        // Store the model reference
        setModel(clonedScene);
        
        console.log('First-person gun model loaded successfully!');
      } catch (error) {
        console.error('Error loading first-person gun model:', error);
        setLoadError(true);
      }
    }
  }, [scene, model, loadError]);
  
  // Check if player is moving based on position changes
  useEffect(() => {
    if (position && prevPosition) {
      // Calculate distance moved since last frame
      const distanceMoved = position.distanceTo(prevPosition);
      // Set moving state if distance is significant
      setIsMoving(distanceMoved > 0.01);
    }
    
    // Update previous position for next comparison
    if (position) {
      setPrevPosition(position.clone());
    }
  }, [position]);
  
  // Animation loop for gun movement
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Update bob time for weapon sway animation
    setBobTime(prevTime => prevTime + delta);
    
    // Follow camera position
    groupRef.current.position.copy(camera.position);
    groupRef.current.rotation.copy(camera.rotation);
    
    // Apply offset to position the gun in view
    const offsetX = 0.2;    // Right side of screen
    const offsetY = -0.2;   // Below center
    const offsetZ = -0.4;   // In front of camera
    
    // Create vector in local camera space
    const localOffset = new THREE.Vector3(offsetX, offsetY, offsetZ);
    
    // Convert to world space by applying camera's quaternion
    localOffset.applyQuaternion(camera.quaternion);
    
    // Apply to group position
    groupRef.current.position.add(localOffset);
    
    // Apply subtle movement animations
    if (isMoving) {
      // Walking bob effect
      const walkBobY = Math.sin(bobTime * 10) * 0.01;
      const walkBobX = Math.cos(bobTime * 5) * 0.005;
      groupRef.current.position.y += walkBobY;
      groupRef.current.position.x += walkBobX;
    } else {
      // Idle "breathing" effect
      const idleBobY = Math.sin(bobTime * 2) * 0.003;
      groupRef.current.position.y += idleBobY;
    }
  });
  
  return <group ref={groupRef} />;
}

// Preload the model
useGLTF.preload('/models/sci-fi-gun/scene.gltf');

export default FirstPersonGun;