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
        {/* Gun body */}
        <mesh rotation={rotation}>
          <boxGeometry args={[0.1, 0.1, 0.3]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        
        {/* Gun handle */}
        <mesh position={[0, -0.15, -0.1]} rotation={rotation}>
          <boxGeometry args={[0.08, 0.2, 0.1]} />
          <meshStandardMaterial color="#222222" />
        </mesh>
        
        {/* Gun barrel */}
        <mesh position={[0, 0, 0.2]} rotation={rotation}>
          <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        
        {/* Hand */}
        <mesh position={[0, -0.12, -0.15]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.08, 0.04, 0.12]} />
          <meshStandardMaterial color="#ffd6b1" />
          
          {/* Fingers */}
          <mesh position={[0, 0, 0.07]}>
            <boxGeometry args={[0.075, 0.035, 0.05]} />
            <meshStandardMaterial color="#ffd6b1" />
          </mesh>
        </mesh>
      </group>
      
      {/* Separate muzzle flash that follows the gun position but rendered at a different point */}
      <group 
        ref={muzzleFlashRef} 
        position={[
          weaponRef.current ? weaponRef.current.position.x : 0, 
          weaponRef.current ? weaponRef.current.position.y : 0, 
          weaponRef.current ? weaponRef.current.position.z + 0.5 : 0
        ]}
        rotation={rotation}
      >
        {/* Large central flash cone */}
        <mesh position={[0, 0, 0.5]} rotation={[0, 0, 0]}>
          <coneGeometry args={[0.2, 0.4, 16]} />
          <meshStandardMaterial 
            color="#ffff00" 
            emissive="#ffff00"
            emissiveIntensity={10}
            transparent={true}
            opacity={0.9}
          />
        </mesh>
        
        {/* Wide radial flare */}
        <mesh position={[0, 0, 0.55]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.25, 0.08, 0.3, 16]} />
          <meshStandardMaterial 
            color="#ffcc00" 
            emissive="#ffaa00"
            emissiveIntensity={7}
            transparent={true}
            opacity={0.8}
          />
        </mesh>
        
        {/* Bright center spark */}
        <mesh position={[0, 0, 0.6]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial 
            color="#ffffff" 
            emissive="#ffffff"
            emissiveIntensity={10}
            transparent={true}
            opacity={0.95}
          />
        </mesh>
        
        {/* Additional larger spark particles */}
        <mesh position={[0, 0, 0.65]}>
          <octahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial 
            color="#ffffff" 
            emissive="#ffffff"
            emissiveIntensity={10}
            transparent={true}
            opacity={0.8}
          />
        </mesh>
        
        {/* Much brighter light source */}
        <pointLight
          position={[0, 0, 0.6]}
          color="#ffcc00"
          intensity={15}
          distance={15}
          decay={2}
        />
      </group>
    </>
  );
};

export default Weapon;
