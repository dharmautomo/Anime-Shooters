import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useKeyboardControls, useAnimations } from '@react-three/drei';
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
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const { updatePosition, takeDamage, respawn } = usePlayer();
  const { updatePlayerPosition } = useMultiplayer();
  const { scene } = useThree();
  
  // Animation states for anime character
  const [blinking, setBlinking] = useState(false);
  const [blinkTimer, setBlinkTimer] = useState(0);
  const [animationTime, setAnimationTime] = useState(0);
  
  // Randomize player appearance - use player ID/username for consistent colors
  const playerSeed = username || 'default';
  const hashCode = playerSeed.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  // Generate somewhat random but deterministic colors based on username
  const getColor = (offset = 0) => {
    const h = Math.abs((hashCode + offset) % 360);
    return `hsl(${h}, 70%, 60%)`;
  };
  
  // Player appearance settings
  const hairColor = getColor(0);
  const clothesColor = getColor(120);
  const pantsColor = getColor(240);
  
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
  // Set up eye blinking effect
  useEffect(() => {
    if (!isMainPlayer) {
      // Set up random eye blinking
      const blinkInterval = setInterval(() => {
        setBlinking(true);
        setTimeout(() => {
          setBlinking(false);
        }, 200); // Blink duration
      }, 3000 + Math.random() * 4000); // Random interval between blinks
      
      return () => clearInterval(blinkInterval);
    }
  }, [isMainPlayer]);

  useFrame((state, delta) => {
    // Update animation timer
    setAnimationTime(prev => prev + delta);
    
    // Handle player movement and animations
    if (isMainPlayer && playerRef.current) {
      // Get the camera's direction vector
      const direction = new THREE.Vector3();
      state.camera.getWorldDirection(direction);
      
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
      forwardDirection.applyQuaternion(state.camera.quaternion);
      forwardDirection.y = 0; // Keep movement on the XZ plane
      forwardDirection.normalize();
      
      const rightDirection = new THREE.Vector3(1, 0, 0);
      rightDirection.applyQuaternion(state.camera.quaternion);
      rightDirection.y = 0; // Keep movement on the XZ plane
      rightDirection.normalize();
      
      // Calculate the actual move direction
      const moveDirection = new THREE.Vector3();
      moveDirection.addScaledVector(forwardDirection, -moveVector.z);
      moveDirection.addScaledVector(rightDirection, moveVector.x);
      
      // Calculate new potential position
      const newPosition = new THREE.Vector3().addVectors(
        new THREE.Vector3(state.camera.position.x, state.camera.position.y, state.camera.position.z),
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
        state.camera.position.set(newPosition.x, newPosition.y, newPosition.z);
        
        // Update player state
        updatePosition(newPosition);
        
        // Sync with server
        updatePlayerPosition(newPosition, rotation);
      }
      
      // Update player mesh position
      playerRef.current.position.copy(state.camera.position);
      
      // Adjust player rotation to match camera's horizontal rotation
      playerRef.current.rotation.y = rotation;
    } else if (!isMainPlayer && playerRef.current) {
      // For other players, update the mesh position and rotation based on props
      // Using y-offset of -1 as requested
      const yPos = (position instanceof THREE.Vector3 ? position.y : position[1]);
      console.log('Player position before adjustment:', yPos);
      
      playerRef.current.position.set(
        position instanceof THREE.Vector3 ? position.x : position[0],
        yPos - 1, // Apply -1 y-offset
        position instanceof THREE.Vector3 ? position.z : position[2]
      );
      console.log('Player position after adjustment:', playerRef.current.position.y);
      playerRef.current.rotation.y = rotation;
      
      // Animate the eyes for blinking effect
      if (leftEyeRef.current && rightEyeRef.current) {
        // Eye blinking animation
        if (blinking) {
          leftEyeRef.current.scale.y = 0.1;  // Almost closed eyes
          rightEyeRef.current.scale.y = 0.1;
        } else {
          leftEyeRef.current.scale.y = 1;   // Open eyes
          rightEyeRef.current.scale.y = 1;
        }
        
        // Subtle eye movement
        const eyeMovement = Math.sin(animationTime * 1.5) * 0.03;
        leftEyeRef.current.position.x = 0.15 + eyeMovement;
        rightEyeRef.current.position.x = -0.15 + eyeMovement;
      }
      
      // Animate mouth for expressions
      if (mouthRef.current) {
        // Create subtle mouth movement for a more lively character
        const mouthMovement = Math.sin(animationTime * 2) * 0.01;
        mouthRef.current.scale.x = 1 + mouthMovement;
        mouthRef.current.scale.y = 1 + mouthMovement;
      }
    }
  });
  
  return (
    <group ref={playerRef}>
      {/* Anime-style player character for other players */}
      {!isMainPlayer && (
        <>
          {/* Head - slightly larger for anime style - position adjusted */}
          <mesh position={[0, 1, 0]}>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshStandardMaterial color="#FFD5CD" />
          </mesh>
          
          {/* Hair - stylized anime hair - position adjusted */}
          <group position={[0, 1.15, 0]}>
            {/* Top hair */}
            <mesh position={[0, 0.15, 0]}>
              <sphereGeometry args={[0.42, 16, 16]} />
              <meshStandardMaterial 
                color={health > 0 ? hairColor : "#ff0000"}
                opacity={health > 0 ? 1 : 0.7}
                transparent={health <= 0}
              />
            </mesh>
            
            {/* Front bangs */}
            <mesh position={[0, 0.1, 0.25]}>
              <boxGeometry args={[0.8, 0.25, 0.2]} />
              <meshStandardMaterial 
                color={health > 0 ? hairColor : "#ff0000"}
                opacity={health > 0 ? 1 : 0.7}
                transparent={health <= 0}
              />
            </mesh>
            
            {/* Side hair */}
            <mesh position={[0.35, -0.2, 0]}>
              <boxGeometry args={[0.15, 0.5, 0.3]} />
              <meshStandardMaterial 
                color={health > 0 ? hairColor : "#ff0000"}
                opacity={health > 0 ? 1 : 0.7}
                transparent={health <= 0}
              />
            </mesh>
            <mesh position={[-0.35, -0.2, 0]}>
              <boxGeometry args={[0.15, 0.5, 0.3]} />
              <meshStandardMaterial 
                color={health > 0 ? hairColor : "#ff0000"}
                opacity={health > 0 ? 1 : 0.7}
                transparent={health <= 0}
              />
            </mesh>
          </group>
          
          {/* Eyes with refs for animation - position adjusted */}
          <mesh ref={leftEyeRef} position={[0.15, 1, 0.35]} rotation={[0, 0, 0]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
          <mesh ref={rightEyeRef} position={[-0.15, 1, 0.35]} rotation={[0, 0, 0]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
          
          {/* Eye whites for anime look - position adjusted */}
          <mesh position={[0.15, 1.02, 0.36]} rotation={[0, 0, 0]} scale={[0.4, 0.4, 0.4]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[-0.15, 1.02, 0.36]} rotation={[0, 0, 0]} scale={[0.4, 0.4, 0.4]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          
          {/* Glasses - anime glasses effect - position adjusted */}
          <mesh position={[0, 1, 0.36]} rotation={[0, 0, 0]}>
            <ringGeometry args={[0.12, 0.14, 16]} />
            <meshStandardMaterial color="#555555" />
          </mesh>
          
          {/* Mouth - position adjusted */}
          <mesh ref={mouthRef} position={[0, 0.85, 0.38]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.12, 0.03, 0.01]} />
            <meshStandardMaterial color="#cc6666" />
          </mesh>
          
          {/* Body - Shirt with unique color - Lowered to ground level */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.7, 1.2, 0.4]} />
            <meshStandardMaterial 
              color={health > 0 ? clothesColor : "#ff0000"} 
              opacity={health > 0 ? 1 : 0.5}
              transparent={health <= 0}
            />
          </mesh>
          
          {/* Arms */}
          <mesh position={[0.45, 0, 0]}>
            <boxGeometry args={[0.2, 1, 0.2]} />
            <meshStandardMaterial color="#FFD5CD" />
          </mesh>
          <mesh position={[-0.45, 0, 0]}>
            <boxGeometry args={[0.2, 1, 0.2]} />
            <meshStandardMaterial color="#FFD5CD" />
          </mesh>
          
          {/* Legs - Pants with unique color - touching ground */}
          <mesh position={[0.2, -1, 0]}>
            <boxGeometry args={[0.25, 1, 0.25]} />
            <meshStandardMaterial color={pantsColor} />
          </mesh>
          <mesh position={[-0.2, -1, 0]}>
            <boxGeometry args={[0.25, 1, 0.25]} />
            <meshStandardMaterial color={pantsColor} />
          </mesh>
          
          {/* Weapon - Pistol */}
          <group position={[0.6, 0, 0.4]} rotation={[0, -Math.PI / 2, 0]}>
            {/* Gun handle */}
            <mesh position={[0, -0.15, 0]} rotation={[0, 0, -Math.PI / 12]}>
              <boxGeometry args={[0.1, 0.3, 0.15]} />
              <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            
            {/* Gun barrel */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.4, 0.12, 0.15]} />
              <meshStandardMaterial color="#333333" />
            </mesh>
            
            {/* Gun details */}
            <mesh position={[0.15, -0.05, 0]}>
              <boxGeometry args={[0.05, 0.05, 0.17]} />
              <meshStandardMaterial color="#1a1a1a" />
            </mesh>
            
            {/* Gun trigger */}
            <mesh position={[0, -0.05, 0]}>
              <boxGeometry args={[0.05, 0.05, 0.05]} />
              <meshStandardMaterial color="#111111" />
            </mesh>
          </group>
        </>
      )}
      
      {/* Player name tag (only for other players) - position adjusted above player */}
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
    // Get player-specific color for the border based on username
    const playerSeed = name || 'default';
    const hashCode = playerSeed.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    const h = Math.abs((hashCode) % 360);
    const borderColor = `hsl(${h}, 70%, 60%)`;
    
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
    
    // Add border with player-specific color
    context.strokeStyle = borderColor;
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
