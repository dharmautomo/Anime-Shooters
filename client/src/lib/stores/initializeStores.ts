import { create } from 'zustand';
import * as THREE from 'three';
import { io, Socket } from 'socket.io-client';

// Forward declarations for store types to avoid circular references
interface PlayerStore {
  playerId: string;
  playerName: string;
  position: THREE.Vector3;
  rotation: number;
  health: number;
  ammo: number;
  score: number;
  isAlive: boolean;
  
  setPlayerId: (id: string) => void;
  setPlayerName: (name: string) => void;
  updatePosition: (position: THREE.Vector3) => void;
  updateRotation: (rotation: number) => void;
  takeDamage: (amount: number) => void;
  addScore: (points: number) => void;
  shootBullet: () => boolean;
  reloadAmmo: () => void;
  respawn: () => void;
  resetPlayer: () => void;
}

interface BulletData {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  owner: string;
}

interface PlayerData {
  id: string;
  username: string;
  position: THREE.Vector3;
  rotation: number;
  health: number;
}

interface KillFeedItem {
  killer: string;
  victim: string;
}

interface MultiplayerStore {
  socket: Socket | null;
  connected: boolean;
  otherPlayers: Record<string, PlayerData>;
  bullets: BulletData[];
  killFeed: KillFeedItem[];
  
  initializeSocket: (username: string) => void;
  updatePlayerPosition: (position: THREE.Vector3, rotation: number) => void;
  addBullet: (position: THREE.Vector3, direction: THREE.Vector3, owner: string) => string;
  removeBullet: (id: string) => void;
  checkBulletCollision: (bulletPosition: THREE.Vector3, bulletOwner: string) => boolean;
  disconnect: () => void;
}

export type PlayerStoreType = PlayerStore;
export type MultiplayerStoreType = MultiplayerStore;

// Store instances (will be initialized later)
let playerStore: ReturnType<typeof createPlayerStore> | null = null;
let multiplayerStore: ReturnType<typeof createMultiplayerStore> | null = null;

// Player store factory
export const createPlayerStore = (getMultiplayerStore: () => MultiplayerStoreType) => create<PlayerStore>((set, get) => ({
  playerId: '',
  playerName: '',
  position: new THREE.Vector3(0, 1.6, 10),
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
      
      // Create the bullet via multiplayer store - using the getter to avoid circular imports
      const { addBullet } = getMultiplayerStore();
      
      // Ensure we have the player ID before creating a bullet
      if (!playerId) {
        console.error("🔫❌ STORE: Failed to shoot - player ID not set!");
        return false;
      }
      
      try {
        const bulletId = addBullet(bulletPosition, direction, playerId);
        console.log('🔫✅ STORE: Created bullet with ID:', bulletId);
        
        // IMPORTANT: Decrement ammo HERE after successful bullet creation
        set({ ammo: ammo - 1 });
        console.log('🔫 STORE: Ammo decremented to:', get().ammo);
        
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
      position: new THREE.Vector3(0, 1.6, 10),
      rotation: 0,
      health: 100,
      ammo: 10,
      score: 0,
      isAlive: true
    });
  }
}));

// Multiplayer store factory
export const createMultiplayerStore = (getPlayerStore: () => PlayerStoreType) => create<MultiplayerStore>((set, get) => ({
  socket: null,
  connected: false,
  otherPlayers: {},
  bullets: [],
  killFeed: [],
  
  initializeSocket: (username) => {
    // Create socket connection
    const socket = io('/', {
      transports: ['websocket'],
      autoConnect: true,
    });
    
    // Store socket instance
    set({ socket });
    
    // Setup socket event handlers
    socket.on('connect', () => {
      console.log('Connected to server');
      set({ connected: true });
      
      // Set player ID to socket ID
      const playerId = socket.id || '';
      getPlayerStore().setPlayerId(playerId);
      
      // Join game with username
      const userName = username || 'Player';
      
      // Save the username to player state
      getPlayerStore().setPlayerName(userName);
      
      socket.emit('joinGame', {
        id: playerId,
        username: userName,
        position: getPlayerStore().position,
        rotation: getPlayerStore().rotation,
        health: getPlayerStore().health,
      });
    });
    
    // Socket event handlers (using getPlayerStore() for safe access)
    socket.on('playerJoined', (playerData) => {
      console.log(`Player joined: ${playerData.username}`);
      
      // Add to other players list
      set((state) => ({
        otherPlayers: {
          ...state.otherPlayers,
          [playerData.id]: {
            id: playerData.id,
            username: playerData.username,
            position: new THREE.Vector3(
              playerData.position.x,
              playerData.position.y,
              playerData.position.z
            ),
            rotation: playerData.rotation,
            health: playerData.health,
          },
        },
      }));
    });
    
    // Other socket handlers would be implemented here...
    
    // Handle player hit
    socket.on('playerHit', (data: { playerId: string, damage: number }) => {
      console.log(`Hit event received for player ${data.playerId}, damage: ${data.damage}`);
      
      // If we were hit
      if (data.playerId === socket.id) {
        console.log(`Taking damage locally: ${data.damage}`);
        getPlayerStore().takeDamage(data.damage);
      } else {
        // Update other player's health locally for immediate visual feedback
        set(state => {
          const otherPlayer = state.otherPlayers[data.playerId];
          if (otherPlayer) {
            return {
              otherPlayers: {
                ...state.otherPlayers,
                [data.playerId]: {
                  ...otherPlayer,
                  health: Math.max(0, otherPlayer.health - data.damage)
                }
              }
            };
          }
          return state;
        });
      }
    });
  },
  
  updatePlayerPosition: (position, rotation) => {
    const { socket } = get();
    const { playerName, health } = getPlayerStore();
    
    if (socket && socket.connected) {
      socket.emit('updatePlayer', {
        position: { x: position.x, y: position.y, z: position.z },
        rotation,
        health,
        username: playerName,
      });
    }
  },
  
  addBullet: (position, direction, owner) => {
    const { socket } = get();
    const bulletId = `bullet-${Math.random().toString(36).substring(2, 9)}`;
    
    console.log(`Creating bullet ${bulletId} at position:`, position);
    
    // Normalize direction vector
    const normalizedDirection = direction.clone().normalize();
    
    // Add bullet locally
    set((state) => ({
      bullets: [
        ...state.bullets,
        {
          id: bulletId,
          position: position.clone(),
          velocity: normalizedDirection.clone(),
          owner,
        },
      ],
    }));
    
    // Send to server
    if (socket && socket.connected) {
      socket.emit('createBullet', {
        id: bulletId,
        position: { x: position.x, y: position.y, z: position.z },
        velocity: { 
          x: normalizedDirection.x, 
          y: normalizedDirection.y, 
          z: normalizedDirection.z 
        },
        owner,
      });
    }
    
    return bulletId;
  },
  
  removeBullet: (id) => {
    const { socket } = get();
    
    // Remove locally
    set((state) => ({
      bullets: state.bullets.filter((bullet) => bullet.id !== id),
    }));
    
    // Send to server
    if (socket && socket.connected) {
      socket.emit('removeBullet', id);
    }
  },
  
  checkBulletCollision: (bulletPosition, bulletOwner) => {
    const { socket, otherPlayers } = get();
    const { playerId, takeDamage } = getPlayerStore();
    
    // Check collision with other players
    for (const [id, player] of Object.entries(otherPlayers)) {
      if (player.health <= 0) continue; // Skip dead players
      
      // Use a larger collision radius for better hit detection
      const distance = bulletPosition.distanceTo(player.position);
      
      // Use 1.5 units for a more generous hit box
      if (distance < 1.5) {
        // Hit another player
        console.log(`COLLISION DETECTED with player ${id}! Emitting hitPlayer event`);
        if (socket && socket.connected) {
          socket.emit('hitPlayer', {
            playerId: id,
            damage: 25,
            shooterId: bulletOwner,
          });
        }
        return true;
      }
    }
    
    // Check collision with main player (if bullet isn't from main player)
    if (bulletOwner !== playerId) {
      const playerPosition = getPlayerStore().position;
      const distance = bulletPosition.distanceTo(playerPosition);
      
      if (distance < 1.5 && getPlayerStore().health > 0) {
        // Apply damage locally
        console.log("COLLISION with main player! Taking damage: 25");
        takeDamage(25);
        
        // Notify server
        if (socket && socket.connected) {
          socket.emit('hitPlayer', {
            playerId,
            damage: 25,
            shooterId: bulletOwner,
          });
        }
        return true;
      }
    }
    
    return false;
  },
  
  disconnect: () => {
    const { socket } = get();
    
    if (socket) {
      socket.disconnect();
      set({ socket: null, connected: false });
    }
  },
}));

// Initialization function
export const initializeStores = () => {
  // Create getters that will be used to resolve circular dependencies
  const getPlayerStoreImpl = () => {
    if (!playerStore) {
      throw new Error("Player store accessed before initialization");
    }
    return playerStore;
  };
  
  const getMultiplayerStoreImpl = () => {
    if (!multiplayerStore) {
      throw new Error("Multiplayer store accessed before initialization");
    }
    return multiplayerStore;
  };
  
  // Initialize the stores with access to each other
  playerStore = createPlayerStore(getMultiplayerStoreImpl);
  multiplayerStore = createMultiplayerStore(getPlayerStoreImpl);
  
  console.log("✅ Game stores initialized successfully");
  
  // Return the stores
  return {
    usePlayer: playerStore,
    useMultiplayer: multiplayerStore
  };
};

// Create and export the stores
const { usePlayer, useMultiplayer } = initializeStores();
export { usePlayer, useMultiplayer };