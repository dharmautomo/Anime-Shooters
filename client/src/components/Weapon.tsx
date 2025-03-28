import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useKeyboardControls } from '@react-three/drei';
import { Controls } from '../App';
import { useAudio } from '../lib/stores/useAudio';

interface WeaponProps {
  position: [number, number, number];
  rotation: [number, number, number];
  ammo: number;
  onShoot: () => void;
}

const Weapon = ({ position, rotation, ammo, onShoot }: WeaponProps) => {
  const weaponRef = useRef<THREE.Group>(null);
  const muzzleFlashRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const [isShooting, setIsShooting] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const { playHit, playSuccess, playSound } = useAudio();
  
  // Get keyboard/mouse controls
  const shoot = useKeyboardControls<Controls>(state => state.shoot);
  const reload = useKeyboardControls<Controls>(state => state.reload);
  
  // Handle muzzle flash effect
  useEffect(() => {
    if (muzzleFlashRef.current) {
      // Hide muzzle flash initially
      muzzleFlashRef.current.visible = false;
      console.log("Initialized muzzle flash, set to invisible");
    }
  }, []);
  
  // Handle shooting
  useEffect(() => {
    if (shoot && !isShooting && !isReloading && ammo > 0) {
      setIsShooting(true);
      
      console.log("Shooting weapon!");
      
      // Play gunshot sound using Web Audio API
      playSound('gunshot');
      console.log("GUNSHOT SOUND PLAYED DIRECTLY");
      
      // Show muzzle flash with extensive logging
      if (muzzleFlashRef.current) {
        muzzleFlashRef.current.visible = true;
        console.log("Showing muzzle flash at position:", 
          muzzleFlashRef.current.position.x,
          muzzleFlashRef.current.position.y,
          muzzleFlashRef.current.position.z
        );
        
        // Hide muzzle flash after a much longer time for better visibility
        setTimeout(() => {
          if (muzzleFlashRef.current) {
            muzzleFlashRef.current.visible = false;
            console.log("Hiding muzzle flash");
          }
        }, 250); // Much longer duration for better visibility
      } else {
        console.log("Muzzle flash ref is not available!");
      }
      
      // Trigger shoot callback
      onShoot();
      
      // Cooldown before next shot
      setTimeout(() => {
        setIsShooting(false);
      }, 250);
    } else if (shoot && ammo === 0 && !isReloading) {
      // Click sound for empty gun
      console.log("Click - empty gun");
      playSuccess();
    }
  }, [shoot, isShooting, isReloading, ammo, playHit, playSuccess, playSound, onShoot]);
  
  // Handle mouse input for shooting (additional method)
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // Left mouse button
        if (!isShooting && !isReloading && ammo > 0) {
          console.log("Mouse click - shooting");
          setIsShooting(true);
          
          // Play gunshot sound using Web Audio API
          playSound('gunshot');
          console.log("GUNSHOT SOUND PLAYED DIRECTLY");
          
          // Show muzzle flash with extensive logging
          if (muzzleFlashRef.current) {
            muzzleFlashRef.current.visible = true;
            console.log("Mouse click - showing muzzle flash at position:", 
              muzzleFlashRef.current.position.x,
              muzzleFlashRef.current.position.y,
              muzzleFlashRef.current.position.z
            );
            
            // Hide muzzle flash after a much longer time for better visibility
            setTimeout(() => {
              if (muzzleFlashRef.current) {
                muzzleFlashRef.current.visible = false;
                console.log("Mouse click - hiding muzzle flash");
              }
            }, 250);
          } else {
            console.log("MOUSE CLICK: Muzzle flash ref is not available!");
          }
          
          // Trigger shoot callback
          onShoot();
          
          // Cooldown before next shot
          setTimeout(() => {
            setIsShooting(false);
          }, 250);
        }
      }
    };
    
    window.addEventListener('mousedown', handleMouseDown);
    
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isShooting, isReloading, ammo, playHit, playSound, onShoot]);
  
  // Handle reloading
  useEffect(() => {
    if (reload && !isReloading && ammo < 10) {
      setIsReloading(true);
      
      // Play reload sound after a short delay
      setTimeout(() => {
        playSound('reload');
      }, 300);
      
      // Finish reloading after 1.5 seconds
      setTimeout(() => {
        setIsReloading(false);
      }, 1500);
    }
  }, [reload, isReloading, ammo, playSuccess, playSound]);
  
  // Make weapon and muzzle flash follow the camera
  useFrame(() => {
    if (weaponRef.current) {
      // Position the weapon in front of the camera
      const cameraPosition = new THREE.Vector3();
      const cameraQuaternion = new THREE.Quaternion();
      
      camera.getWorldPosition(cameraPosition);
      camera.getWorldQuaternion(cameraQuaternion);
      
      // Apply weapon position relative to camera
      weaponRef.current.position.set(
        cameraPosition.x,
        cameraPosition.y,
        cameraPosition.z
      );
      
      // Apply camera rotation to weapon
      weaponRef.current.quaternion.copy(cameraQuaternion);
      
      // Apply weapon offset
      const offsetVector = new THREE.Vector3(position[0], position[1], position[2]);
      offsetVector.applyQuaternion(cameraQuaternion);
      
      weaponRef.current.position.add(offsetVector);
      
      // Apply recoil effect when shooting
      if (isShooting) {
        weaponRef.current.rotation.x += 0.05;
      } else {
        // Reset rotation when not shooting
        weaponRef.current.rotation.x *= 0.8;
      }
      
      // Apply reload animation
      if (isReloading) {
        weaponRef.current.rotation.z = Math.sin(Date.now() * 0.01) * 0.2;
      } else {
        weaponRef.current.rotation.z = 0;
      }
      
      // Update muzzle flash position to follow the gun
      if (muzzleFlashRef.current) {
        // Calculate muzzle position at the front of the gun barrel
        const muzzleOffset = new THREE.Vector3(0, 0, 0.5);
        muzzleOffset.applyQuaternion(weaponRef.current.quaternion);
        
        // Set muzzle flash position
        muzzleFlashRef.current.position.copy(weaponRef.current.position);
        muzzleFlashRef.current.position.add(muzzleOffset);
        
        // Copy the weapon's rotation
        muzzleFlashRef.current.quaternion.copy(weaponRef.current.quaternion);
        
        // Add debug logs occasionally to track muzzle flash position
        if (Math.random() < 0.01) { // Only log 1% of the time to avoid flooding console
          console.log("Muzzle flash position:", 
            muzzleFlashRef.current.position.x,
            muzzleFlashRef.current.position.y,
            muzzleFlashRef.current.position.z
          );
        }
      }
    }
  });
  
  return (
    <>
      {/* Main weapon group */}
      <group ref={weaponRef}>
        {/* Gun slide (top part) */}
        <mesh position={[0, 0.03, 0]} rotation={rotation}>
          <boxGeometry args={[0.09, 0.06, 0.28]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.6} metalness={0.8} />
        </mesh>
        
        {/* Gun frame (lower part) */}
        <mesh position={[0, -0.02, 0]} rotation={rotation}>
          <boxGeometry args={[0.1, 0.07, 0.3]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.5} metalness={0.7} />
        </mesh>
        
        {/* Gun handle with brown grip */}
        <mesh position={[0, -0.13, -0.08]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[0.09, 0.18, 0.12]} />
          <meshStandardMaterial color="#3d2817" roughness={0.9} metalness={0.1} />
        </mesh>
        
        {/* Gun barrel */}
        <mesh position={[0, 0.01, 0.18]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.16, 8]} />
          <meshStandardMaterial color="#111111" roughness={0.5} metalness={0.9} />
        </mesh>
        
        {/* Front sight */}
        <mesh position={[0, 0.06, 0.14]} rotation={rotation}>
          <boxGeometry args={[0.02, 0.02, 0.02]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        
        {/* Rear sight */}
        <mesh position={[0, 0.06, -0.1]} rotation={rotation}>
          <boxGeometry args={[0.06, 0.02, 0.02]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        
        {/* Trigger guard */}
        <mesh position={[0, -0.04, -0.05]} rotation={rotation}>
          <torusGeometry args={[0.03, 0.008, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        
        {/* Trigger */}
        <mesh position={[0, -0.04, -0.02]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.02, 0.04, 0.01]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        
        {/* Hand - palm */}
        <mesh position={[0, -0.17, -0.12]} rotation={[0.4, 0, 0]}>
          <boxGeometry args={[0.1, 0.05, 0.14]} />
          <meshStandardMaterial color="#ffd6b1" />
        </mesh>
        
        {/* Hand - thumb */}
        <mesh position={[0.06, -0.14, -0.05]} rotation={[0.2, -0.3, 0]}>
          <capsuleGeometry args={[0.02, 0.06]} />
          <meshStandardMaterial color="#ffd6b1" />
        </mesh>
        
        {/* Hand - fingers */}
        <mesh position={[0, -0.13, 0]} rotation={[0.6, 0, 0]}>
          <boxGeometry args={[0.1, 0.025, 0.08]} />
          <meshStandardMaterial color="#ffd6b1" />
        </mesh>
        
        {/* Hand - finger segments */}
        <mesh position={[0, -0.11, 0.05]} rotation={[0.8, 0, 0]}>
          <boxGeometry args={[0.095, 0.023, 0.05]} />
          <meshStandardMaterial color="#ffd6b1" />
        </mesh>
      </group>
      
      {/* More subtle, realistic muzzle flash */}
      <group 
        ref={muzzleFlashRef} 
        position={[
          weaponRef.current ? weaponRef.current.position.x : 0, 
          weaponRef.current ? weaponRef.current.position.y : 0.01, 
          weaponRef.current ? weaponRef.current.position.z + 0.3 : 0
        ]}
        rotation={rotation}
      >
        {/* Small central flash */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
          <coneGeometry args={[0.04, 0.08, 8]} />
          <meshStandardMaterial 
            color="#f8d498" 
            emissive="#f5a742"
            emissiveIntensity={3}
            transparent={true}
            opacity={0.7}
          />
        </mesh>
        
        {/* Thin smoke wisp */}
        <mesh position={[0, 0.02, 0.05]} rotation={[0, 0, Math.PI / 4]}>
          <coneGeometry args={[0.03, 0.15, 6]} />
          <meshStandardMaterial 
            color="#d6d6d6" 
            emissive="#a0a0a0"
            emissiveIntensity={1}
            transparent={true}
            opacity={0.4}
          />
        </mesh>
        
        {/* Small bright center */}
        <mesh position={[0, 0, 0.02]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial 
            color="#ffffff" 
            emissive="#ffcc88"
            emissiveIntensity={4}
            transparent={true}
            opacity={0.8}
          />
        </mesh>
        
        {/* Subtle light source */}
        <pointLight
          position={[0, 0, 0.05]}
          color="#ffbb77"
          intensity={3}
          distance={5}
          decay={2}
        />
      </group>
    </>
  );
};

export default Weapon;
