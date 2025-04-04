import { create } from 'zustand';
import * as THREE from 'three';
import { io, Socket } from 'socket.io-client';

// Define the structure of our store states and actions
interface PlayerState {
  playerId: string;
  playerName: string;
  position: THREE.Vector3;
  rotation: number;
  health: number;
  score: number;
  isAlive: boolean;
}

interface PlayerActions {
  setPlayerId: (id: string) => void;
  setPlayerName: (name: string) => void;
  updatePosition: (position: THREE.Vector3) => void;
  updateRotation: (rotation: number) => void;
  takeDamage: (amount: number) => void;
  addScore: (points: number) => void;
  respawn: () => void;
  resetPlayer: () => void;
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

interface BulletData {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  owner: string;
  createdAt: number;
}

interface MultiplayerState {
  socket: Socket | null;
  connected: boolean;
  otherPlayers: Record<string, PlayerData>;
  killFeed: KillFeedItem[];
  bullets: BulletData[]; // Add bullets to multiplayer state
}

interface MultiplayerActions {
  initializeSocket: (username: string) => void;
  updatePlayerPosition: (position: THREE.Vector3, rotation: number) => void;
  disconnect: () => void;
  // Add bullet-related actions
  fireBullet: (bulletData: BulletData) => void;
  addRemoteBullet: (bulletData: BulletData) => void;
  removeBullet: (bulletId: string) => void;
}

// Combined interfaces
type PlayerStore = PlayerState & PlayerActions;
type MultiplayerStore = MultiplayerState & MultiplayerActions;

// Circular references for types
interface StoreReferences {
  playerStore: PlayerStore;
  multiplayerStore: MultiplayerStore;
}

// Create stores with a context of the combined stores
let storeContext: Partial<StoreReferences> = {};

// Create actual stores
export const usePlayer = create<PlayerStore>((set, get) => ({
  // State
  playerId: '',
  playerName: '',
  position: new THREE.Vector3(0, 1.6, 10),
  rotation: 0,
  health: 100,
  score: 0,
  isAlive: true,
  
  // Actions
  setPlayerId: (id: string) => set({ playerId: id }),
  setPlayerName: (name: string) => set({ playerName: name }),
  
  updatePosition: (position: THREE.Vector3) => {
    set({ position: position.clone() });
  },
  
  updateRotation: (rotation: number) => {
    set({ rotation });
  },
  
  takeDamage: (amount: number) => {
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
  
  addScore: (points: number) => {
    set((state) => ({ score: state.score + points }));
  },
  
  respawn: () => {
    const randomX = (Math.random() - 0.5) * 40;
    const randomZ = (Math.random() - 0.5) * 40;
    
    set({
      position: new THREE.Vector3(randomX, 1.6, randomZ),
      health: 100,
      isAlive: true
    });
  },
  
  resetPlayer: () => {
    set({
      position: new THREE.Vector3(0, 1.6, 10),
      rotation: 0,
      health: 100,
      score: 0,
      isAlive: true
    });
  }
}));

export const useMultiplayer = create<MultiplayerStore>((set, get) => ({
  // State
  socket: null,
  connected: false,
  otherPlayers: {},
  killFeed: [],
  bullets: [], // Initialize empty bullets array
  
  // Actions
  initializeSocket: (username: string) => {
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
      
      // Access player store through context
      const playerStore = storeContext.playerStore;
      if (!playerStore) {
        console.error("Socket connect error: Player store not initialized");
        return;
      }
      
      // Update player store
      playerStore.setPlayerId(playerId);
      playerStore.setPlayerName(username || 'Player');
      
      // Join game with username
      socket.emit('joinGame', {
        id: playerId,
        username: username || 'Player',
        position: playerStore.position,
        rotation: playerStore.rotation,
        health: playerStore.health,
      });
    });
    
    // Socket event handlers for player joining
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
    
    // Handle existing players data when joining
    socket.on('existingPlayers', (players) => {
      console.log('Received existing players data:', Object.keys(players).length, 'players');
      
      // Add all existing players to our local state
      const updatedPlayers: Record<string, PlayerData> = {};
      
      // Process each player
      Object.values(players).forEach((player: any) => {
        // Skip our own player
        if (player.id === socket.id) return;
        
        console.log(`Adding existing player: ${player.username} (${player.id})`);
        
        // Convert position to THREE.Vector3
        updatedPlayers[player.id] = {
          id: player.id,
          username: player.username,
          position: new THREE.Vector3(
            player.position.x,
            player.position.y,
            player.position.z
          ),
          rotation: player.rotation,
          health: player.health,
        };
      });
      
      // Update state with all existing players
      set((state) => ({
        otherPlayers: {
          ...state.otherPlayers,
          ...updatedPlayers,
        },
      }));
    });
    
    // Handle player position/rotation updates
    socket.on('playerUpdated', (playerData) => {
      console.log(`Player updated: ${playerData.id}`);
      
      // Make sure it's not our own player
      if (playerData.id === socket.id) return;
      
      // Update the player in our state
      set((state) => {
        // If player is already in our state, update their data
        if (state.otherPlayers[playerData.id]) {
          return {
            otherPlayers: {
              ...state.otherPlayers,
              [playerData.id]: {
                ...state.otherPlayers[playerData.id],
                position: new THREE.Vector3(
                  playerData.position.x,
                  playerData.position.y,
                  playerData.position.z
                ),
                rotation: playerData.rotation,
                health: playerData.health,
              },
            },
          };
        } 
        // If player is not in our state, add them
        else {
          return {
            otherPlayers: {
              ...state.otherPlayers,
              [playerData.id]: {
                id: playerData.id,
                username: playerData.username || 'Unknown Player',
                position: new THREE.Vector3(
                  playerData.position.x,
                  playerData.position.y,
                  playerData.position.z
                ),
                rotation: playerData.rotation,
                health: playerData.health,
              },
            },
          };
        }
      });
    });
    
    // Handle player leaving
    socket.on('playerLeft', (playerId: string) => {
      console.log(`Player left: ${playerId}`);
      
      // Remove player from our state
      set((state) => ({
        otherPlayers: Object.fromEntries(
          Object.entries(state.otherPlayers).filter(([id]) => id !== playerId)
        ),
      }));
    });
    
    // Handle player hit
    socket.on('playerHit', (data: { playerId: string, damage: number }) => {
      console.log(`Hit event received for player ${data.playerId}, damage: ${data.damage}`);
      
      // Get player store from context
      const playerStore = storeContext.playerStore;
      if (!playerStore) {
        console.error("playerHit handler error: Player store not initialized");
        return;
      }
      
      // If we were hit
      if (data.playerId === socket.id) {
        console.log(`Taking damage locally: ${data.damage}`);
        playerStore.takeDamage(data.damage);
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
    
    // Handle remote bullet creation
    socket.on('bulletCreated', (bulletData: {
      id: string,
      position: { x: number, y: number, z: number },
      velocity: { x: number, y: number, z: number },
      owner: string,
      createdAt: number
    }) => {
      console.log(`Remote bullet received: ${bulletData.id} from ${bulletData.owner}`);
      
      // Convert plain objects to THREE.Vector3
      const bullet: BulletData = {
        id: bulletData.id,
        position: new THREE.Vector3(
          bulletData.position.x,
          bulletData.position.y,
          bulletData.position.z
        ),
        velocity: new THREE.Vector3(
          bulletData.velocity.x,
          bulletData.velocity.y,
          bulletData.velocity.z
        ),
        owner: bulletData.owner,
        createdAt: bulletData.createdAt
      };
      
      // Add this remote bullet to our local state
      get().addRemoteBullet(bullet);
    });
    
    // Handle kill feed updates
    socket.on('playerKilled', (data: { killer: string, victim: string }) => {
      console.log(`Player killed: ${data.victim} by ${data.killer}`);
      
      // Get player store
      const playerStore = storeContext.playerStore;
      if (!playerStore) {
        console.error("playerKilled handler error: Player store not initialized");
        return;
      }
      
      // If this player was the killer, add score
      if (data.killer === socket.id) {
        playerStore.addScore(10);
      }
      
      // Add to kill feed
      set((state) => ({
        killFeed: [
          ...state.killFeed.slice(-4), // Keep only the last 4 items
          {
            killer: data.killer,
            victim: data.victim,
          },
        ],
      }));
    });
  },
  
  updatePlayerPosition: (position: THREE.Vector3, rotation: number) => {
    const { socket } = get();
    
    // Get player data from context
    const playerStore = storeContext.playerStore;
    if (!playerStore) {
      console.error("updatePlayerPosition error: Player store not initialized");
      return;
    }
    
    const { playerName, health } = playerStore;
    
    if (socket && socket.connected) {
      socket.emit('updatePlayer', {
        position: { x: position.x, y: position.y, z: position.z },
        rotation,
        health,
        username: playerName,
      });
    }
  },
  
  disconnect: () => {
    const { socket } = get();
    
    if (socket) {
      console.log('Disconnecting from server');
      socket.disconnect();
      set({ socket: null, connected: false });
    }
  },
  
  // Bullet-related actions
  fireBullet: (bulletData: BulletData) => {
    const { socket } = get();
    
    // Add bullet to local state
    set(state => ({
      bullets: [...state.bullets, bulletData]
    }));
    
    // Send bullet to server for broadcasting to other players
    if (socket && socket.connected) {
      socket.emit('bulletFired', {
        id: bulletData.id,
        position: {
          x: bulletData.position.x,
          y: bulletData.position.y,
          z: bulletData.position.z
        },
        velocity: {
          x: bulletData.velocity.x,
          y: bulletData.velocity.y,
          z: bulletData.velocity.z
        },
        owner: bulletData.owner,
        createdAt: bulletData.createdAt
      });
    }
  },
  
  addRemoteBullet: (bulletData: BulletData) => {
    // Add bullet received from server to local state
    set(state => ({
      bullets: [...state.bullets, bulletData]
    }));
  },
  
  removeBullet: (bulletId: string) => {
    // Remove bullet from local state (used for cleanup)
    set(state => ({
      bullets: state.bullets.filter(bullet => bullet.id !== bulletId)
    }));
  },
}));

// Initialize the store cross-references
storeContext.playerStore = usePlayer.getState();
storeContext.multiplayerStore = useMultiplayer.getState();

// Subscribe to changes in each store to keep our context updated
usePlayer.subscribe(state => {
  storeContext.playerStore = state;
});

useMultiplayer.subscribe(state => {
  storeContext.multiplayerStore = state;
});

// Function to explicitly refresh store references
const refreshStoreReferences = () => {
  console.log("Refreshing store references");
  storeContext.playerStore = usePlayer.getState();
  storeContext.multiplayerStore = useMultiplayer.getState();
};

refreshStoreReferences();

// Export this function so it can be called from other components if needed
export { refreshStoreReferences };

// Make stores globally available for debugging
if (typeof window !== 'undefined') {
  (window as any).refreshStoreReferences = refreshStoreReferences;
}

console.log('Stores initialized');