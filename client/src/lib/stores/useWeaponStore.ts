import { create } from 'zustand';
import * as THREE from 'three';
import { usePlayer, useMultiplayer } from './initializeStores';

interface WeaponState {
  isReloading: boolean;
  ammo: number;
  maxAmmo: number;
  lastShotTime: number;
  cooldownPeriod: number; // in milliseconds
  screenShake: {
    active: boolean;
    intensity: number;
    duration: number;
    startTime: number;
  };
}

interface WeaponActions {
  shoot: () => boolean;
  reload: () => void;
  resetWeapon: () => void;
  updateScreenShake: (delta: number, camera: THREE.Camera) => void;
}

type WeaponStore = WeaponState & WeaponActions;

export const useWeaponStore = create<WeaponStore>((set, get) => ({
  // Default state
  isReloading: false,
  ammo: 10,
  maxAmmo: 10,
  lastShotTime: 0,
  cooldownPeriod: 250, // 250ms between shots (4 shots per second)
  screenShake: {
    active: false,
    intensity: 0.05,
    duration: 200, // milliseconds
    startTime: 0,
  },
  
  // Actions
  shoot: () => {
    // Get current state
    const { ammo, isReloading, lastShotTime, cooldownPeriod, screenShake } = get();
    const now = Date.now();
    
    // Check if we can shoot
    if (isReloading || ammo <= 0 || now - lastShotTime < cooldownPeriod) {
      return false;
    }
    
    // Get player state to determine shot origin
    const player = usePlayer.getState();
    const multiplayer = useMultiplayer.getState();
    
    // We need a valid player who is alive
    if (!player.isAlive || !player.playerId) {
      console.log('Cannot shoot - player not alive or not initialized');
      return false;
    }
    
    // Update weapon state
    set({
      ammo: ammo - 1,
      lastShotTime: now,
      screenShake: {
        ...screenShake,
        active: true,
        startTime: now,
      }
    });
    
    console.log(`Shot fired! Ammo remaining: ${ammo - 1}`);
    
    // Here we would send the shot event to the server
    // This will be expanded when we add networking for bullets
    
    return true;
  },
  
  reload: () => {
    const { isReloading, maxAmmo } = get();
    
    if (isReloading) return;
    
    console.log('Reloading weapon...');
    set({ isReloading: true });
    
    // Simulate reload time (1 second)
    setTimeout(() => {
      set({ 
        isReloading: false,
        ammo: maxAmmo,
      });
      console.log('Reload complete!');
    }, 1000);
  },
  
  resetWeapon: () => {
    set({
      isReloading: false,
      ammo: 10,
      lastShotTime: 0,
      screenShake: {
        active: false,
        intensity: 0.05,
        duration: 200,
        startTime: 0,
      }
    });
  },
  
  updateScreenShake: (delta: number, camera: THREE.Camera) => {
    const { screenShake } = get();
    const now = Date.now();
    
    // If screen shake is active, apply it
    if (screenShake.active) {
      // Calculate how far through the shake we are (0 to 1)
      const elapsed = now - screenShake.startTime;
      const progress = Math.min(1, elapsed / screenShake.duration);
      
      // If the shake is complete, deactivate it
      if (progress >= 1) {
        set({
          screenShake: {
            ...screenShake,
            active: false
          }
        });
        
        // Reset camera position if needed
        return;
      }
      
      // Apply screen shake - decreasing intensity as it progresses
      const intensity = screenShake.intensity * (1 - progress);
      
      // Apply random rotation offsets to simulate shake
      camera.rotation.x += (Math.random() - 0.5) * intensity;
      camera.rotation.y += (Math.random() - 0.5) * intensity;
      camera.rotation.z += (Math.random() - 0.5) * intensity * 0.5; // Less z-rotation (roll)
    }
  }
}));

// Make store accessible in window for debugging
if (typeof window !== 'undefined') {
  (window as any).useWeaponStore = useWeaponStore;
}