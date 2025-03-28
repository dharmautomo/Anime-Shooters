import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PointerLockControls, Stats } from '@react-three/drei';
import { useMultiplayer } from '../lib/stores/useMultiplayer';
import Player from './Player';
import World from './World';
import Weapon from './Weapon';
import Bullet from './Bullet';
import { usePlayer } from '../lib/stores/usePlayer';

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
    resetPlayer
  } = usePlayer();

  // Initialize player controls
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.addEventListener('lock', () => {
        console.log('Controls locked');
      });
      
      controlsRef.current.addEventListener('unlock', () => {
        console.log('Controls unlocked');
      });
      
      // Lock controls on first render
      controlsRef.current.lock();
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
  }, [resetPlayer]);

  // Update direction vector from camera
  useFrame(() => {
    // Update player position and rotation to match camera
    if (controlsRef.current) {
      const direction = new THREE.Vector3();
      const rotation = new THREE.Euler(0, 0, 0, 'YXZ');
      
      // Get camera direction
      camera.getWorldDirection(direction);
      
      // Get camera rotation
      rotation.setFromQuaternion(camera.quaternion);
      
      // Update player rotation (only Y component for horizontal rotation)
      updateRotation(rotation.y);
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
      
      {/* First-person weapon */}
      <Weapon 
        position={[0.3, -0.3, -0.5]} 
        rotation={[0, Math.PI, 0]}
        ammo={ammo}
        onShoot={shootBullet}
      />
    </>
  );
};

export default Game;
