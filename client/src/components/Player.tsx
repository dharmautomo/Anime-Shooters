import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useKeyboardControls, useAnimations } from '@react-three/drei';
import { Controls } from '../App';
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
  const weaponRef = useRef<THREE.Group>(null);
  const muzzleFlashRef = useRef<THREE.PointLight>(null);
  const muzzleFlashSpriteRef = useRef<THREE.Mesh>(null);
  const nameTagRef = useRef<THREE.Sprite>(null);

  const { updatePosition, takeDamage, respawn } = usePlayer();
  const { updatePlayerPosition } = useMultiplayer();
  const { scene } = useThree();

  // Animation states
  const [blinking, setBlinking] = useState(false);
  const [isSmiling, setIsSmiling] = useState(false);
  const [walkCycle, setWalkCycle] = useState(false);
  const [isShooting, setIsShooting] = useState(false);
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
  const forward = useKeyboardControls<typeof Controls>(state => state.forward);
  const backward = useKeyboardControls<typeof Controls>(state => state.backward);
  const left = useKeyboardControls<typeof Controls>(state => state.left);
  const right = useKeyboardControls<typeof Controls>(state => state.right);
  const jump = useKeyboardControls<typeof Controls>(state => state.jump);
  const shoot = useKeyboardControls<typeof Controls>(state => state.shoot);

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
    setWalkCycle(forward || backward || left || right);
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

  // Handle shooting action
  useEffect(() => {
    if (isMainPlayer && shoot) {
      handleShoot();
    }
  }, [shoot, isMainPlayer]);

  // Function to handle shooting behavior
  const handleShoot = () => {
    if (isShooting) return; // Prevent rapid fire by checking current state

    setIsShooting(true);

    // Play shooting animation/effect
    if (muzzleFlashRef.current && muzzleFlashSpriteRef.current) {
      muzzleFlashRef.current.visible = true;
      muzzleFlashSpriteRef.current.visible = true;

      // Hide muzzle flash after short duration
      setTimeout(() => {
        if (muzzleFlashRef.current && muzzleFlashSpriteRef.current) {
          muzzleFlashRef.current.visible = false;
          muzzleFlashSpriteRef.current.visible = false;
        }
        setIsShooting(false);
      }, 100);
    } else {
      setTimeout(() => setIsShooting(false), 150);
    }

    // Weapon recoil animation is handled in the useFrame hook
  };

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
      const yPos = (position instanceof THREE.Vector3 ? position.y : position[1]);

      // Apply position with bob offset for walking animation
      playerRef.current.position.set(
        position instanceof THREE.Vector3 ? position.x : position[0],
        (yPos - 1.5) + bobOffset, // Apply bob offset for smoother walking
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

      // Animate weapon for shooting effect
      if (weaponRef.current && isShooting) {
        weaponRef.current.rotation.x = Math.sin(animationTime * 30) * 0.2;
        setTimeout(() => {
          if (weaponRef.current) weaponRef.current.rotation.x = 0;
        }, 100);
      }
    }
  });

  return (
    <group ref={playerRef}>
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

          {/* Face - better eye and mouth placement */}
          <group position={[0, 1, 0.25]}>
            {/* Eyes with better depth and shape */}
            <mesh ref={leftEyeRef} position={[0.12, 0.05, 0.1]}>
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshStandardMaterial color="#000000" />
            </mesh>
            <mesh ref={rightEyeRef} position={[-0.12, 0.05, 0.1]}>
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshStandardMaterial color="#000000" />
            </mesh>

            {/* Eye whites - gives eyes more dimension */}
            <mesh position={[0.12, 0.07, 0.11]} scale={[0.3, 0.3, 0.3]}>
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[-0.12, 0.07, 0.11]} scale={[0.3, 0.3, 0.3]}>
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>

            {/* Eyebrows - better positioned and shaped */}
            <mesh position={[0.12, 0.15, 0.11]} rotation={[0, 0, isSmiling ? 0 : -0.2]} scale={[1, 0.3, 0.3]}>
              <boxGeometry args={[0.1, 0.02, 0.01]} />
              <meshStandardMaterial color="#222222" />
            </mesh>
            <mesh position={[-0.12, 0.15, 0.11]} rotation={[0, 0, isSmiling ? 0 : 0.2]} scale={[1, 0.3, 0.3]}>
              <boxGeometry args={[0.1, 0.02, 0.01]} />
              <meshStandardMaterial color="#222222" />
            </mesh>

            {/* Mouth - better positioned and better animation */}
            <mesh ref={mouthRef} position={[0, -0.15, 0.05]}>
              <boxGeometry args={[0.1, 0.03, 0.01]} />
              <meshStandardMaterial color="#cc6666" />
            </mesh>
          </group>

          {/* Upper body - scaled better and with more details */}
          <group position={[0, 0.35, 0]}>
            {/* Torso - slightly tapered for better proportions */}
            <mesh position={[0, 0, 0]} castShadow>
              <boxGeometry args={[0.5, 0.6, 0.25]} />
              <meshStandardMaterial 
                color={health > 0 ? clothesColor : "#ff0000"} 
                roughness={0.7}
                metalness={0.1}
                opacity={health > 0 ? 1 : 0.5}
                transparent={health <= 0}
              />
            </mesh>

            {/* Shirt collar */}
            <mesh position={[0, 0.28, 0.13]} castShadow>
              <boxGeometry args={[0.3, 0.05, 0.02]} />
              <meshStandardMaterial color={accentColor} roughness={0.6} />
            </mesh>

            {/* Shirt details - pockets, trim, etc. */}
            <mesh position={[0.15, 0.1, 0.13]} castShadow>
              <boxGeometry args={[0.12, 0.12, 0.01]} />
              <meshStandardMaterial color={accentColor} roughness={0.6} />
            </mesh>
            <mesh position={[-0.15, 0.1, 0.13]} castShadow>
              <boxGeometry args={[0.12, 0.12, 0.01]} />
              <meshStandardMaterial color={accentColor} roughness={0.6} />
            </mesh>
          </group>

          {/* Lower body */}
          <group position={[0, -0.2, 0]}>
            {/* Waist/hips - slightly wider than upper body for better shape */}
            <mesh position={[0, 0, 0]} castShadow>
              <boxGeometry args={[0.52, 0.2, 0.25]} />
              <meshStandardMaterial 
                color={health > 0 ? clothesColor : "#ff0000"} 
                roughness={0.7}
                opacity={health > 0 ? 1 : 0.5}
                transparent={health <= 0}
              />
            </mesh>

            {/* Belt */}
            <mesh position={[0, -0.1, 0.13]} castShadow>
              <boxGeometry args={[0.53, 0.05, 0.02]} />
              <meshStandardMaterial color="#553311" roughness={0.6} metalness={0.4} />
            </mesh>

            {/* Belt buckle */}
            <mesh position={[0, -0.1, 0.15]} castShadow>
              <boxGeometry args={[0.1, 0.05, 0.01]} />
              <meshStandardMaterial color="#ddbb66" roughness={0.3} metalness={0.8} />
            </mesh>
          </group>

          {/* Arms - improved proportions and joint positions */}
          <group ref={leftArmRef} position={[0.35, 0.35, 0]} rotation-z={-0.1}>
            {/* Upper arm with shoulder joint */}
            <mesh position={[0, -0.15, 0]} castShadow>
              <boxGeometry args={[0.15, 0.4, 0.15]} />
              <meshStandardMaterial color="#e6ccb3" roughness={0.7} />
            </mesh>

            {/* Lower arm with elbow joint */}
            <group position={[0, -0.35, 0]}>
              <mesh position={[0, -0.2, 0]} castShadow>
                <boxGeometry args={[0.13, 0.4, 0.13]} />
                <meshStandardMaterial color="#e6ccb3" roughness={0.7} />
              </mesh>

              {/* Hand */}
              <mesh position={[0, -0.45, 0]} castShadow>
                <boxGeometry args={[0.14, 0.1, 0.14]} />
                <meshStandardMaterial color="#d9c9b9" roughness={0.6} />
              </mesh>

              {/* Sleeve detail */}
              <mesh position={[0, 0, 0]} castShadow>
                <cylinderGeometry args={[0.14, 0.14, 0.05, 16]} />
                <meshStandardMaterial color={clothesColor} roughness={0.7} />
              </mesh>
            </group>
          </group>

          <group ref={rightArmRef} position={[-0.35, 0.35, 0]} rotation-z={0.1}>
            {/* Upper arm with shoulder joint */}
            <mesh position={[0, -0.15, 0]} castShadow>
              <boxGeometry args={[0.15, 0.4, 0.15]} />
              <meshStandardMaterial color="#e6ccb3" roughness={0.7} />
            </mesh>

            {/* Lower arm with elbow joint */}
            <group position={[0, -0.35, 0]}>
              <mesh position={[0, -0.2, 0]} castShadow>
                <boxGeometry args={[0.13, 0.4, 0.13]} />
                <meshStandardMaterial color="#e6ccb3" roughness={0.7} />
              </mesh>

              {/* Hand */}
              <mesh position={[0, -0.45, 0]} castShadow>
                <boxGeometry args={[0.14, 0.1, 0.14]} />
                <meshStandardMaterial color="#d9c9b9" roughness={0.6} />
              </mesh>

              {/* Sleeve detail */}
              <mesh position={[0, 0, 0]} castShadow>
                <cylinderGeometry args={[0.14, 0.14, 0.05, 16]} />
                <meshStandardMaterial color={clothesColor} roughness={0.7} />
              </mesh>
            </group>
          </group>

          {/* Legs - improved proportions and joint positions */}
          <group ref={leftLegRef} position={[0.15, -0.4, 0]}>
            {/* Upper leg with hip joint */}
            <mesh position={[0, -0.25, 0]} castShadow>
              <boxGeometry args={[0.16, 0.5, 0.16]} />
              <meshStandardMaterial color={pantsColor} roughness={0.8} />
            </mesh>

            {/* Lower leg with knee joint */}
            <group position={[0, -0.5, 0]}>
              <mesh position={[0, -0.25, 0]} castShadow>
                <boxGeometry args={[0.15, 0.5, 0.15]} />
                <meshStandardMaterial color={pantsColor} roughness={0.8} />
              </mesh>

              {/* Foot */}
              <mesh position={[0, -0.53, 0.05]} castShadow>
                <boxGeometry args={[0.16, 0.08, 0.26]} />
                <meshStandardMaterial color="#222222" roughness={0.5} metalness={0.2} />
              </mesh>
            </group>
          </group>

          <group ref={rightLegRef} position={[-0.15, -0.4, 0]}>
            {/* Upper leg with hip joint */}
            <mesh position={[0, -0.25, 0]} castShadow>
              <boxGeometry args={[0.16, 0.5, 0.16]} />
              <meshStandardMaterial color={pantsColor} roughness={0.8} />
            </mesh>

            {/* Lower leg with knee joint */}
            <group position={[0, -0.5, 0]}>
              <mesh position={[0, -0.25, 0]} castShadow>
                <boxGeometry args={[0.15, 0.5, 0.15]} />
                <meshStandardMaterial color={pantsColor} roughness={0.8} />
              </mesh>

              {/* Foot */}
              <mesh position={[0, -0.53, 0.05]} castShadow>
                <boxGeometry args={[0.16, 0.08, 0.26]} />
                <meshStandardMaterial color="#222222" roughness={0.5} metalness={0.2} />
              </mesh>
            </group>
          </group>

          {/* Weapon - enhanced pistol with better details */}
          <group ref={weaponRef} position={[0.5, 0, 0.3]} rotation={[0, -Math.PI / 2, 0]}>
            {/* Gun slide - metallic finish */}
            <mesh position={[0, 0.04, 0]} castShadow>
              <boxGeometry args={[0.28, 0.08, 0.12]} />
              <meshStandardMaterial color="#444444" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Gun body - main frame */}
            <mesh position={[0, 0, 0]} castShadow>
              <boxGeometry args={[0.35, 0.12, 0.12]} />
              <meshStandardMaterial color="#333333" metalness={0.6} roughness={0.3} />
            </mesh>

            {/* Gun barrel - cylindrical for realism */}
            <mesh position={[0.22, 0.02, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.04, 0.04, 0.15, 8]} />
              <meshStandardMaterial color="#222222" metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Gun handle - angled for ergonomics */}
            <mesh position={[0, -0.15, 0]} rotation={[0, 0, -Math.PI / 12]} castShadow>
              <boxGeometry args={[0.1, 0.25, 0.1]} />
              <meshStandardMaterial color="#111111" roughness={0.8} />
            </mesh>

            {/* Gun details - sights */}
            <mesh position={[0.15, 0.09, 0]} castShadow>
              <boxGeometry args={[0.03, 0.03, 0.14]} />
              <meshStandardMaterial color="#222222" />
            </mesh>
            <mesh position={[-0.1, 0.09, 0]} castShadow>
              <boxGeometry args={[0.02, 0.02, 0.14]} />
              <meshStandardMaterial color="#222222" />
            </mesh>

            {/* Trigger and guard */}
            <mesh position={[0, -0.05, 0]} castShadow>
              <boxGeometry args={[0.03, 0.05, 0.05]} />
              <meshStandardMaterial color="#111111" />
            </mesh>
            <mesh position={[0.02, -0.03, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <torusGeometry args={[0.04, 0.008, 8, 12, Math.PI]} />
              <meshStandardMaterial color="#222222" />
            </mesh>

            {/* Muzzle flash effects */}
            <pointLight 
              ref={muzzleFlashRef} 
              position={[0.3, 0.02, 0]} 
              intensity={5} 
              distance={2} 
              color="#ffaa55" 
              visible={false}
            />
            <mesh 
              ref={muzzleFlashSpriteRef} 
              position={[0.3, 0.02, 0]}
              visible={false}
            >
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshBasicMaterial color="#ffaa55" transparent opacity={0.8} />
            </mesh>
          </group>

          {/* Equipment/accessories - adds character detail */}
          {/* Small backpack */}
          <mesh position={[0, 0.35, -0.2]} castShadow>
            <boxGeometry args={[0.4, 0.4, 0.15]} />
            <meshStandardMaterial color="#444444" roughness={0.9} />
          </mesh>

          {/* Shoulder strap */}
          <mesh position={[0.2, 0.35, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
            <boxGeometry args={[0.08, 0.45, 0.05]} />
            <meshStandardMaterial color="#555555" roughness={0.9} />
          </mesh>
          <mesh position={[-0.2, 0.35, 0]} rotation={[0, 0, -Math.PI / 4]} castShadow>
            <boxGeometry args={[0.08, 0.45, 0.05]} />
            <meshStandardMaterial color="#555555" roughness={0.9} />
          </mesh>

          {/* Damage flash effect */}
          {damageFlash && (
            <mesh position={[0, 0, 0]} scale={[2, 3, 2]}>
              <sphereGeometry args={[1, 16, 16]} />
              <meshBasicMaterial color="#ff0000" transparent opacity={0.3} />
            </mesh>
          )}

          {/* Footstep effect when walking */}
          {walkCycle && animationTime % 0.5 < 0.05 && (
            <mesh position={[0, -1.5, 0]} rotation={[-Math.PI/2, 0, 0]}>
              <ringGeometry args={[0.1, 0.2, 16]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
            </mesh>
          )}
        </group>
      )}

      {/* Player name tag with health bar (only for other players) */}
      {!isMainPlayer && nameTagCanvas && (
        <sprite
          ref={nameTagRef}
          position={[0, 2.5, 0]}
          scale={[3, 1, 1]}
        >
          <spriteMaterial attach="material">
            <canvasTexture attach="map" image={nameTagCanvas} />
          </spriteMaterial>
        </sprite>
      )}
    </group>
  );
};

// Helper function to create player name tag with health bar
function createNameTag(name: string, health: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 80; // Taller to accommodate health bar
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
    roundRect(context, 0, 0, canvas.width, canvas.height, 10, true, false);

    // Add border with player-specific color
    context.strokeStyle = borderColor;
    context.lineWidth = 3;
    roundRect(context, 0, 0, canvas.width, canvas.height, 10, false, true);

    // Draw name text
    context.font = 'bold 24px Arial, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // Text shadow for better visibility
    context.shadowColor = 'rgba(0, 0, 0, 0.5)';
    context.shadowBlur = 4;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;

    // Draw text
    context.fillStyle = '#ffffff';
    context.fillText(name, canvas.width / 2, canvas.height / 3);

    // Reset shadow for health bar
    context.shadowColor = 'transparent';
    context.shadowBlur = 0;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;

    // Draw health bar background
    context.fillStyle = '#444444';
    roundRect(context, 30, canvas.height - 30, canvas.width - 60, 15, 5, true, false);

    // Draw health bar fill with color based on health level
    const healthColor = health > 70 ? '#66cc66' : health > 30 ? '#cccc66' : '#cc6666';
    context.fillStyle = healthColor;
    roundRect(context, 30, canvas.height - 30, 
      Math.max(0, (canvas.width - 60) * (health / 100)), 15, 5, true, false);
  }

  return canvas;
}

// Helper function for drawing rounded rectangles
function roundRect(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  width: number, 
  height: number, 
  radius: number, 
  fill: boolean, 
  stroke: boolean
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
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

export default Player;