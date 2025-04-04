import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useKeyboardControls, useAnimations } from '@react-three/drei';
import { Controls, ControlsType } from '../App';
import { usePlayer, useMultiplayer } from '../lib/stores/initializeStores';
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
  const playerBodyRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const nameTagRef = useRef<THREE.Sprite>(null);

  const { updatePosition, takeDamage, respawn } = usePlayer();
  const { updatePlayerPosition } = useMultiplayer();
  const { scene } = useThree();

  // Animation states
  const [blinking, setBlinking] = useState(false);
  const [isSmiling, setIsSmiling] = useState(false);
  const [walkCycle, setWalkCycle] = useState(false);
  const [damageFlash, setDamageFlash] = useState(false);
  const [animationTime, setAnimationTime] = useState(0);
  const [nameTagCanvas, setNameTagCanvas] = useState<HTMLCanvasElement | null>(null);
  const [bobOffset, setBobOffset] = useState(0);

  // Movement states
  const isJumping = useRef(false);
  const jumpVelocity = useRef(0);
  const currentHeight = useRef(1.6); // Player eye height

  // Randomize player appearance based on username
  const playerSeed = username || 'default';
  const hashCode = playerSeed.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  // Generate colors based on username for consistent player identification
  const getColor = (offset = 0) => {
    const h = Math.abs((hashCode + offset) % 360);
    return `hsl(${h}, 70%, 60%)`;
  };

  // Player appearance settings
  const hairColor = getColor(0);
  const clothesColor = getColor(120);
  const pantsColor = getColor(240);
  const accentColor = getColor(60);

  // Get keyboard controls for main player
  const forward = useKeyboardControls((state) => state[Controls.forward]);
  const backward = useKeyboardControls((state) => state[Controls.backward]);
  const left = useKeyboardControls((state) => state[Controls.left]);
  const right = useKeyboardControls((state) => state[Controls.right]);
  const jump = useKeyboardControls((state) => state[Controls.jump]);
  
  // Helper functions to get control states
  const getForward = () => forward;
  const getBackward = () => backward;
  const getLeft = () => left;
  const getRight = () => right;
  const getJump = () => jump;

  // Movement parameters
  const speed = 0.1;
  const jumpHeight = 0.2;

  // Create name tag texture - update when health changes
  useEffect(() => {
    if (!isMainPlayer && username) {
      console.log(`Updating name tag for player ${username} with health: ${health}`);
      const canvas = createNameTag(username, health);
      setNameTagCanvas(canvas);
    }
  }, [isMainPlayer, username, health]); // Health is a dependency so it updates when health changes

  // Handle animations based on player state
  useEffect(() => {
    // Set walk cycle animation state
    setWalkCycle(getForward() || getBackward() || getLeft() || getRight());
  }, [forward, backward, left, right]);

  // Set up eye blinking and expressions
  useEffect(() => {
    if (!isMainPlayer) {
      // Random eye blinking
      const blinkInterval = setInterval(() => {
        setBlinking(true);
        setTimeout(() => {
          setBlinking(false);
        }, 200); // Blink duration
      }, 3000 + Math.random() * 4000); // Random interval between blinks

      // Random expressions
      const expressionInterval = setInterval(() => {
        const shouldSmile = Math.random() > 0.7;
        setIsSmiling(shouldSmile);
        setTimeout(() => setIsSmiling(false), 2000);
      }, 8000);

      return () => {
        clearInterval(blinkInterval);
        clearInterval(expressionInterval);
      };
    }
  }, [isMainPlayer]);

  // Function to handle taking damage with visual feedback
  const handleDamage = (amount: number) => {
    takeDamage(amount);

    // Visual damage feedback
    setDamageFlash(true);
    setTimeout(() => setDamageFlash(false), 200);
  };

  // Main animation loop
  useFrame((state, delta) => {
    // Update animation timer
    setAnimationTime(prev => prev + delta);

    // Calculate bob offset for walking animation
    if (walkCycle) {
      const bobHeight = Math.sin(animationTime * 10) * 0.05;
      setBobOffset(bobHeight);
    } else {
      // Subtle idle breathing motion
      const breatheOffset = Math.sin(animationTime * 2) * 0.01;
      setBobOffset(breatheOffset);
    }

    // Handle player movement and animations
    if (isMainPlayer && playerRef.current) {
      // Get the camera's direction vector
      const direction = new THREE.Vector3();
      state.camera.getWorldDirection(direction);

      // Create movement vector
      const moveVector = new THREE.Vector3(0, 0, 0);

      // Calculate forward/backward movement (Z axis)
      if (getForward()) {
        moveVector.z -= 1;
      }
      if (getBackward()) {
        moveVector.z += 1;
      }

      // Calculate left/right movement (X axis)
      if (getLeft()) {
        moveVector.x -= 1;
      }
      if (getRight()) {
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
      if (getJump() && !isJumping.current) {
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
      const yPos = (position instanceof THREE.Vector3 ? position.y : position[1]);

      // Apply position with bob offset for walking animation
      playerRef.current.position.set(
        position instanceof THREE.Vector3 ? position.x : position[0],
        yPos + bobOffset, // Apply bob offset for smoother walking without sinking
        position instanceof THREE.Vector3 ? position.z : position[2]
      );
      playerRef.current.rotation.y = rotation;

      // Make body subtly sway while walking
      if (playerBodyRef.current) {
        if (walkCycle) {
          playerBodyRef.current.rotation.z = Math.sin(animationTime * 5) * 0.05;
        } else {
          playerBodyRef.current.rotation.z = Math.sin(animationTime * 2) * 0.01; // Subtle idle sway
        }
      }

      // Update name tag position
      if (nameTagRef.current) {
        nameTagRef.current.position.set(0, 2.5, 0);
      }

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
        if (isSmiling) {
          mouthRef.current.scale.set(1.5, 0.8, 1);
          mouthRef.current.position.y = 0.83;
        } else {
          // Normal mouth with subtle movements
          const mouthMovement = Math.sin(animationTime * 2) * 0.01;
          mouthRef.current.scale.set(1 + mouthMovement, 1 + mouthMovement, 1);
          mouthRef.current.position.y = 0.85;
        }
      }

      // Animate arms while walking
      if (leftArmRef.current && rightArmRef.current) {
        if (walkCycle) {
          leftArmRef.current.rotation.x = Math.sin(animationTime * 5) * 0.5;
          rightArmRef.current.rotation.x = Math.sin(animationTime * 5 + Math.PI) * 0.5;
        } else {
          // Subtle idle arm movement
          leftArmRef.current.rotation.x = Math.sin(animationTime * 0.8) * 0.05;
          rightArmRef.current.rotation.x = Math.sin(animationTime * 0.8 + Math.PI) * 0.05;
        }
      }

      // Animate legs while walking
      if (leftLegRef.current && rightLegRef.current) {
        if (walkCycle) {
          leftLegRef.current.rotation.x = Math.sin(animationTime * 5) * 0.7;
          rightLegRef.current.rotation.x = Math.sin(animationTime * 5 + Math.PI) * 0.7;
        } else {
          leftLegRef.current.rotation.x = 0;
          rightLegRef.current.rotation.x = 0;
        }
      }
    }
  });

  return (
    <group ref={playerRef}>
      {/* First-person view for main player - weapon has been removed */}
      {isMainPlayer && (
        // Empty group maintained for compatibility with any code that might reference this
        <group></group>
      )}
      
      {/* Character Model - only visible for other players */}
      {!isMainPlayer && (
        <group ref={playerBodyRef}>
          {/* Head with smaller, more natural proportions */}
          <mesh position={[0, 1, 0]} castShadow>
            <sphereGeometry args={[0.35, 24, 24]} />
            <meshStandardMaterial color="#e6ccb3" roughness={0.7} metalness={0.1} />
          </mesh>

          {/* Neck */}
          <mesh position={[0, 0.8, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.18, 0.1, 16]} />
            <meshStandardMaterial color="#d9c9b9" />
          </mesh>

          {/* Hair - more stylized and with better volume */}
          <group position={[0, 1.12, 0]}>
            {/* Base hair layer */}
            <mesh position={[0, 0.05, 0]}>
              <sphereGeometry args={[0.36, 24, 24]} />
              <meshStandardMaterial 
                color={health > 0 ? hairColor : "#ff0000"}
                roughness={0.8}
                metalness={0.1}
                opacity={health > 0 ? 1 : 0.7}
                transparent={health <= 0}
              />
            </mesh>

            {/* Front bangs - more shaped */}
            <mesh position={[0, 0.05, 0.2]}>
              <boxGeometry args={[0.7, 0.2, 0.3]} />
              <meshStandardMaterial 
                color={health > 0 ? hairColor : "#ff0000"}
                roughness={0.8}
                opacity={health > 0 ? 1 : 0.7}
                transparent={health <= 0}
              />
            </mesh>

            {/* Side hair pieces - angled for more naturalism */}
            <mesh position={[0.28, -0.15, 0]} rotation={[0, 0, -0.3]}>
              <boxGeometry args={[0.15, 0.45, 0.35]} />
              <meshStandardMaterial 
                color={health > 0 ? hairColor : "#ff0000"}
                roughness={0.8}
                opacity={health > 0 ? 1 : 0.7}
                transparent={health <= 0}
              />
            </mesh>
            <mesh position={[-0.28, -0.15, 0]} rotation={[0, 0, 0.3]}>
              <boxGeometry args={[0.15, 0.45, 0.35]} />
              <meshStandardMaterial 
                color={health > 0 ? hairColor : "#ff0000"}
                roughness={0.8}
                opacity={health > 0 ? 1 : 0.7}
                transparent={health <= 0}
              />
            </mesh>

            {/* Hair details/styling - adds volume */}
            {[...Array(4)].map((_, i) => (
              <mesh key={i} position={[
                Math.sin(i/4 * Math.PI * 2) * 0.25,
                0.1 + Math.random() * 0.1,
                Math.cos(i/4 * Math.PI * 2) * 0.25
              ]}>
                <boxGeometry args={[0.2, 0.1, 0.15]} />
                <meshStandardMaterial 
                  color={health > 0 ? hairColor : "#ff0000"}
                  roughness={0.8}
                  opacity={health > 0 ? 1 : 0.7}
                  transparent={health <= 0}
                />
              </mesh>
            ))}
          </group>

          {/* Eyes */}
          <mesh ref={leftEyeRef} position={[0.15, 1.05, 0.25]} castShadow>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshBasicMaterial color="#111" />
          </mesh>
          <mesh ref={rightEyeRef} position={[-0.15, 1.05, 0.25]} castShadow>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshBasicMaterial color="#111" />
          </mesh>

          {/* Eyebrows - more expressive */}
          <mesh position={[0.15, 1.15, 0.27]} rotation={[0, 0, 0.1]}>
            <boxGeometry args={[0.08, 0.02, 0.01]} />
            <meshBasicMaterial color="#222" />
          </mesh>
          <mesh position={[-0.15, 1.15, 0.27]} rotation={[0, 0, -0.1]}>
            <boxGeometry args={[0.08, 0.02, 0.01]} />
            <meshBasicMaterial color="#222" />
          </mesh>

          {/* Mouth */}
          <mesh ref={mouthRef} position={[0, 0.85, 0.25]} castShadow>
            <boxGeometry args={[0.15, 0.04, 0.01]} />
            <meshBasicMaterial color="#a53030" />
          </mesh>

          {/* Torso */}
          <mesh position={[0, 0.3, 0]} castShadow>
            <boxGeometry args={[0.5, 0.8, 0.25]} />
            <meshStandardMaterial 
              color={health > 0 ? clothesColor : "#ff0000"} 
              roughness={0.8}
              opacity={health > 0 ? 1 : 0.7}
              transparent={health <= 0}
            />
          </mesh>

          {/* Arms */}
          <group ref={leftArmRef} position={[0.35, 0.5, 0]}>
            <mesh position={[0.125, -0.25, 0]} castShadow>
              <boxGeometry args={[0.15, 0.6, 0.15]} />
              <meshStandardMaterial color={health > 0 ? clothesColor : "#ff0000"} 
                roughness={0.7}
                opacity={health > 0 ? 1 : 0.7}
                transparent={health <= 0}
              />
            </mesh>
            <mesh position={[0.125, -0.6, 0]} castShadow>
              <boxGeometry args={[0.14, 0.1, 0.14]} />
              <meshStandardMaterial color="#e6ccb3" />
            </mesh>
          </group>

          <group ref={rightArmRef} position={[-0.35, 0.5, 0]}>
            <mesh position={[-0.125, -0.25, 0]} castShadow>
              <boxGeometry args={[0.15, 0.6, 0.15]} />
              <meshStandardMaterial color={health > 0 ? clothesColor : "#ff0000"} 
                roughness={0.7}
                opacity={health > 0 ? 1 : 0.7}
                transparent={health <= 0}
              />
            </mesh>
            <mesh position={[-0.125, -0.6, 0]} castShadow>
              <boxGeometry args={[0.14, 0.1, 0.14]} />
              <meshStandardMaterial color="#e6ccb3" />
            </mesh>
            
            {/* The laser gun has been removed */}
          </group>

          {/* Legs */}
          <group ref={leftLegRef} position={[0.15, -0.3, 0]}>
            <mesh position={[0, -0.4, 0]} castShadow>
              <boxGeometry args={[0.18, 0.8, 0.18]} />
              <meshStandardMaterial color={health > 0 ? pantsColor : "#ff0000"} 
                roughness={0.7}
                opacity={health > 0 ? 1 : 0.7}
                transparent={health <= 0}
              />
            </mesh>
            <mesh position={[0, -0.85, 0.05]} castShadow>
              <boxGeometry args={[0.2, 0.1, 0.28]} />
              <meshStandardMaterial color="#333" />
            </mesh>
          </group>

          <group ref={rightLegRef} position={[-0.15, -0.3, 0]}>
            <mesh position={[0, -0.4, 0]} castShadow>
              <boxGeometry args={[0.18, 0.8, 0.18]} />
              <meshStandardMaterial color={health > 0 ? pantsColor : "#ff0000"} 
                roughness={0.7}
                opacity={health > 0 ? 1 : 0.7}
                transparent={health <= 0}
              />
            </mesh>
            <mesh position={[0, -0.85, 0.05]} castShadow>
              <boxGeometry args={[0.2, 0.1, 0.28]} />
              <meshStandardMaterial color="#333" />
            </mesh>
          </group>

          {/* Add accessories - stylish items that match the player colors */}
          {/* Belt */}
          <mesh position={[0, -0.1, 0]} castShadow>
            <boxGeometry args={[0.52, 0.05, 0.27]} />
            <meshStandardMaterial color={accentColor} metalness={0.5} roughness={0.5} />
          </mesh>

          {/* Scarf/collar */}
          <mesh position={[0, 0.7, 0]} castShadow>
            <torusGeometry args={[0.15, 0.05, 16, 32, Math.PI]} />
            <meshStandardMaterial color={accentColor} roughness={0.5} />
          </mesh>

          {/* Name Tag as a floating sprite above character */}
          {nameTagCanvas && (
            <sprite 
              ref={nameTagRef}
              position={[0, 2.5, 0]} 
              scale={[2, 0.6, 1]}
            >
              <spriteMaterial 
                map={new THREE.CanvasTexture(nameTagCanvas)} 
                transparent={true}
                sizeAttenuation={true}
              />
            </sprite>
          )}

          {/* Damage/death effect */}
          {damageFlash && (
            <pointLight 
              color="#ff0000" 
              intensity={2} 
              distance={3} 
              decay={2}
            />
          )}

          {/* Ghost effect for dead players */}
          {health <= 0 && (
            <>
              {/* Pulsing ghost light */}
              <pointLight 
                color="#00aaff" 
                intensity={2 + Math.sin(animationTime * 4) * 1} 
                distance={5}
                decay={2}
              />
              
              {/* Ghost effect particles */}
              <group>
                {[...Array(5)].map((_, i) => (
                  <mesh 
                    key={i}
                    position={[
                      Math.sin(animationTime * (2 + i * 0.2)) * 0.3,
                      1 + Math.cos(animationTime * (1.5 + i * 0.2)) * 0.2,
                      Math.sin(animationTime * (1 + i * 0.2) + 2) * 0.3
                    ]}
                  >
                    <sphereGeometry args={[0.1, 8, 8]} />
                    <meshStandardMaterial 
                      color="#00ccff"
                      emissive="#0088ff"
                      emissiveIntensity={1.5}
                      transparent={true}
                      opacity={0.7 + Math.sin(animationTime * 3 + i) * 0.3}
                    />
                  </mesh>
                ))}
              </group>
              
              {/* Death message above player */}
              <sprite position={[0, 3, 0]} scale={[3, 0.8, 1]}>
                <spriteMaterial 
                  transparent={true}
                  map={(() => {
                    const canvas = document.createElement('canvas');
                    canvas.width = 256;
                    canvas.height = 64;
                    const ctx = canvas.getContext('2d')!;
                    ctx.fillStyle = 'rgba(0,0,0,0.7)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.font = 'bold 32px Arial';
                    ctx.fillStyle = '#ff3333';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('RESPAWNING...', canvas.width/2, canvas.height/2);
                    return new THREE.CanvasTexture(canvas);
                  })()}
                />
              </sprite>
              
              <pointLight 
                color="#0066ff" 
                intensity={0.5} 
                distance={2} 
                decay={2}
              />
            </>
          )}
        </group>
      )}
    </group>
  );
};

// Helper function to create name tag with health bar
function createNameTag(name: string, health: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const width = 256;
  const height = 64;
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  
  // Clear background with transparent
  ctx.clearRect(0, 0, width, height);
  
  // Draw background for name tag
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  roundRect(ctx, 5, 5, width - 10, height - 10, 10, true, false);
  
  // Draw text
  ctx.font = '24px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(name, width / 2, 8);
  
  // Draw health bar background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  roundRect(ctx, 20, 40, width - 40, 15, 5, true, false);
  
  // Draw health bar fill
  const healthWidth = Math.max(0, (width - 40) * (health / 100));
  const healthColor = health > 60 ? '#00ff00' : health > 30 ? '#ffff00' : '#ff0000';
  ctx.fillStyle = healthColor;
  roundRect(ctx, 20, 40, healthWidth, 15, 5, true, false);
  
  return canvas;
}

// Helper function for drawing rounded rectangles on canvas
function roundRect(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  width: number, 
  height: number, 
  radius: number, 
  fill: boolean, 
  stroke: boolean
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) {
    ctx.fill();
  }
  if (stroke) {
    ctx.stroke();
  }
}

export default Player;