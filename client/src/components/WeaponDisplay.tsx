import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useKeyboardControls, Html } from '@react-three/drei';
import { Controls } from '../App';
import { useGameControls } from '../lib/stores/useGameControls';

interface WeaponDisplayProps {
  isVisible: boolean;
}

// This component uses a completely different approach with HTML overlay
// It renders a DOM element fixed to the bottom right of the screen
// This guarantees the weapon will always be visible in the bottom right
const WeaponDisplay = ({ isVisible }: WeaponDisplayProps) => {
  const { camera } = useThree();
  const { isControlsLocked } = useGameControls();
  
  // Get movement keys for weapon sway animation
  const forward = useKeyboardControls((state) => state[Controls.forward]);
  const backward = useKeyboardControls((state) => state[Controls.backward]);
  const left = useKeyboardControls((state) => state[Controls.left]);
  const right = useKeyboardControls((state) => state[Controls.right]);
  
  // Track movement for sway effect
  const isMoving = forward || backward || left || right;
  
  // Track animation values
  const [bobOffset, setBobOffset] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const time = useRef(0);
  
  // Animation parameters
  const bobSpeed = 4; 
  const bobAmount = 10; // In pixels for DOM
  const swayAmount = 5; // In degrees for DOM
  
  // Handle visibility
  const [visible, setVisible] = useState(isVisible);
  
  // Update visibility based on props
  useEffect(() => {
    setVisible(isVisible && isControlsLocked);
  }, [isVisible, isControlsLocked]);
  
  // Set up initial weapon display
  useEffect(() => {
    console.log('Weapon display initialized');
  }, []);
  
  // Handle weapon animation
  useFrame((_, delta) => {
    if (!isControlsLocked || !isVisible) return;
    
    time.current += delta;
    
    // Calculate bobbing effect
    let newBobX = 0;
    let newBobY = 0;
    
    if (isMoving) {
      newBobY = Math.sin(time.current * bobSpeed) * bobAmount;
      newBobX = Math.cos(time.current * bobSpeed) * bobAmount * 0.5;
    } else {
      // Subtle breathing movement when idle
      newBobY = Math.sin(time.current * 1.5) * 2;
    }
    
    // Calculate rotation effects
    let rotZ = 0;
    if (left) rotZ = swayAmount;
    if (right) rotZ = -swayAmount;
    
    let rotX = 0;
    if (forward) rotX = -swayAmount * 0.5;
    if (backward) rotX = swayAmount * 0.5;
    
    // Update state for HTML rendering
    setBobOffset({ x: newBobX, y: newBobY });
    setRotation({ x: rotX, y: -5, z: rotZ }); // -5 is the base angle for weapon
  });
  
  if (!visible) return null;
  
  return (
    <Html
      className="weapon-container"
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        width: '300px',
        height: '200px',
        pointerEvents: 'none',
        transform: `translate3d(${bobOffset.x}px, ${bobOffset.y}px, 0px)`,
        zIndex: 1000
      }}
      prepend
      center={false}
      fullscreen={false}
    >
      <div style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        transformStyle: 'preserve-3d',
        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`
      }}>
        {/* Render a weapon image with CSS */}
        <div style={{
          position: 'absolute',
          bottom: '0',
          right: '0',
          width: '150px',
          height: '100px',
          backgroundImage: 'linear-gradient(to bottom, #333, #222)',
          borderRadius: '2px',
          boxShadow: '0 0 5px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          overflow: 'hidden'
        }}>
          {/* Pistol body */}
          <div style={{
            width: '80px',
            height: '25px',
            backgroundColor: '#222',
            position: 'absolute',
            bottom: '40px',
            right: '40px',
            borderRadius: '2px',
            boxShadow: '0 0 3px rgba(0,0,0,0.7)'
          }}></div>
          
          {/* Pistol barrel */}
          <div style={{
            width: '60px',
            height: '15px',
            backgroundColor: '#111',
            position: 'absolute',
            bottom: '45px',
            right: '20px',
            borderRadius: '2px'
          }}></div>
          
          {/* Pistol grip */}
          <div style={{
            width: '25px',
            height: '40px',
            backgroundColor: '#333',
            position: 'absolute',
            bottom: '10px',
            right: '70px',
            borderRadius: '2px',
            transform: 'rotate(10deg)'
          }}></div>
          
          {/* Pistol sight */}
          <div style={{
            width: '5px',
            height: '5px',
            backgroundColor: '#f00',
            position: 'absolute',
            bottom: '55px',
            right: '45px',
            borderRadius: '50%',
            boxShadow: '0 0 5px #f00'
          }}></div>
        </div>
      </div>
    </Html>
  );
};

export default WeaponDisplay;