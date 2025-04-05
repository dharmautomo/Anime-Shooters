import { useEffect } from 'react';
import { useKeyboardControls } from '@react-three/drei';
import { Controls } from '../App';
import { useGameControls } from '../lib/stores/useGameControls';

interface WeaponDisplayProps {
  isVisible: boolean;
}

// Use a DOM-based weapon display instead of a Three.js object
const WeaponDisplay = ({ isVisible }: WeaponDisplayProps) => {
  const { isControlsLocked } = useGameControls();
  
  // Get movement keys for weapon sway animation
  const forward = useKeyboardControls((state) => state[Controls.forward]);
  const backward = useKeyboardControls((state) => state[Controls.backward]);
  const left = useKeyboardControls((state) => state[Controls.left]);
  const right = useKeyboardControls((state) => state[Controls.right]);
  
  // Track movement for animation
  const isMoving = forward || backward || left || right;
  
  // Create the DOM-based weapon display
  useEffect(() => {
    console.log('Creating DOM-based weapon display');
    
    // Add the crosshair to the DOM
    const crosshair = document.createElement('div');
    crosshair.id = 'crosshair';
    crosshair.style.position = 'fixed';
    crosshair.style.top = '50%';
    crosshair.style.left = '50%';
    crosshair.style.transform = 'translate(-50%, -50%)';
    crosshair.style.width = '10px';
    crosshair.style.height = '10px';
    crosshair.style.borderRadius = '50%';
    crosshair.style.border = '2px solid white';
    crosshair.style.pointerEvents = 'none';
    crosshair.style.zIndex = '1000';
    
    // Create the weapon container
    const weaponContainer = document.createElement('div');
    weaponContainer.id = 'weapon-display';
    weaponContainer.style.position = 'fixed';
    weaponContainer.style.bottom = '20px';
    weaponContainer.style.right = '20px';
    weaponContainer.style.width = '200px';
    weaponContainer.style.height = '150px';
    weaponContainer.style.pointerEvents = 'none';
    weaponContainer.style.zIndex = '999';
    weaponContainer.style.transform = 'translate(0, 0)';
    weaponContainer.style.transition = 'transform 0.1s ease-out';
    
    // Create the actual weapon image
    const pistol = document.createElement('div');
    pistol.id = 'pistol';
    pistol.style.position = 'absolute';
    pistol.style.bottom = '0';
    pistol.style.right = '0';
    pistol.style.width = '100%';
    pistol.style.height = '100%';
    pistol.style.backgroundImage = 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMTUwIj4NCiAgPCEtLSBQaXN0b2wgQm9keSAtLT4NCiAgPHJlY3QgeD0iOTAiIHk9IjcwIiB3aWR0aD0iODAiIGhlaWdodD0iMzAiIGZpbGw9IiMzMzMiIHN0cm9rZT0iIzIyMiIgc3Ryb2tlLXdpZHRoPSIyIi8+DQogIDwhLS0gQmFycmVsIC0tPg0KICA8cmVjdCB4PSIxNjAiIHk9Ijc1IiB3aWR0aD0iMzAiIGhlaWdodD0iMjAiIGZpbGw9IiM0NDQiIHN0cm9rZT0iIzIyMiIgc3Ryb2tlLXdpZHRoPSIyIi8+DQogIDwhLS0gUGlzdG9sIEdyaXAgLS0+DQogIDxyZWN0IHg9IjkwIiB5PSIxMDAiIHdpZHRoPSIyNSIgaGVpZ2h0PSI0MCIgZmlsbD0iIzU1NSIgc3Ryb2tlPSIjMjIyIiBzdHJva2Utd2lkdGg9IjIiLz4NCiAgPCEtLSBUcmlnZ2VyIC0tPg0KICA8cmVjdCB4PSIxMTUiIHk9IjEwMCIgd2lkdGg9IjE1IiBoZWlnaHQ9IjE1IiBmaWxsPSIjMzMzIiBzdHJva2U9IiMyMjIiIHN0cm9rZS13aWR0aD0iMiIvPg0KICA8IS0tIE11enpsZSAtLT4NCiAgPHJlY3QgeD0iMTg1IiB5PSI3NSIgd2lkdGg9IjEwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjIyIiBzdHJva2U9IiMxMTEiIHN0cm9rZS13aWR0aD0iMiIvPg0KICA8IS0tIFNpZ2h0IC0tPg0KICA8cmVjdCB4PSIxNjUiIHk9IjY1IiB3aWR0aD0iMTAiIGhlaWdodD0iNSIgZmlsbD0iIzY2NiIgc3Ryb2tlPSIjMjIyIiBzdHJva2Utd2lkdGg9IjEiLz4NCiAgPGNpcmNsZSBjeD0iMTcwIiBjeT0iNjMiIHI9IjIiIGZpbGw9IiNmMDAiIC8+DQogIDwhLS0gU2xpZGUgLS0+DQogIDxyZWN0IHg9IjEyMCIgeT0iNjUiIHdpZHRoPSI0MCIgaGVpZ2h0PSI1IiBmaWxsPSIjNTU1IiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMSIvPg0KPC9zdmc+DQo=)';
    pistol.style.backgroundSize = 'contain';
    pistol.style.backgroundRepeat = 'no-repeat';
    pistol.style.backgroundPosition = 'bottom right';
    
    // Add the pistol to the weapon container
    weaponContainer.appendChild(pistol);
    
    // Add elements to the DOM
    document.body.appendChild(crosshair);
    document.body.appendChild(weaponContainer);
    
    // Animation function
    let lastTime = 0;
    let animationFrameId: number;
    
    const animate = (time: number) => {
      const deltaTime = (time - lastTime) / 1000;
      lastTime = time;
      
      const container = document.getElementById('weapon-display');
      
      if (container) {
        // Only show weapon when controls are locked and player is alive
        if (isControlsLocked && isVisible) {
          container.style.display = 'block';
          
          // Bob and sway effect
          let offsetX = 0;
          let offsetY = 0;
          
          if (isMoving) {
            // Bobbing effect when moving
            const bobY = Math.sin(time / 200) * 5;
            const bobX = Math.cos(time / 200) * 2;
            offsetY += bobY;
            offsetX += bobX;
          } else {
            // Subtle breathing effect when idle
            const breathe = Math.sin(time / 700) * 2;
            offsetY += breathe;
          }
          
          // Add directional sway based on movement
          if (forward) offsetY -= 3;
          if (backward) offsetY += 3;
          if (left) offsetX -= 3;
          if (right) offsetX += 3;
          
          container.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        } else {
          container.style.display = 'none';
        }
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    // Start the animation
    animationFrameId = requestAnimationFrame(animate);
    
    // Log the visibility state
    console.log(`Creating weapon with visibility: ${isVisible}, Controls locked: ${isControlsLocked}`);
    
    // Cleanup on unmount
    return () => {
      const crosshairElement = document.getElementById('crosshair');
      const weaponElement = document.getElementById('weapon-display');
      
      if (crosshairElement) document.body.removeChild(crosshairElement);
      if (weaponElement) document.body.removeChild(weaponElement);
      
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  // Update visibility when it changes
  useEffect(() => {
    const weaponContainer = document.getElementById('weapon-display');
    if (weaponContainer) {
      if (isControlsLocked && isVisible) {
        weaponContainer.style.display = 'block';
      } else {
        weaponContainer.style.display = 'none';
      }
    }
    
    console.log(`Weapon visibility changed: ${isVisible}, Controls locked: ${isControlsLocked}`);
  }, [isVisible, isControlsLocked]);
  
  // This component doesn't render anything in the Three.js scene
  return null;
};

export default WeaponDisplay;