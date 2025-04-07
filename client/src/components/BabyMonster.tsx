import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
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
  
  // Create the stylized monster directly instead of trying to load the GLTF
  useEffect(() => {
    if (groupRef.current) {
      // Clear existing children
      while (groupRef.current.children.length > 0) {
        groupRef.current.remove(groupRef.current.children[0]);
      }
      
      // Create a stylized monster
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
      
      // Mouth
      const mouth = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.1, 0.1),
        new THREE.MeshBasicMaterial({ color: '#ff9999' })
      );
      mouth.position.set(0, 1.5, 0.59);
      groupRef.current.add(mouth);
      
      // Horns
      const hornGeometry = new THREE.ConeGeometry(0.1, 0.3, 16);
      const hornMaterial = new THREE.MeshStandardMaterial({ color: '#5a3a99' });
      
      const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
      leftHorn.position.set(0.25, 2.1, 0);
      leftHorn.rotation.x = -Math.PI / 6;
      leftHorn.castShadow = true;
      groupRef.current.add(leftHorn);
      
      const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
      rightHorn.position.set(-0.25, 2.1, 0);
      rightHorn.rotation.x = -Math.PI / 6;
      rightHorn.castShadow = true;
      groupRef.current.add(rightHorn);
      
      // Tail
      const tailGeometry = new THREE.CylinderGeometry(0.1, 0.05, 1);
      const tailMaterial = new THREE.MeshStandardMaterial({ color: '#6a47b8' });
      
      const tail = new THREE.Mesh(tailGeometry, tailMaterial);
      // Position the tail at the back and make it point backward and slightly up
      tail.position.set(0, 0.5, -0.7);
      tail.rotation.x = Math.PI / 4;
      tail.castShadow = true;
      groupRef.current.add(tail);
      
      // Apply scale to the group
      groupRef.current.scale.set(scale, scale, scale);
      
      // Initial rotation
      groupRef.current.rotation.y = rotation;
    }
  }, [scale, rotation]);
  
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
      
      // If children are available, animate them
      if (groupRef.current.children.length > 0) {
        // Animate arms (arms are at index 6 and 7)
        const leftArm = groupRef.current.children[6];
        const rightArm = groupRef.current.children[7];
        if (leftArm && rightArm) {
          leftArm.rotation.x = Math.sin(animationTime * 2) * 0.2;
          rightArm.rotation.x = Math.sin(animationTime * 2 + Math.PI) * 0.2;
        }
        
        // Animate legs (legs are at index 8 and 9)
        const leftLeg = groupRef.current.children[8];
        const rightLeg = groupRef.current.children[9];
        if (leftLeg && rightLeg) {
          leftLeg.position.y = 0.25 + Math.sin(animationTime * 2) * 0.05;
          rightLeg.position.y = 0.25 + Math.sin(animationTime * 2 + Math.PI) * 0.05;
        }
        
        // Animate pupils (pupils are at index 4 and 5)
        const leftPupil = groupRef.current.children[4];
        const rightPupil = groupRef.current.children[5];
        if (leftPupil && rightPupil) {
          // Blink occasionally by scaling eyes on y-axis
          const blinkFactor = Math.sin(animationTime * 0.5) > 0.95 ? 0.1 : 1;
          leftPupil.scale.y = blinkFactor;
          rightPupil.scale.y = blinkFactor;
        }
        
        // Animate tail (tail is at index 12)
        const tail = groupRef.current.children[12];
        if (tail) {
          // Wag the tail
          tail.rotation.z = Math.sin(animationTime * 3) * 0.2;
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

export default BabyMonster;