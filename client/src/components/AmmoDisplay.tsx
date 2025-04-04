import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRef } from 'react';
import { useWeaponStore } from '../lib/stores/useWeaponStore';

const AmmoDisplay = () => {
  // Use refs to avoid unnecessary re-renders
  const textureRef = useRef<THREE.CanvasTexture>();
  const canvasRef = useRef<HTMLCanvasElement>();
  const lastAmmoRef = useRef<number>(0);
  const lastReloadingRef = useRef<boolean>(false);
  
  // Create initial texture
  if (!textureRef.current) {
    // Create canvas for the UI
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    canvasRef.current = canvas;
    
    // Create texture from canvas
    textureRef.current = new THREE.CanvasTexture(canvas);
    
    // Initial draw
    updateDisplay();
  }
  
  // Update the display texture based on current state
  function updateDisplay() {
    if (!canvasRef.current || !textureRef.current) return;
    
    const { ammo, maxAmmo, isReloading } = useWeaponStore.getState();
    
    // Only update if values have changed
    if (ammo === lastAmmoRef.current && isReloading === lastReloadingRef.current) {
      return;
    }
    
    // Store current values for future comparison
    lastAmmoRef.current = ammo;
    lastReloadingRef.current = isReloading;
    
    // Get canvas context and draw UI
    const ctx = canvasRef.current.getContext('2d')!;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // Draw background
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // Draw border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, canvasRef.current.width - 4, canvasRef.current.height - 4);
    
    // Draw text
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      isReloading ? 'RELOADING...' : `AMMO: ${ammo}/${maxAmmo}`, 
      canvasRef.current.width/2, 
      canvasRef.current.height/2
    );
    
    // Update texture
    textureRef.current.needsUpdate = true;
  }
  
  // Update the display every frame
  useFrame(() => {
    updateDisplay();
  });
  
  return (
    <sprite position={[0.6, -0.5, -0.6]} scale={[0.15, 0.05, 1]}>
      <spriteMaterial 
        transparent={true}
        depthTest={false}
        map={textureRef.current}
      />
    </sprite>
  );
};

export default AmmoDisplay;