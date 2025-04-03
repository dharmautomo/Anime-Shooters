import { create } from 'zustand';
import * as THREE from 'three';

interface PlayerState {
  playerId: string;
  playerName: string;
  position: THREE.Vector3;
  rotation: number;
  health: number;
  ammo: number;
  score: number;
  isAlive: boolean;
  
  // Actions
  setPlayerId: (id: string) => void;
  setPlayerName: (name: string) => void;
  updatePosition: (position: THREE.Vector3) => void;
  updateRotation: (rotation: number) => void;
  takeDamage: (amount: number) => void;
  addScore: (points: number) => void;
  shootBullet: () => void;
  reloadAmmo: () => void;
  respawn: () => void;
  resetPlayer: () => void;
}

export const usePlayer = create<PlayerState>((set, get) => ({
  playerId: '',
  playerName: '',
  position: new THREE.Vector3(0, 1.6, 10), // Start on the dirt path facing the farmhouse and barn
  rotation: 0,
  health: 100,
  ammo: 10,
  score: 0,
  isAlive: true,
  
  setPlayerId: (id) => set({ playerId: id }),
  
  setPlayerName: (name) => set({ playerName: name }),
  
  updatePosition: (position) => {
    set({ position: position.clone() });
  },
  
  updateRotation: (rotation) => {
    set({ rotation });
  },
  
  takeDamage: (amount) => {
    set((state) => {
      const newHealth = Math.max(0, state.health - amount);
      const isAlive = newHealth > 0;
      
      return { 
        health: newHealth, 
        isAlive 
      };
    });
    
    // If player died, schedule respawn
    if (get().health <= 0) {
      setTimeout(() => {
        get().respawn();
      }, 3000);
    }
  },
  
  addScore: (points) => {
    set((state) => ({ score: state.score + points }));
  },
  
  shootBullet: () => {
    // NOTE: This function now ONLY creates bullets but does NOT decrement ammo
    // Ammo decrementing is done EXCLUSIVELY in the Weapon.tsx component
    
    // Get the current state
    const { ammo, isAlive, position, playerId } = get();
    
    console.log("🔫 STORE: shootBullet called at", new Date().toISOString());
    console.log("🔫 STORE: Current ammo:", ammo, "isAlive:", isAlive);
    
    // VALIDATION: Check if we're allowed to shoot
    if (ammo <= 0) {
      console.log("🔫❌ STORE: Cannot shoot - no ammo available");
      return false;
    }
    
    if (!isAlive) {
      console.log("🔫❌ STORE: Cannot shoot - player is not alive");
      return false;
    }
    
    try {
      // BULLET CREATION - This is the sole responsibility of this function now
      // Get camera for bullet direction
      const canvas = document.querySelector('canvas');
      const camera = canvas && (canvas as any)?.__r3f?.root?.camera;
      
      if (!camera) {
        console.error("🔫❌ STORE: Failed to shoot - camera not found!");
        return false;
      }
      
      // Calculate bullet direction from camera
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(camera.quaternion);
      direction.normalize();
      
      // Set bullet spawn position (slightly in front of camera)
      const bulletPosition = position.clone().add(direction.clone().multiplyScalar(0.5));
      bulletPosition.y += 1.5; // Eye height
      
      // Create the bullet via multiplayer store
      const { useMultiplayer } = require('./useMultiplayer');
      const { addBullet } = useMultiplayer.getState();
      
      // Ensure we have the player ID before creating a bullet
      if (!playerId) {
        console.error("🔫❌ STORE: Failed to shoot - player ID not set!");
        return false;
      }
      
      try {
        const bulletId = addBullet(bulletPosition, direction, playerId);
        console.log('🔫✅ STORE: Created bullet with ID:', bulletId);
        console.log('🔫 STORE: Current ammo after bullet creation:', get().ammo);
        return true;
      } catch (bulletError) {
        console.error("🔫❌ STORE: Error creating bullet:", bulletError);
        return false;
      }
    } catch (error) {
      console.error("🔫❌ STORE: Error in shootBullet:", error);
      return false;
    }
  },
  
  reloadAmmo: () => {
    set({ ammo: 10 });
  },
  
  respawn: () => {
    // Generate random position for respawn
    const randomX = (Math.random() - 0.5) * 40;
    const randomZ = (Math.random() - 0.5) * 40;
    
    set({
      position: new THREE.Vector3(randomX, 1.6, randomZ),
      health: 100,
      ammo: 10,
      isAlive: true
    });
  },
  
  resetPlayer: () => {
    set({
      position: new THREE.Vector3(0, 1.6, 10), // Start on the dirt path facing the farmhouse
      rotation: 0,
      health: 100,
      ammo: 10,
      score: 0,
      isAlive: true
    });
  }
}));
