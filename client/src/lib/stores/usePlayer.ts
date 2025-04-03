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
    const { ammo, isAlive, position, playerId } = get();
    
    console.log("shootBullet called - Current ammo:", ammo, "isAlive:", isAlive);
    
    // Only shoot if player has ammo and is alive
    if (ammo > 0 && isAlive) {
      // Reduce ammo - MOST IMPORTANT PART!
      set({ ammo: ammo - 1 });
      console.log(`⚡ Bullet fired. Ammo reduced from ${ammo} to ${ammo - 1}`);
      
      // Get camera direction for bullet direction
      const canvas = document.querySelector('canvas');
      // Access the React Three Fiber data with proper type casting
      const camera = canvas && (canvas as any)?.__r3f?.root?.camera;
      
      if (camera) {
        // Create bullet direction from camera
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(camera.quaternion);
        direction.normalize();
        
        // Calculate bullet spawn position (slightly in front of camera)
        const bulletPosition = position.clone().add(direction.clone().multiplyScalar(0.5));
        bulletPosition.y += 1.5; // Eye height
        
        // Import useMultiplayer directly (it's safe - circular dependencies are handled by JS module system)
        const { useMultiplayer } = require('./useMultiplayer');
        const { addBullet } = useMultiplayer.getState();
        
        // Actually create the bullet
        const bulletId = addBullet(bulletPosition, direction, playerId);
        console.log('Created bullet with ID:', bulletId, 'at position:', bulletPosition);
        
        // Double check the ammo was actually decremented
        console.log('After bullet creation - Current ammo:', get().ammo);
        
        console.log('Shot bullet with direction:', direction);
        return true;
      } else {
        console.error("Failed to shoot - camera not found!");
      }
    } else {
      console.log("Cannot shoot - either no ammo or player is dead. Ammo:", ammo, "isAlive:", isAlive);
    }
    
    return false;
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
