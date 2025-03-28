import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useKeyboardControls } from '@react-three/drei';
import { Controls } from '../App';
import { usePlayer } from '../lib/stores/usePlayer';
import { useMultiplayer } from '../lib/stores/useMultiplayer';
import { checkCollision } from '../lib/utils/collisionDetection';

interface PlayerProps {
  isMainPlayer: boolean;
  position: THREE.Vector3 | [number, number, number];
  rotation: number;
  health: number;
  username?: string;
}

const Player = ({ isMainPlayer, position, rotation, health, username }: PlayerProps) => {
  const playerRef = useRef<THREE.Group>(null);
  const { updatePosition, takeDamage, respawn } = usePlayer();
  const { updatePlayerPosition } = useMultiplayer();
  const { scene } = useThree();
  
  // Get keyboard controls for main player
  const forward = useKeyboardControls<Controls>(state => state.forward);
  const backward = useKeyboardControls<Controls>(state => state.backward);
  const left = useKeyboardControls<Controls>(state => state.left);
  const right = useKeyboardControls<Controls>(state => state.right);
  const jump = useKeyboardControls<Controls>(state => state.jump);
  
  // Movement parameters
  const speed = 0.1;
  const jumpHeight = 0.2;
  
  // State for jumping
  const isJumping = useRef(false);
  const jumpVelocity = useRef(0);
  const currentHeight = useRef(1.6); // Player eye height
  
  // Handle player movement in every frame
  useFrame(({ camera }) => {
    if (isMainPlayer && playerRef.current) {
      // Get the camera's direction vector
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      
      // Create movement vector
      const moveVector = new THREE.Vector3(0, 0, 0);
      
      // Calculate forward/backward movement (Z axis)
      if (forward) {
        moveVector.z -= 1;
      }
      if (backward) {
        moveVector.z += 1;
      }
      
      // Calculate left/right movement (X axis)
      if (left) {
        moveVector.x -= 1;
      }
      if (right) {
        moveVector.x += 1;
      }
      
      // Normalize the movement vector to prevent diagonal movement being faster
      if (moveVector.length() > 0) {
        moveVector.normalize().multiplyScalar(speed);
      }
      
      // Adjust movement direction based on camera's facing direction
      const forwardDirection = new THREE.Vector3(0, 0, -1);
      forwardDirection.applyQuaternion(camera.quaternion);
      forwardDirection.y = 0; // Keep movement on the XZ plane
      forwardDirection.normalize();
      
      const rightDirection = new THREE.Vector3(1, 0, 0);
      rightDirection.applyQuaternion(camera.quaternion);
      rightDirection.y = 0; // Keep movement on the XZ plane
      rightDirection.normalize();
      
      // Calculate the actual move direction
      const moveDirection = new THREE.Vector3();
      moveDirection.addScaledVector(forwardDirection, -moveVector.z);
      moveDirection.addScaledVector(rightDirection, moveVector.x);
      
      // Calculate new potential position
      const newPosition = new THREE.Vector3().addVectors(
        new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z),
        moveDirection
      );
      
      // Handle jumping logic
      if (jump && !isJumping.current) {
        isJumping.current = true;
        jumpVelocity.current = jumpHeight;
      }
      
      if (isJumping.current) {
        // Apply gravity to jump velocity
        jumpVelocity.current -= 0.01;
        
        // Update height based on jump velocity
        currentHeight.current += jumpVelocity.current;
        
        // Check if player has landed
        if (currentHeight.current <= 1.6) {
          currentHeight.current = 1.6;
          isJumping.current = false;
          jumpVelocity.current = 0;
        }
        
        // Update Y position
        newPosition.y = currentHeight.current;
      }
      
      // Collision detection
      const obstacles = scene.children.filter(
        child => child.userData.isObstacle && child !== playerRef.current
      );
      
      const hasCollision = obstacles.some(obstacle => {
        if (obstacle.type === 'Mesh') {
          return checkCollision(
            newPosition, 
            0.5, // Player radius
            obstacle.position, 
            (obstacle as THREE.Mesh).geometry.boundingSphere?.radius || 1
          );
        }
        return false;
      });
      
      // Only update position if there's no collision
      if (!hasCollision) {
        // Update camera position
        camera.position.set(newPosition.x, newPosition.y, newPosition.z);
        
        // Update player state
        updatePosition(newPosition);
        
        // Sync with server
        updatePlayerPosition(newPosition, rotation);
      }
      
      // Update player mesh position
      playerRef.current.position.copy(camera.position);
      
      // Adjust player rotation to match camera's horizontal rotation
      playerRef.current.rotation.y = rotation;
    } else if (!isMainPlayer && playerRef.current) {
      // For other players, just update the mesh position and rotation based on props
      playerRef.current.position.set(
        position instanceof THREE.Vector3 ? position.x : position[0],
        position instanceof THREE.Vector3 ? position.y : position[1],
        position instanceof THREE.Vector3 ? position.z : position[2]
      );
      playerRef.current.rotation.y = rotation;
    }
  });
  
  return (
    <group ref={playerRef}>
      {/* Player mesh */}
      <mesh visible={!isMainPlayer}>
        <boxGeometry args={[1, 2, 1]} />
        <meshStandardMaterial 
          color={health > 0 ? "#4287f5" : "#ff0000"} 
          opacity={health > 0 ? 1 : 0.5}
          transparent={health <= 0}
        />
      </mesh>
      
      {/* Player name tag (only for other players) */}
      {!isMainPlayer && (
        <sprite
          position={[0, 2.5, 0]}
          scale={[3, 0.8, 1]}
        >
          <spriteMaterial attach="material">
            <canvasTexture attach="map" image={createNameTag(username || 'Unknown Player')} />
          </spriteMaterial>
        </sprite>
      )}
    </group>
  );
};

// Helper function to create player name tag
function createNameTag(name: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  
  if (context) {
    // Clear canvas with transparent background
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background with rounded corners
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    const radius = 10;
    context.beginPath();
    context.moveTo(radius, 0);
    context.lineTo(canvas.width - radius, 0);
    context.quadraticCurveTo(canvas.width, 0, canvas.width, radius);
    context.lineTo(canvas.width, canvas.height - radius);
    context.quadraticCurveTo(canvas.width, canvas.height, canvas.width - radius, canvas.height);
    context.lineTo(radius, canvas.height);
    context.quadraticCurveTo(0, canvas.height, 0, canvas.height - radius);
    context.lineTo(0, radius);
    context.quadraticCurveTo(0, 0, radius, 0);
    context.closePath();
    context.fill();
    
    // Add border
    context.strokeStyle = '#4287f5';
    context.lineWidth = 3;
    context.stroke();
    
    // Draw text
    context.font = 'bold 24px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Text shadow for better visibility
    context.shadowColor = 'rgba(0, 0, 0, 0.5)';
    context.shadowBlur = 4;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;
    
    // Draw text
    context.fillStyle = '#ffffff';
    context.fillText(name, canvas.width / 2, canvas.height / 2);
  }
  
  return canvas;
}

export default Player;
