import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PointerLockControls, useKeyboardControls } from '@react-three/drei';
import Player from './Player';
import World from './World';
import Weapon from './Weapon';
import Bullet from './Bullet';
import { Controls } from '../App';
import { useGameControls } from '../lib/stores/useGameControls';
import { KeyMapping } from '../lib/utils';
import { usePlayer, useMultiplayer } from '../lib/stores/initializeStores';

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
    // Define the event handlers separately so we can properly remove them
    const handleLock = () => {
      console.log('Controls locked');
      setControlsLocked(true);
    };
    
    const handleUnlock = () => {
      console.log('Controls unlocked');
      setControlsLocked(false);
    };
    
    if (controlsRef.current) {
      // Add event listeners for pointer lock events
      controlsRef.current.addEventListener('lock', handleLock);
      controlsRef.current.addEventListener('unlock', handleUnlock);
      
      // Initialize camera to look forward instead of down
      camera.rotation.set(0, 0, 0); // Reset all rotation (pitch, yaw, roll)
      
      // Reset the PointerLockControls internal state
      if (controlsRef.current.getObject) {
        const controlObject = controlsRef.current.getObject();
        if (controlObject) {
          controlObject.rotation.set(0, 0, 0);
        }
      }
    }

    // Reset player on game start
    resetPlayer();

    // Clean up on unmount
    return () => {
      if (controlsRef.current) {
        controlsRef.current.removeEventListener('lock', handleLock);
        controlsRef.current.removeEventListener('unlock', handleUnlock);
      }
    };
  }, [camera, resetPlayer, setControlsLocked]);
  
  // Attempt to lock controls when user has interacted
  useEffect(() => {
    if (hasInteracted && controlsRef.current && !isControlsLocked) {
      console.log('User has interacted, attempting to lock controls');
      
      // We'll try multiple times to ensure it works
      const attemptLock = (attemptsLeft = 5) => {
        try {
          console.log(`Calling lock() on PointerLockControls (attempts left: ${attemptsLeft})`);
          
          // Ensure camera is looking forward when controls are first locked
          camera.rotation.set(0, 0, 0);
          
          controlsRef.current.lock();
          
          // Check if it worked immediately
          if (document.pointerLockElement) {
            console.log('Pointer lock successful!');
            
            // Additional reset after successful lock
            if (controlsRef.current.getObject) {
              const controlObject = controlsRef.current.getObject();
              if (controlObject) {
                controlObject.rotation.x = 0; // Ensure pitch is reset (looking forward)
              }
            }
          } else if (attemptsLeft > 0) {
            // Try again after a short delay
            setTimeout(() => attemptLock(attemptsLeft - 1), 200);
          } else {
            console.error('Failed to lock controls after multiple attempts');
          }
        } catch (error) {
          console.error('Failed to lock controls:', error);
          if (attemptsLeft > 0) {
            setTimeout(() => attemptLock(attemptsLeft - 1), 200);
          }
        }
      };
      
      // Start the first attempt after a short delay
      setTimeout(() => attemptLock(), 200);
      
      // Also add a click handler on the document to help with pointer lock
      const handleDocClick = () => {
        if (!document.pointerLockElement && controlsRef.current) {
          console.log('Document clicked, trying to lock pointer');
          try {
            controlsRef.current.lock();
          } catch (e) {
            console.error('Error when trying to lock on document click:', e);
          }
        }
      };
      
      document.addEventListener('click', handleDocClick);
      
      return () => {
        document.removeEventListener('click', handleDocClick);
      };
    }
  }, [camera, hasInteracted, isControlsLocked]);

  // Get keyboard controls state
  const [, getKeys] = useKeyboardControls();
  const { updatePlayerPosition } = useMultiplayer();
  
  // Track the last time we sent a position update to the server
  const lastUpdateRef = useRef<number>(0);
  
  // Keyboard event handling for reloading
  useEffect(() => {
    // Track if we're currently in a reload animation to prevent multiple reload calls
    let isCurrentlyReloading = false;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // 'R' key for reloading
      if (e.code === 'KeyR' && !isCurrentlyReloading && ammo < 10 && isControlsLocked && hasInteracted) {
        console.log('Reloading weapon - Current ammo:', ammo);
        
        // Set reloading flag
        isCurrentlyReloading = true;
        
        // Play reload sound (using global audio function)
        try {
          // Import audio store to play reload sound
          const { useAudio } = require('../lib/stores/useAudio');
          const { playSound } = useAudio.getState();
          setTimeout(() => {
            playSound('reload');
          }, 100);
        } catch (error) {
          console.error('Failed to play reload sound:', error);
        }
        
        // Actual reload happens after a delay to match animation
        setTimeout(() => {
          // Use the reloadAmmo function from the player store
          reloadAmmo();
          console.log('Weapon reloaded - New ammo count:', usePlayer.getState().ammo);
          
          // Clear reloading state after complete
          setTimeout(() => {
            isCurrentlyReloading = false;
          }, 500);
        }, 750);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [reloadAmmo, ammo, isControlsLocked, hasInteracted]);

  // Update player position and camera
  useFrame((state, delta) => {
    if (!controlsRef.current) return;
    
    // Only process movement when controls are locked (pointer lock is active)
    if (!isControlsLocked || !hasInteracted) return;
    
    // Get the current keyboard state with proper type casting
    const { 
      forward, 
      backward, 
      left, 
      right, 
      jump 
    } = getKeys() as KeyMapping;

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
          id={bullet.id} // Pass bullet ID explicitly
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
        onShoot={() => {
          // Call the shootBullet function directly
          shootBullet();
        }}
      />
    </>
  );
};

export default Game;
