import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface BabyMonsterProps {
  position?: [number, number, number];
  scale?: number;
  rotation?: number;
}

export function BabyMonster({ 
  position = [0, 0, 0], 
  scale = 1,
  rotation = 0 
}: BabyMonsterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [animationTime, setAnimationTime] = useState(0);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const modelPath = '/models/baby-monster/scene.gltf';

  // Try to load the model with useGLTF
  const { scene, nodes, materials } = useGLTF(modelPath, undefined, 
    (e) => {
      console.error('Error loading model:', e);
      setLoadError(true);
    });
  
  // Clone the scene to avoid conflicts with multiple instances
  const clonedScene = useRef(scene ? scene.clone() : null);
  
  // Set up model
  useEffect(() => {
    if (groupRef.current && clonedScene.current) {
      try {
        // Clear any existing children
        while (groupRef.current.children.length > 0) {
          groupRef.current.remove(groupRef.current.children[0]);
        }
        
        // Add the cloned scene
        groupRef.current.add(clonedScene.current);
        
        // Apply scale uniformly
        groupRef.current.scale.set(scale, scale, scale);
        
        // Initial rotation
        groupRef.current.rotation.y = rotation;
        
        setModelLoaded(true);
      } catch (error) {
        console.error('Error setting up model:', error);
        setLoadError(true);
      }
    }
  }, [scale, rotation, scene]);
  
  // Create a fallback monster if loading fails
  const createFallbackMonster = () => {
    if (groupRef.current) {
      // Clear existing children
      while (groupRef.current.children.length > 0) {
        groupRef.current.remove(groupRef.current.children[0]);
      }
      
      // Create a simple stylized monster as fallback
      // Body
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1.5, 1),
        new THREE.MeshStandardMaterial({ color: '#6a47b8' })
      );
      body.position.set(0, 0.75, 0);
      body.castShadow = true;
      groupRef.current.add(body);
      
      // Head
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 16, 16),
        new THREE.MeshStandardMaterial({ color: '#8c66e3' })
      );
      head.position.set(0, 1.7, 0);
      head.castShadow = true;
      groupRef.current.add(head);
      
      // Eyes
      const eyeGeometry = new THREE.SphereGeometry(0.12, 16, 16);
      const eyeMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff' });
      
      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(0.2, 1.8, 0.5);
      groupRef.current.add(leftEye);
      
      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      rightEye.position.set(-0.2, 1.8, 0.5);
      groupRef.current.add(rightEye);
      
      // Pupils
      const pupilGeometry = new THREE.SphereGeometry(0.06, 16, 16);
      const pupilMaterial = new THREE.MeshBasicMaterial({ color: '#000000' });
      
      const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
      leftPupil.position.set(0.2, 1.8, 0.58);
      groupRef.current.add(leftPupil);
      
      const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
      rightPupil.position.set(-0.2, 1.8, 0.58);
      groupRef.current.add(rightPupil);
      
      // Arms
      const armGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.3);
      const armMaterial = new THREE.MeshStandardMaterial({ color: '#6a47b8' });
      
      const leftArm = new THREE.Mesh(armGeometry, armMaterial);
      leftArm.position.set(0.65, 0.9, 0);
      leftArm.castShadow = true;
      groupRef.current.add(leftArm);
      
      const rightArm = new THREE.Mesh(armGeometry, armMaterial);
      rightArm.position.set(-0.65, 0.9, 0);
      rightArm.castShadow = true;
      groupRef.current.add(rightArm);
      
      // Legs
      const legGeometry = new THREE.BoxGeometry(0.3, 0.5, 0.3);
      const legMaterial = new THREE.MeshStandardMaterial({ color: '#6a47b8' });
      
      const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
      leftLeg.position.set(0.3, 0.25, 0);
      leftLeg.castShadow = true;
      groupRef.current.add(leftLeg);
      
      const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
      rightLeg.position.set(-0.3, 0.25, 0);
      rightLeg.castShadow = true;
      groupRef.current.add(rightLeg);
      
      // Apply scale to the group
      groupRef.current.scale.set(scale, scale, scale);
    }
  };
  
  // Create fallback if there's an error loading
  useEffect(() => {
    if (loadError) {
      console.log("Using fallback monster model");
      createFallbackMonster();
    }
  }, [loadError, scale]);
  
  // Animation loop
  useFrame((_, delta) => {
    // Update animation timer
    setAnimationTime(prevTime => prevTime + delta);
    
    if (groupRef.current) {
      // Subtle idle animation - breathing
      const breathingOffset = Math.sin(animationTime * 2) * 0.05;
      groupRef.current.position.y = position[1] + breathingOffset;
      
      // Gentle swaying
      groupRef.current.rotation.y = rotation + Math.sin(animationTime) * 0.1;
      
      // If using fallback model, animate the parts
      if (loadError && groupRef.current.children.length > 0) {
        // Animate arms
        const leftArm = groupRef.current.children[4];
        const rightArm = groupRef.current.children[5];
        if (leftArm && rightArm) {
          leftArm.rotation.x = Math.sin(animationTime * 2) * 0.2;
          rightArm.rotation.x = Math.sin(animationTime * 2 + Math.PI) * 0.2;
        }
        
        // Animate legs
        const leftLeg = groupRef.current.children[6];
        const rightLeg = groupRef.current.children[7];
        if (leftLeg && rightLeg) {
          leftLeg.position.y = 0.25 + Math.sin(animationTime * 2) * 0.05;
          rightLeg.position.y = 0.25 + Math.sin(animationTime * 2 + Math.PI) * 0.05;
        }
        
        // Animate eyes
        const leftPupil = groupRef.current.children[3];
        const rightPupil = groupRef.current.children[2];
        if (leftPupil && rightPupil) {
          // Blink occasionally by scaling eyes on y-axis
          const blinkFactor = Math.sin(animationTime * 0.5) > 0.95 ? 0.1 : 1;
          leftPupil.scale.y = blinkFactor;
          rightPupil.scale.y = blinkFactor;
        }
      }
    }
  });
  
  // Add a caption
  const addModelCredit = () => {
    return (
      <sprite position={[0, 2.5, 0]} scale={[2, 0.5, 1]}>
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
            ctx.fillText("Baby Monster by Pixel-bit", canvas.width/2, canvas.height/2);
            ctx.font = '14px Arial';
            ctx.fillText("CC-BY-4.0 License", canvas.width/2, canvas.height/2 + 24);
            return new THREE.CanvasTexture(canvas);
          })()}
        />
      </sprite>
    );
  };
  
  return (
    <group 
      ref={groupRef} 
      position={[position[0], position[1], position[2]]}
      castShadow
      receiveShadow
    >
      {addModelCredit()}
    </group>
  );
}

// Try to preload the model, but don't worry if it fails
try {
  useGLTF.preload('/models/baby-monster/scene.gltf');
} catch (e) {
  console.log('Model preloading failed, will use fallback');
}

export default BabyMonster;