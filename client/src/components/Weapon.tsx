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
  const { playHit, playSuccess } = useAudio();
  
  // Get keyboard/mouse controls
  const shoot = useKeyboardControls<Controls>(state => state.shoot);
  const reload = useKeyboardControls<Controls>(state => state.reload);
  
  // Handle muzzle flash effect
  useEffect(() => {
    if (muzzleFlashRef.current) {
      muzzleFlashRef.current.visible = false;
    }
  }, []);
  
  // Handle shooting
  useEffect(() => {
    if (shoot && !isShooting && !isReloading && ammo > 0) {
      setIsShooting(true);
      
      // Play gunshot sound
      playHit();
      
      // Show muzzle flash
      if (muzzleFlashRef.current) {
        muzzleFlashRef.current.visible = true;
        
        // Hide muzzle flash after a short time
        setTimeout(() => {
          if (muzzleFlashRef.current) {
            muzzleFlashRef.current.visible = false;
          }
        }, 50);
      }
      
      // Trigger shoot callback
      onShoot();
      
      // Cooldown before next shot
      setTimeout(() => {
        setIsShooting(false);
      }, 250);
    } else if (shoot && ammo === 0 && !isReloading) {
      // Click sound for empty gun
      playSuccess();
    }
  }, [shoot, isShooting, isReloading, ammo, playHit, playSuccess, onShoot]);
  
  // Handle reloading
  useEffect(() => {
    if (reload && !isReloading && ammo < 10) {
      setIsReloading(true);
      
      // Play reload sound after a short delay
      setTimeout(() => {
        playSuccess();
      }, 300);
      
      // Finish reloading after 1.5 seconds
      setTimeout(() => {
        setIsReloading(false);
      }, 1500);
    }
  }, [reload, isReloading, ammo, playSuccess]);
  
  // Make weapon follow the camera
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
    }
  });
  
  return (
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
      
      {/* Muzzle flash effect */}
      <group ref={muzzleFlashRef} position={[0, 0, 0.4]}>
        {/* Central flash */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.08, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial 
            color="#ffff00" 
            emissive="#ffff00"
            emissiveIntensity={3}
            transparent={true}
            opacity={0.9}
          />
        </mesh>
        
        {/* Radial flare */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.12, 0.04, 0.15, 16]} />
          <meshStandardMaterial 
            color="#ffcc00" 
            emissive="#ffaa00"
            emissiveIntensity={2}
            transparent={true}
            opacity={0.8}
          />
        </mesh>
        
        {/* Light source */}
        <pointLight
          color="#ffcc00"
          intensity={2}
          distance={3}
          decay={2}
        />
      </group>
      
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
  );
};

export default Weapon;
