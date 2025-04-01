import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PointerLockControls, Stats, useKeyboardControls } from '@react-three/drei';
import { useMultiplayer } from '../lib/stores/useMultiplayer';
import Player from './Player';
import World from './World';
import Weapon from './Weapon';
import Bullet from './Bullet';
import { usePlayer } from '../lib/stores/usePlayer';
import { Controls } from '../App';
import { useGameControls } from '../lib/stores/useGameControls';

interface GameProps {
  username: string;
}

const Game = ({ username }: GameProps) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const { 
    otherPlayers, 
    bullets,
    addBullet,
    removeBullet
  } = useMultiplayer();
  const { 
    position, 
    rotation,
    health,
    ammo,
    score,
    updatePosition, 
    updateRotation,
    shootBullet,
    reloadAmmo,
    resetPlayer
  } = usePlayer();
  const { 
    hasInteracted, 
    setControlsLocked, 
    isControlsLocked 
  } = useGameControls();

  // Initialize player controls
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.addEventListener('lock', () => {
        console.log('Controls locked');
        setControlsLocked(true);
      });
      
      controlsRef.current.addEventListener('unlock', () => {
        console.log('Controls unlocked');
        setControlsLocked(false);
      });
    }

    // Reset player on game start
    resetPlayer();

    // Clean up on unmount
    return () => {
      if (controlsRef.current) {
        controlsRef.current.removeEventListener('lock', () => {});
        controlsRef.current.removeEventListener('unlock', () => {});
      }
    };
  }, [resetPlayer, setControlsLocked]);
  
  // Attempt to lock controls when user has interacted
  useEffect(() => {
    if (hasInteracted && controlsRef.current && !isControlsLocked) {
      console.log('User has interacted, attempting to lock controls');
      try {
        controlsRef.current.lock();
      } catch (error) {
        console.error('Failed to lock controls:', error);
      }
    }
  }, [hasInteracted, isControlsLocked]);

  // Get keyboard controls state
  const [, getKeys] = useKeyboardControls<Controls>();
  const { updatePlayerPosition } = useMultiplayer();
  
  // Track the last time we sent a position update to the server
  const lastUpdateRef = useRef<number>(0);
  
  // Keyboard event handling for reloading
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 'R' key for reloading
      if (e.code === 'KeyR') {
        console.log('Reloading weapon');
        // Use the reloadAmmo function from the player store
        reloadAmmo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [reloadAmmo]);

  // Update player position and camera
  useFrame((state, delta) => {
    if (!controlsRef.current) return;
    
    // Only process movement when controls are locked (pointer lock is active)
    if (!isControlsLocked || !hasInteracted) return;
    
    // Get the current keyboard state
    const { 
      forward, 
      backward, 
      left, 
      right, 
      jump 
    } = getKeys();

    // Calculate movement direction based on camera orientation
    const direction = new THREE.Vector3();
    const sideDirection = new THREE.Vector3();
    const rotation = new THREE.Euler(0, 0, 0, 'YXZ');
    
    // Get camera direction
    camera.getWorldDirection(direction);
    direction.y = 0; // Keep movement on horizontal plane
    direction.normalize();
    
    // Calculate side direction (perpendicular to camera direction)
    sideDirection.copy(direction).cross(new THREE.Vector3(0, 1, 0));
    
    // Get camera rotation
    rotation.setFromQuaternion(camera.quaternion);
    
    // Update player position based on key presses
    const moveSpeed = 5 * delta; // Speed multiplier
    const newPosition = position.clone();
    
    // Forward/backward movement
    if (forward) {
      newPosition.add(direction.clone().multiplyScalar(moveSpeed));
    }
    if (backward) {
      newPosition.add(direction.clone().multiplyScalar(-moveSpeed));
    }
    
    // Left/right movement
    if (left) {
      newPosition.add(sideDirection.clone().multiplyScalar(-moveSpeed));
    }
    if (right) {
      newPosition.add(sideDirection.clone().multiplyScalar(moveSpeed));
    }
    
    // Simple jumping
    if (jump) {
      // Implementation for jump can be added here
    }
    
    // Update player position
    updatePosition(newPosition);
    
    // Update player rotation (only Y component for horizontal rotation)
    updateRotation(rotation.y);
    
    // Update camera position to match player position
    camera.position.copy(new THREE.Vector3(
      newPosition.x,
      newPosition.y + 1.6, // Eye height
      newPosition.z
    ));
    
    // Throttle updates to the server (only send 10 updates per second)
    const currentTime = state.clock.getElapsedTime() * 1000;
    if (currentTime - lastUpdateRef.current > 100) {
      // Send position updates to multiplayer state (which forwards to server)
      updatePlayerPosition(newPosition, rotation.y);
      lastUpdateRef.current = currentTime;
    }
  });

  return (
    <>
      <Stats />
      <PointerLockControls ref={controlsRef} />
      
      {/* Game world with environment and obstacles */}
      <World />
      
      {/* Main player */}
      <Player 
        isMainPlayer={true}
        position={position}
        rotation={rotation}
        health={health}
      />
      
      {/* Render other players */}
      {Object.values(otherPlayers).map((player) => (
        <Player 
          key={player.id}
          isMainPlayer={false}
          position={player.position}
          rotation={player.rotation}
          health={player.health}
          username={player.username}
        />
      ))}
      
      {/* Render active bullets */}
      {bullets.map((bullet) => (
        <Bullet 
          key={bullet.id}
          position={bullet.position}
          velocity={bullet.velocity}
          owner={bullet.owner}
        />
      ))}
      
      {/* First-person weapon - positioned to match the reference image */}
      <Weapon 
        position={[0.35, -0.25, -0.4]} 
        rotation={[0, Math.PI, 0]}
        ammo={ammo}
        onShoot={shootBullet}
      />
    </>
  );
};

export default Game;
