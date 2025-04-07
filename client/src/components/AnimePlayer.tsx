import { useRef, useState, useEffect, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useKeyboardControls } from '@react-three/drei';
import { Controls, ControlsType } from '../App';
import { usePlayer, useMultiplayer } from '../lib/stores/initializeStores';
import { checkCollision } from '../lib/utils/collisionDetection';

interface AnimePlayerProps {
  isMainPlayer: boolean;
  position: THREE.Vector3 | [number, number, number];
  rotation: number;
  health: number;
  username?: string;
}

// Main component that loads and renders the 3D model
function AnimePlayerModel({ isMainPlayer, position, rotation, health, username }: AnimePlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const nameTagRef = useRef<THREE.Sprite | null>(null);
  const [animationTime, setAnimationTime] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [nameTagCanvas, setNameTagCanvas] = useState<HTMLCanvasElement | null>(null);
  const [nameTag, setNameTag] = useState<THREE.Sprite | null>(null);
  const [walkCycle, setWalkCycle] = useState(false);
  const [damageFlash, setDamageFlash] = useState(false);
  
  const modelPath = '/models/anime-boy/scene.gltf';
  
  // Load the GLTF model with error handling
  const { scene, nodes, materials } = useGLTF(modelPath);
  
  const { updatePosition, takeDamage, respawn } = usePlayer();
  const { updatePlayerPosition, socket } = useMultiplayer();
  const { scene: threeScene } = useThree();
  
  // Movement states
  const isJumping = useRef(false);
  const jumpVelocity = useRef(0);
  const currentHeight = useRef(1.0); // Player eye height, adjusted for model scale
  
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

  // Set up the model when it's loaded
  useEffect(() => {
    if (loadError) {
      console.log("Error loading anime player model");
      return;
    }
    
    if (groupRef.current && scene) {
      try {
        // Clear any existing children
        while (groupRef.current.children.length > 0) {
          groupRef.current.remove(groupRef.current.children[0]);
        }
        
        // Create a clone of the scene to avoid conflicts with multiple instances
        const clonedScene = scene.clone();
        
        // Adjust model scale and position
        const modelScaleFactor = 0.005; // Much smaller scale factor for proper proportions with environment
        clonedScene.scale.set(modelScaleFactor, modelScaleFactor, modelScaleFactor);
        
        // Adjust the position of the model to ensure it's on the ground
        clonedScene.position.set(0, -1.0, 0); // Larger negative value to place feet firmly on the ground
        
        // Add the cloned scene
        groupRef.current.add(clonedScene);
        
        // Apply initial rotation
        groupRef.current.rotation.y = rotation;
        
        console.log("Anime player model loaded successfully!");
      } catch (error) {
        console.error("Error setting up model:", error);
        setLoadError(true);
      }
    }
  }, [scene, rotation, loadError]);

  // Add name tag
  useEffect(() => {
    if (!isMainPlayer && nameTagCanvas && groupRef.current) {
      // Create sprite material with the canvas texture
      const texture = new THREE.CanvasTexture(nameTagCanvas);
      const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true,
        depthTest: false
      });
      
      // Create or update the name tag sprite
      if (!nameTagRef.current) {
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(0.6, 0.15, 1);
        sprite.position.set(0, 1.0, 0);
        // Create a new sprite and add it to the group
        groupRef.current.add(sprite);
        
        // Store in local state
        setNameTag(sprite);
      } else {
        (nameTagRef.current.material as THREE.SpriteMaterial).map = texture;
        nameTagRef.current.material.needsUpdate = true;
      }
    }
  }, [nameTagCanvas, isMainPlayer]);
  
  // Update ref when nameTag changes
  useEffect(() => {
    if (nameTag) {
      nameTagRef.current = nameTag;
    }
  }, [nameTag]);

  // Function to handle taking damage with visual feedback
  const handleDamage = (amount: number) => {
    takeDamage(amount);

    // Visual damage feedback
    setDamageFlash(true);
    setTimeout(() => setDamageFlash(false), 200);
  };

  // Animation loop
  useFrame((state, delta) => {
    // Update animation timer
    setAnimationTime(prev => prev + delta);

    // Calculate bob offset for walking animation
    const bobOffset = walkCycle 
      ? Math.sin(animationTime * 10) * 0.05 // Walking bob
      : Math.sin(animationTime * 2) * 0.01;  // Idle breathing
    
    // Handle player movement and animations
    if (isMainPlayer && groupRef.current) {
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
        if (currentHeight.current <= 1.0) {
          currentHeight.current = 1.0;
          isJumping.current = false;
          jumpVelocity.current = 0;
        }

        // Update Y position
        newPosition.y = currentHeight.current;
      }

      // Collision detection
      const obstacles = threeScene.children.filter(
        child => child.userData.isObstacle && child !== groupRef.current
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
      groupRef.current.position.copy(state.camera.position);
      
      // Make model not visible in first person
      groupRef.current.visible = false;

      // Adjust player rotation to match camera's horizontal rotation
      groupRef.current.rotation.y = rotation;
    } else if (!isMainPlayer && groupRef.current) {
      // For other players, update the mesh position and rotation based on props
      const yPos = (position instanceof THREE.Vector3 ? position.y : position[1]);

      // Apply position with bob offset for walking animation
      groupRef.current.position.set(
        position instanceof THREE.Vector3 ? position.x : position[0],
        yPos + bobOffset, // Apply bob offset for smoother walking without sinking
        position instanceof THREE.Vector3 ? position.z : position[2]
      );
      groupRef.current.rotation.y = rotation;
      
      // Make model visible for other players
      groupRef.current.visible = true;
      
      // Update name tag position
      if (nameTagRef.current) {
        nameTagRef.current.position.set(0, 1.0, 0);
      }
      
      // Apply damage flash effect if active
      if (damageFlash && groupRef.current.children.length > 0) {
        // Find the model scene within our group
        const model = groupRef.current.children.find(child => child.type === 'Group' || child.type === 'Scene');
        if (model) {
          // Apply flashing effect to all materials in the model
          model.traverse((object) => {
            if ((object as THREE.Mesh).isMesh) {
              const mesh = object as THREE.Mesh;
              try {
                if (Array.isArray(mesh.material)) {
                  mesh.material.forEach(mat => {
                    if (mat.type.includes('Material') && 'color' in mat) {
                      // Safe cast to any material with color property
                      (mat as any).color.set('#ff0000');
                    }
                  });
                } else if (mesh.material.type.includes('Material') && 'color' in mesh.material) {
                  // Safe cast to any material with color property
                  (mesh.material as any).color.set('#ff0000');
                }
              } catch (error) {
                console.error("Error applying damage flash effect:", error);
              }
            }
          });
        }
      }
    }
  });
  
  return (
    <group
      ref={groupRef}
      position={position instanceof THREE.Vector3 ? [position.x, position.y, position.z] : position}
      castShadow
      receiveShadow
    />
  );
}

// Function to create a name tag with health bar
function createNameTag(name: string, health: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  
  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  roundRect(ctx, 0, 0, canvas.width, canvas.height, 8, true);
  
  // Name text
  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(name, canvas.width/2, 5);
  
  // Health bar background
  ctx.fillStyle = '#333333';
  roundRect(ctx, 20, 30, canvas.width - 40, 20, 5, true);
  
  // Health bar
  const healthWidth = (canvas.width - 40) * (health / 100);
  ctx.fillStyle = health > 60 ? '#00cc00' : health > 30 ? '#cccc00' : '#cc0000';
  roundRect(ctx, 20, 30, healthWidth, 20, 5, true);
  
  // Health text
  ctx.font = '12px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(`${health}%`, canvas.width/2, 34);
  
  return canvas;
}

// Helper function to draw rounded rectangles
function roundRect(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  width: number, 
  height: number, 
  radius: number, 
  fill: boolean
) {
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
  } else {
    ctx.stroke();
  }
}

// Add license attribution
function ModelAttribution() {
  return (
    <sprite position={[0, 1.2, 0]} scale={[1.5, 0.3, 1]}>
      <spriteMaterial 
        transparent={true}
        depthTest={false}
        map={(() => {
          const canvas = document.createElement('canvas');
          canvas.width = 512;
          canvas.height = 64;
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.font = 'bold 16px Arial';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText("Anime Boy by kazukiarts", canvas.width/2, canvas.height/2 - 10);
          ctx.font = '12px Arial';
          ctx.fillText("CC-BY-4.0 License", canvas.width/2, canvas.height/2 + 10);
          return new THREE.CanvasTexture(canvas);
        })()}
      />
    </sprite>
  );
}

// Error fallback component
function ErrorFallback({ isMainPlayer, position, rotation, health, username }: AnimePlayerProps) {
  // Use the existing Player style rendered using simple geometric shapes
  return (
    <group 
      position={position instanceof THREE.Vector3 ? [position.x, position.y, position.z] : position}
      rotation={[0, rotation, 0]}
    >
      <mesh position={[0, 1, 0]} castShadow>
        <sphereGeometry args={[0.35, 24, 24]} />
        <meshStandardMaterial color="#e6ccb3" roughness={0.7} metalness={0.1} />
      </mesh>
      
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.18, 0.1, 16]} />
        <meshStandardMaterial color="#d9c9b9" />
      </mesh>
      
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.5, 0.6, 0.3]} />
        <meshStandardMaterial color="#3f51b5" />
      </mesh>
      
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.35, 0.8, 0.3]} />
        <meshStandardMaterial color="#2196f3" />
      </mesh>
    </group>
  );
}

// Main exported component with error handling
export function AnimePlayer(props: AnimePlayerProps) {
  return (
    <group>
      {/* Only show attribution for non-main players */}
      {!props.isMainPlayer && <ModelAttribution />}
      
      <Suspense fallback={<ErrorFallback {...props} />}>
        <AnimePlayerModel {...props} />
      </Suspense>
    </group>
  );
}

// Preload the model
useGLTF.preload('/models/anime-boy/scene.gltf');

export default AnimePlayer;