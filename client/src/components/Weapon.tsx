import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useAudio } from '../lib/stores/useAudio';
import { usePlayer } from '../lib/stores/usePlayer';
import { useGameControls } from '../lib/stores/useGameControls';
import { useKeyboardControls } from '@react-three/drei';
import { Controls } from '../App';


interface WeaponProps {
  position: [number, number, number];
  rotation: [number, number, number];
  ammo: number;
  onShoot: () => void;
}

const Weapon = ({ position, rotation, ammo, onShoot }: WeaponProps) => {
  const [isShooting, setIsShooting] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const muzzleFlashRef = useRef<THREE.PointLight>(null);
  const { playSound, playHit, playSuccess } = useAudio();
  const { hasInteracted, isControlsLocked } = useGameControls();
  const weaponRef = useRef<THREE.Group>(null);

  // Get keyboard/mouse controls using stable direct selectors
  const [subscribeKeys, getKeys] = useKeyboardControls();
  const [shoot, setShoot] = useState(false);
  const [reload, setReload] = useState(false);

  // Subscribe to key changes
  useEffect(() => {
    console.log("Setting up key subscriptions for shoot and reload");

    // Subscribe to reload key (R key)
    const unsubReload = subscribeKeys(
      (state) => state[Controls.reload],
      (pressed) => {
        console.log("Reload key state changed:", pressed);
        setReload(!!pressed);
      }
    );

    // Subscribe to shoot key as backup
    const unsubShoot = subscribeKeys(
      (state) => state[Controls.shoot],
      (pressed) => {
        console.log("Shoot key state changed:", pressed);
        setShoot(!!pressed);
      }
    );

    return () => {
      unsubShoot();
      unsubReload();
    };
  }, [subscribeKeys]);

  // Initialize muzzle flash
  useEffect(() => {
    if (muzzleFlashRef.current) {
      muzzleFlashRef.current.visible = false;
      console.log("Initialized muzzle flash, set to invisible");
    }
  }, []);

  // Handle shooting (Keyboard and Mouse)
  useEffect(() => {
    // Only allow shooting when controls are locked and user has interacted
    if (!hasInteracted || !isControlsLocked) return;

    if ((shoot || isShooting) && !isReloading && ammo > 0) {
      setIsShooting(true);

      console.log("🔫 SHOOT KEY/MOUSE PRESSED - Shooting weapon! Current ammo:", ammo);

      // Play gunshot sound
      playSound('gunshot');

      // Show muzzle flash
      if (muzzleFlashRef.current) {
        muzzleFlashRef.current.visible = true;
        setTimeout(() => {
          if (muzzleFlashRef.current) {
            muzzleFlashRef.current.visible = false;
          }
        }, 100);
      }

      // DIRECT APPROACH - Manually decrement ammo to ensure it works
      try {
        const currentAmmo = usePlayer.getState().ammo;
        console.log("🔢 Before shooting: Current ammo in store:", currentAmmo);
        if (currentAmmo > 0) {
          usePlayer.setState({ ammo: currentAmmo - 1 });
          console.log("🔢 After direct ammo update: New ammo count:", usePlayer.getState().ammo);
        }
        onShoot();
      } catch (error) {
        console.error("Failed to update ammo directly:", error);
        onShoot();
      }

      // Cooldown before next shot
      setTimeout(() => {
        setIsShooting(false);
      }, 350);
    } else if ((shoot || isShooting) && ammo === 0 && !isReloading) {
      // Click sound for empty gun
      console.log("Click - empty gun");
      playSuccess();
    }
  }, [shoot, isShooting, isReloading, ammo, playHit, playSuccess, playSound, onShoot, hasInteracted, isControlsLocked]);


  // Handle mouse input for shooting (MAIN METHOD - most browsers use this)
  useEffect(() => {
    console.log("Setting up mouse event listener for shooting");

    const handleMouseDown = (e: MouseEvent) => {
      // Only allow shooting when controls are locked and user has interacted
      if (!hasInteracted || !isControlsLocked) {
        console.log("Mouse click ignored - controls not locked or no interaction");
        return;
      }

      if (e.button === 0) { // Left mouse button
        console.log("🖱️ Left mouse button click detected");
        setIsShooting(true); //Added this line to trigger the useEffect above
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    return () => window.removeEventListener('mousedown', handleMouseDown);
  }, [isShooting, isReloading, ammo, playHit, playSuccess, playSound, onShoot, hasInteracted, isControlsLocked]);


  // Handle reloading
  useEffect(() => {
    // Only allow reloading when controls are locked and user has interacted
    if (!hasInteracted || !isControlsLocked) return;

    if (reload && !isReloading && ammo < 10) {
      setIsReloading(true);

      // Play reload sound after a short delay
      setTimeout(() => {
        playSound('reload');
      }, 300);

      // Schedule the actual ammo reload halfway through the animation
      setTimeout(() => {
        usePlayer.getState().reloadAmmo();
        console.log('Reloaded ammo to 10');
      }, 750);

      // Finish reloading animation after 1.5 seconds
      setTimeout(() => {
        setIsReloading(false);
      }, 1500);
    }
  }, [reload, isReloading, ammo, playSuccess, playSound, hasInteracted, isControlsLocked]);

  // Make weapon and muzzle flash follow the camera
  useFrame(() => {
    if (weaponRef.current) {
      const cameraPosition = new THREE.Vector3();
      const cameraQuaternion = new THREE.Quaternion();
      camera.getWorldPosition(cameraPosition);
      camera.getWorldQuaternion(cameraQuaternion);
      weaponRef.current.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
      weaponRef.current.quaternion.copy(cameraQuaternion);
      const offsetVector = new THREE.Vector3(...position);
      offsetVector.applyQuaternion(cameraQuaternion);
      weaponRef.current.position.add(offsetVector);

      // Apply recoil effect when shooting
      if (isShooting) {
        weaponRef.current.rotation.x += 0.05;
      } else {
        weaponRef.current.rotation.x *= 0.8;
      }

      // Apply reload animation
      if (isReloading) {
        weaponRef.current.rotation.z = Math.sin(Date.now() * 0.01) * 0.2;
      } else {
        weaponRef.current.rotation.z = 0;
      }

      if (muzzleFlashRef.current) {
        const muzzleOffset = new THREE.Vector3(0, 0, 0.5);
        muzzleOffset.applyQuaternion(weaponRef.current.quaternion);
        muzzleFlashRef.current.position.copy(weaponRef.current.position);
        muzzleFlashRef.current.position.add(muzzleOffset);
        muzzleFlashRef.current.quaternion.copy(weaponRef.current.quaternion);
      }
    }
  });

  return (
    <>
      <group ref={weaponRef}>
        <group position={new THREE.Vector3(...position)} rotation={new THREE.Euler(...rotation)}>
          {/* Gun model */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.3, 0.2, 1]} />
            <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
          </mesh>

          {/* Muzzle flash light */}
          <pointLight
            ref={muzzleFlashRef}
            position={[0, 0.1, 0.6]}
            intensity={2}
            distance={2}
            color="#ff7700"
            visible={false}
          />
        </group>
      </group>
    </>
  );
};

export default Weapon;