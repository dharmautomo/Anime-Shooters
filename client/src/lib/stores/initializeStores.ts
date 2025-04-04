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

interface MultiplayerState {
  socket: Socket | null;
  connected: boolean;
  otherPlayers: Record<string, PlayerData>;
  killFeed: KillFeedItem[];
}

interface MultiplayerActions {
  initializeSocket: (username: string) => void;
  updatePlayerPosition: (position: THREE.Vector3, rotation: number) => void;
  disconnect: () => void;
}

// Combined interfaces
type PlayerStore = PlayerState & PlayerActions;
type MultiplayerStore = MultiplayerState & MultiplayerActions;

// Type declarations to help TypeScript understand the store's getState method
declare module 'zustand' {
  interface StoreApi<T> {
    getState: () => T;
  }
}

// Create stores
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
      // Calculate new health
      const newHealth = Math.max(0, state.health - amount);
      const wasAlive = state.isAlive;
      const isAlive = newHealth > 0;
      
      // Check if player just died (was alive before, now dead)
      if (wasAlive && !isAlive) {
        console.log('Player died! Scheduling respawn in 3 seconds...');
        
        // Play death sound
        const deathSound = new Audio('/sounds/death.mp3');
        deathSound.volume = 0.7;
        deathSound.play().catch(e => console.error("Error playing death sound:", e));
        
        // Schedule respawn
        setTimeout(() => {
          console.log('Respawning player...');
          get().respawn();
        }, 3000);
      }
      
      return { 
        health: newHealth, 
        isAlive 
      };
    });
  },
  
  addScore: (points: number) => {
    set((state) => ({ score: state.score + points }));
  },
  
  respawn: () => {
    // Generate a random position for respawn
    const randomX = (Math.random() - 0.5) * 40;
    const randomZ = (Math.random() - 0.5) * 40;
    const newPosition = new THREE.Vector3(randomX, 1.6, randomZ);
    
    // Play respawn sound
    const respawnSound = new Audio('/sounds/respawn.mp3');
    respawnSound.volume = 0.5;
    respawnSound.play().catch(e => console.error("Error playing respawn sound:", e));
    
    // Update local player state
    set({
      position: newPosition,
      health: 100,
      isAlive: true
    });
    
    // Notify server about respawn
    const multiplayerStore = useMultiplayer.getState();
    if (multiplayerStore.socket && multiplayerStore.socket.connected) {
      console.log('Notifying server about respawn');
      multiplayerStore.socket.emit('playerRespawn', {
        position: { 
          x: newPosition.x, 
          y: newPosition.y, 
          z: newPosition.z 
        }
      });
    }
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
      
      // Access player store
      const playerStore = usePlayer.getState();
      
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
      
      // Get player store
      const playerStore = usePlayer.getState();
      
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
    
    // Handle kill feed updates
    socket.on('playerKilled', (data: { killer: string, victim: string }) => {
      console.log(`Player killed: ${data.victim} by ${data.killer}`);
      
      // Get player store
      const playerStore = usePlayer.getState();
      
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
    
    // Get player data
    const playerStore = usePlayer.getState();
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
  }
}));