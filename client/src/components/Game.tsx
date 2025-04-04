import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PointerLockControls, useKeyboardControls } from '@react-three/drei';
import Player from './Player';
import World from './World';
import LaserWeapon from './LaserWeapon';
import LaserBullet from './LaserBullet';
import { Controls } from '../App';
import { useGameControls } from '../lib/stores/useGameControls';
import { KeyMapping } from '../lib/utils';
import { usePlayer, useMultiplayer } from '../lib/stores/initializeStores';
import { useIsMobile } from '../hooks/use-is-mobile';
import { useAudio } from '../lib/stores/useAudio';

interface GameProps {
  username: string;
}

const Game = ({ username }: GameProps) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const isMobile = useIsMobile();
  
  // Touch controls state for mobile devices
  const [touchControls, setTouchControls] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });
  const [touchStartPos, setTouchStartPos] = useState<{x: number, y: number} | null>(null);
  const lastTouchUpdateTime = useRef(0);
  const touchRotationSpeed = 0.05;
  
  // State for bullets
  const [bullets, setBullets] = useState<Array<{
    id: string;
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    owner: string;
    createdAt: number;
  }>>([]);
  
  const { 
    otherPlayers
  } = useMultiplayer();
  const { 
    playerId,
    position, 
    rotation,
    health,
    score,
    updatePosition, 
    updateRotation,
    resetPlayer
  } = usePlayer();
  const { 
    hasInteracted, 
    setControlsLocked, 
    isControlsLocked 
  } = useGameControls();
  
  const { createPositionalSound } = useAudio();

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
  
  // Set up mobile touch controls
  useEffect(() => {
    if (!isMobile) return;
    
    // Create fixed mobile touch controls for movement
    const createMobileTouchControls = () => {
      // Create container
      const controlsContainer = document.createElement('div');
      controlsContainer.style.position = 'fixed';
      controlsContainer.style.bottom = '20px';
      controlsContainer.style.left = '20px';
      controlsContainer.style.zIndex = '1000';
      controlsContainer.id = 'mobile-controls';
      
      // Create directional buttons
      const createButton = (id: string, text: string, top: string, left: string) => {
        const button = document.createElement('div');
        button.id = id;
        button.innerText = text;
        button.style.position = 'absolute';
        button.style.top = top;
        button.style.left = left;
        button.style.width = '60px';
        button.style.height = '60px';
        button.style.backgroundColor = 'rgba(255,255,255,0.3)';
        button.style.borderRadius = '30px';
        button.style.display = 'flex';
        button.style.justifyContent = 'center';
        button.style.alignItems = 'center';
        button.style.fontSize = '24px';
        button.style.fontWeight = 'bold';
        button.style.color = 'white';
        button.style.userSelect = 'none';
        button.style.touchAction = 'manipulation';
        return button;
      };
      
      // Forward button (top)
      const forwardBtn = createButton('mobile-forward', '↑', '0px', '60px');
      controlsContainer.appendChild(forwardBtn);
      
      // Left button (left)
      const leftBtn = createButton('mobile-left', '←', '60px', '0px');
      controlsContainer.appendChild(leftBtn);
      
      // Right button (right)
      const rightBtn = createButton('mobile-right', '→', '60px', '120px');
      controlsContainer.appendChild(rightBtn);
      
      // Backward button (bottom)
      const backwardBtn = createButton('mobile-backward', '↓', '120px', '60px');
      controlsContainer.appendChild(backwardBtn);
      
      // Add the controls to the page
      document.body.appendChild(controlsContainer);
      
      // Set up touch event handlers
      const setupTouchHandler = (element: HTMLElement, controlKey: keyof typeof touchControls, start: () => void, end: () => void) => {
        element.addEventListener('touchstart', (e) => {
          e.preventDefault();
          start();
        });
        
        element.addEventListener('touchend', (e) => {
          e.preventDefault();
          end();
        });
      };
      
      // Setup movement touch handlers
      setupTouchHandler(
        forwardBtn, 
        'forward',
        () => setTouchControls(prev => ({ ...prev, forward: true })),
        () => setTouchControls(prev => ({ ...prev, forward: false }))
      );
      
      setupTouchHandler(
        backwardBtn, 
        'backward',
        () => setTouchControls(prev => ({ ...prev, backward: true })),
        () => setTouchControls(prev => ({ ...prev, backward: false }))
      );
      
      setupTouchHandler(
        leftBtn, 
        'left',
        () => setTouchControls(prev => ({ ...prev, left: true })),
        () => setTouchControls(prev => ({ ...prev, left: false }))
      );
      
      setupTouchHandler(
        rightBtn, 
        'right',
        () => setTouchControls(prev => ({ ...prev, right: true })),
        () => setTouchControls(prev => ({ ...prev, right: false }))
      );
      
      // Setup screen touch for camera rotation
      document.addEventListener('touchstart', (e) => {
        // Only process touches in the center area of the screen (for camera control)
        if (e.touches[0].clientX > window.innerWidth/4 && 
            e.touches[0].clientX < window.innerWidth * 3/4 &&
            e.touches[0].clientY > window.innerHeight/4 &&
            e.touches[0].clientY < window.innerHeight * 3/4) {
          setTouchStartPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
        }
      });
      
      document.addEventListener('touchmove', (e) => {
        if (touchStartPos) {
          const currentX = e.touches[0].clientX;
          const currentY = e.touches[0].clientY;
          
          // Calculate how much the touch has moved
          const deltaX = currentX - touchStartPos.x;
          
          // Update camera rotation based on touch movement
          if (Math.abs(deltaX) > 5) { // Only rotate if moved significantly
            const newRotationY = rotation + (deltaX * touchRotationSpeed * -0.01);
            updateRotation(newRotationY);
            
            // Reset touch start position to current position
            setTouchStartPos({ x: currentX, y: currentY });
          }
        }
      });
      
      document.addEventListener('touchend', () => {
        setTouchStartPos(null);
      });
    };
    
    // On mobile, immediately set controls as locked (we don't use pointer lock)
    if (hasInteracted && !isControlsLocked) {
      console.log('Mobile device detected, setting controls as locked');
      setControlsLocked(true);
      createMobileTouchControls();
    }
    
    return () => {
      // Clean up mobile controls on unmount
      const controlsContainer = document.getElementById('mobile-controls');
      if (controlsContainer) document.body.removeChild(controlsContainer);
    };
  }, [isMobile, hasInteracted, isControlsLocked, rotation, updateRotation]);
  
  // Handle desktop pointer lock
  useEffect(() => {
    // Skip on mobile devices since we don't use pointer lock there
    if (isMobile) return;
    
    if (hasInteracted && controlsRef.current && !isControlsLocked) {
      console.log('Desktop user has interacted, attempting to lock controls');
      
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
  }, [camera, hasInteracted, isControlsLocked, isMobile]);

  // Get keyboard controls state
  const [, getKeys] = useKeyboardControls();
  const { updatePlayerPosition, fireBullet, bullets: remoteBullets } = useMultiplayer();
  
  // Track the last time we sent a position update to the server
  const lastUpdateRef = useRef<number>(0);
  
  // Function to create a new laser bullet
  const shootLaser = () => {
    // Create direction vector based on camera direction
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    
    // Calculate gun position in world space (in front of and to the right of camera)
    const gunOffset = new THREE.Vector3(0.4, -0.3, -0.5); // First-person gun position
    
    // Create a rotation matrix from camera quaternion
    const rotationMatrix = new THREE.Matrix4().makeRotationFromQuaternion(camera.quaternion);
    
    // Apply the rotation to the gun offset
    gunOffset.applyMatrix4(rotationMatrix);
    
    // Calculate the bullet spawn position (at the end of the gun barrel)
    const barrelOffset = new THREE.Vector3(0, 0, 0.5).applyMatrix4(rotationMatrix);
    
    // Final bullet position: camera position + gun offset + barrel length
    const bulletPosition = new THREE.Vector3().addVectors(
      camera.position,
      new THREE.Vector3().addVectors(gunOffset, barrelOffset)
    );
    
    // Create bullet with unique ID
    const newBullet = {
      id: `bullet_${playerId}_${Date.now()}`,
      position: bulletPosition,
      velocity: direction.clone().normalize().multiplyScalar(180), // Ultra-fast laser speed (tripled)
      owner: playerId,
      createdAt: Date.now()
    };
    
    // Add bullet to local state for rendering (legacy support)
    setBullets(prev => [...prev, newBullet]);
    
    // Add bullet to multiplayer store for syncing with other players
    fireBullet(newBullet);
    
    // Play laser sound
    const laserSound = new Audio('/sounds/laser.mp3');
    laserSound.volume = 0.3;
    laserSound.play().catch(e => console.error("Error playing laser sound:", e));
    
    // Log bullet creation
    console.log('Created laser bullet:', newBullet);
  };
  
  // Expose shootLaser function globally
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.shootBullet = shootLaser;
      
      // For testing
      window.testShoot = () => {
        shootLaser();
        return "Bullet fired!";
      };
      
      // For debugging
      window.getBullets = () => ({
        local: bullets,
        remote: remoteBullets
      });
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete window.shootBullet;
        delete window.testShoot;
        delete window.getBullets;
      }
    };
  }, [bullets, playerId, position, camera]);
  
  // Clean up old bullets
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setBullets(prev => prev.filter(bullet => now - bullet.createdAt < 3000)); // Match bullet lifetime in LaserBullet component
    }, 500);
    
    return () => clearInterval(cleanupInterval);
  }, []);
  
  // Update player position and camera
  useFrame((state, delta) => {
    if (!hasInteracted) return;
    if (!isMobile && !controlsRef.current) return;
    
    // On mobile we don't need pointer lock, on desktop we do
    if (!isMobile && !isControlsLocked) return;
    
    // Calculate movement direction based on camera orientation
    const direction = new THREE.Vector3();
    const sideDirection = new THREE.Vector3();
    const rotationEuler = new THREE.Euler(0, 0, 0, 'YXZ');
    
    // Get camera direction
    camera.getWorldDirection(direction);
    direction.y = 0; // Keep movement on horizontal plane
    direction.normalize();
    
    // Calculate side direction (perpendicular to camera direction)
    sideDirection.copy(direction).cross(new THREE.Vector3(0, 1, 0));
    
    // Get camera rotation
    rotationEuler.setFromQuaternion(camera.quaternion);
    
    // Update player position based on controls
    const moveSpeed = 5 * delta; // Speed multiplier
    const newPosition = position.clone();
    
    // Get movement input from either keyboard or touch controls
    let controlInput;
    
    if (isMobile) {
      // Use touch controls on mobile
      controlInput = {
        forward: touchControls.forward,
        backward: touchControls.backward,
        left: touchControls.left,
        right: touchControls.right,
        jump: false // Mobile doesn't have jump yet
      };
    } else {
      // Use keyboard controls on desktop
      controlInput = getKeys() as KeyMapping;
    }
    
    // Apply movement based on inputs (keyboard or touch)
    const { forward, backward, left, right, jump } = controlInput;
    
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
    updateRotation(rotationEuler.y);
    
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
      updatePlayerPosition(newPosition, rotationEuler.y);
      lastUpdateRef.current = currentTime;
    }
    
    // Update bullets position
    setBullets(prev => prev.map(bullet => ({
      ...bullet,
      position: bullet.position.clone().add(bullet.velocity.clone().multiplyScalar(delta))
    })));
  });

  return (
    <>
      {/* Only use PointerLockControls on desktop */}
      {!isMobile && <PointerLockControls ref={controlsRef} />}
      
      {/* Game world with environment and obstacles */}
      <World />
      
      {/* Main player */}
      <Player 
        isMainPlayer={true}
        position={position}
        rotation={rotation}
        health={health}
      />
      
      {/* Player's weapon - first person view */}
      {isControlsLocked && (
        <LaserWeapon 
          position={[0.35, -0.4, -0.7]} 
          rotation={[0, Math.PI / 8, 0]} 
          onShoot={shootLaser}
        />
      )}
      
      {/* Render local bullets */}
      {bullets.map((bullet) => (
        <LaserBullet
          key={bullet.id}
          id={bullet.id}
          position={bullet.position}
          velocity={bullet.velocity}
          owner={bullet.owner}
        />
      ))}
      
      {/* Render remote bullets from other players */}
      {remoteBullets.map((bullet) => (
        <LaserBullet
          key={bullet.id}
          id={bullet.id}
          position={bullet.position}
          velocity={bullet.velocity}
          owner={bullet.owner}
        />
      ))}
      
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
      
      {/* Add mobile game stats text UI */}
      {isMobile && (
        <mesh position={[0, 0, -1]} renderOrder={1000}>
          <sprite scale={[1, 0.5, 1]} position={[0, 0.5, 0]}>
            <spriteMaterial transparent depthTest={false}>
              <canvasTexture attach="map" args={[
                (() => {
                  // Create a canvas to show player stats
                  const canvas = document.createElement('canvas');
                  canvas.width = 256;
                  canvas.height = 128;
                  const ctx = canvas.getContext('2d')!;
                  ctx.fillStyle = 'rgba(0,0,0,0.5)';
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                  ctx.font = '24px Arial';
                  ctx.fillStyle = 'white';
                  ctx.textAlign = 'center';
                  ctx.fillText(`Health: ${health}`, canvas.width/2, canvas.height/2);
                  return canvas;
                })()
              ]} />
            </spriteMaterial>
          </sprite>
        </mesh>
      )}
    </>
  );
};

export default Game;