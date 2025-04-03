import { create } from 'zustand';
import * as THREE from 'three';
import { io, Socket } from 'socket.io-client';
import { usePlayer } from './usePlayer';

// Define types locally to avoid import issues
interface PlayerData {
  id: string;
  username: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: number;
  health: number;
}

interface BulletData {
  id: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  velocity: {
    x: number;
    y: number;
    z: number;
  };
  owner: string;
}

interface KillFeedItem {
  killer: string;
  victim: string;
}

interface OtherPlayer {
  id: string;
  username: string;
  position: THREE.Vector3;
  rotation: number;
  health: number;
}

interface BulletInfo {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  owner: string;
}

interface MultiplayerState {
  socket: Socket | null;
  connected: boolean;
  otherPlayers: Record<string, OtherPlayer>;
  bullets: BulletInfo[];
  killFeed: KillFeedItem[];
  
  // Actions
  initializeSocket: (username: string) => void;
  updatePlayerPosition: (position: THREE.Vector3, rotation: number) => void;
  addBullet: (position: THREE.Vector3, direction: THREE.Vector3, owner: string) => string;
  removeBullet: (id: string) => void;
  checkBulletCollision: (bulletPosition: THREE.Vector3, bulletOwner: string) => boolean;
  disconnect: () => void;
}

export const useMultiplayer = create<MultiplayerState>((set, get) => ({
  socket: null,
  connected: false,
  otherPlayers: {},
  bullets: [],
  killFeed: [],
  
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
      usePlayer.getState().setPlayerId(playerId);
      
      // Join game with username
      const userName = username || 'Player';
      
      // Save the username to player state
      usePlayer.getState().setPlayerName(userName);
      
      socket.emit('joinGame', {
        id: playerId,
        username: userName,
        position: usePlayer.getState().position,
        rotation: usePlayer.getState().rotation,
        health: usePlayer.getState().health,
      });
    });
    
    // Handle when a new player joins
    socket.on('playerJoined', (playerData: PlayerData) => {
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
    
    // Handle when a player leaves
    socket.on('playerLeft', (playerId: string) => {
      console.log(`Player left: ${playerId}`);
      
      // Remove from other players list
      set((state) => {
        const newOtherPlayers = { ...state.otherPlayers };
        delete newOtherPlayers[playerId];
        return { otherPlayers: newOtherPlayers };
      });
    });
    
    // Handle existing players data
    socket.on('existingPlayers', (players: Record<string, PlayerData>) => {
      console.log('Received existing players data');
      
      const otherPlayers: Record<string, OtherPlayer> = {};
      
      // Convert player data to our format
      Object.entries(players).forEach(([id, playerData]) => {
        if (id !== socket.id) {
          otherPlayers[id] = {
            id,
            username: playerData.username,
            position: new THREE.Vector3(
              playerData.position.x,
              playerData.position.y,
              playerData.position.z
            ),
            rotation: playerData.rotation,
            health: playerData.health,
          };
        }
      });
      
      set({ otherPlayers });
    });
    
    // Handle player updates
    socket.on('playerUpdated', (playerData: PlayerData) => {
      console.log(`Received player update for ${playerData.id}, health: ${playerData.health}`);
      
      set((state) => {
        // Only update if this is another player (not ourselves)
        if (playerData.id !== socket.id) {
          console.log(`Updating other player ${playerData.id} in state, health: ${playerData.health}`);
          
          // Create player entry if it doesn't exist yet
          const existingPlayer = state.otherPlayers[playerData.id];
          
          return {
            otherPlayers: {
              ...state.otherPlayers,
              [playerData.id]: {
                id: playerData.id,
                username: playerData.username || (existingPlayer ? existingPlayer.username : 'Unknown'),
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
        return {};
      });
    });
    
    // Handle bullet creation
    socket.on('bulletCreated', (bulletData: BulletData) => {
      // Don't add our own bullets (they're already added locally)
      if (bulletData.owner !== socket.id) {
        set((state) => ({
          bullets: [
            ...state.bullets,
            {
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
            },
          ],
        }));
      }
    });
    
    // Handle bullet removal
    socket.on('bulletRemoved', (bulletId: string) => {
      set((state) => ({
        bullets: state.bullets.filter((bullet) => bullet.id !== bulletId),
      }));
    });
    
    // Handle player hit
    socket.on('playerHit', (data: { playerId: string, damage: number }) => {
      console.log(`Hit event received for player ${data.playerId}, damage: ${data.damage}`);
      
      // If we were hit
      if (data.playerId === socket.id) {
        console.log(`Taking damage locally: ${data.damage}`);
        usePlayer.getState().takeDamage(data.damage);
      } else {
        // Update other player's health locally for immediate visual feedback
        console.log(`Updating other player's health due to hit: ${data.playerId}`);
        set(state => {
          const otherPlayer = state.otherPlayers[data.playerId];
          if (otherPlayer) {
            console.log(`Other player ${data.playerId} current health: ${otherPlayer.health}, applying damage: ${data.damage}`);
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
    
    // Handle player killed
    socket.on('playerKilled', (data: { killer: string, victim: string }) => {
      // Format names for kill feed
      const killerName = data.killer === socket.id ? 'You' : 
        (get().otherPlayers[data.killer]?.username || 'Unknown Player');
      
      const victimName = data.victim === socket.id ? 'You' : 
        (get().otherPlayers[data.victim]?.username || 'Unknown Player');
      
      // Add to kill feed
      set((state) => ({
        killFeed: [
          { killer: killerName, victim: victimName },
          ...state.killFeed.slice(0, 4), // Keep last 5 items
        ],
      }));
      
      // Update score if we are the killer
      if (data.killer === socket.id) {
        usePlayer.getState().addScore(1);
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      set({ connected: false });
    });
  },
  
  updatePlayerPosition: (position, rotation) => {
    const { socket } = get();
    const { playerName, health } = usePlayer.getState();
    
    if (socket && socket.connected) {
      socket.emit('updatePlayer', {
        position: { x: position.x, y: position.y, z: position.z },
        rotation,
        health,
        username: playerName, // Include username in updates
      });
    }
  },
  
  addBullet: (position, direction, owner) => {
    const { socket } = get();
    const bulletId = Math.random().toString(36).substring(2, 9);
    
    console.log(`Creating bullet ${bulletId} at position:`, position, 'direction:', direction, 'owner:', owner);
    
    // Normalize direction vector
    const normalizedDirection = direction.clone().normalize();
    
    // Add bullet locally
    set((state) => {
      console.log(`Adding bullet ${bulletId} to local state. Current bullets count:`, state.bullets.length);
      return {
        bullets: [
          ...state.bullets,
          {
            id: bulletId,
            position: position.clone(),
            velocity: normalizedDirection.clone(),
            owner,
          },
        ],
      };
    });
    
    // Log bullet state after adding
    const updatedBullets = get().bullets;
    console.log(`After adding: total bullets count:`, updatedBullets.length);
    console.log(`New bullet in state:`, updatedBullets.find(b => b.id === bulletId));
    
    // Send to server
    if (socket && socket.connected) {
      console.log(`Sending bullet ${bulletId} to server`);
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
    } else {
      console.warn('Socket not connected - bullet only added locally');
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
    const { playerId, takeDamage } = usePlayer.getState();
    
    console.log("Checking bullet collision - bullet position:", bulletPosition, "owner:", bulletOwner);
    console.log("Other players count:", Object.keys(otherPlayers).length);
    
    // Check collision with other players
    for (const [id, player] of Object.entries(otherPlayers)) {
      console.log(`Checking collision with player ${id}, health: ${player.health}, position:`, player.position);
      if (player.health <= 0) {
        console.log(`Player ${id} is already dead, skipping`);
        continue; // Skip dead players
      }
      
      // Use a larger collision radius for better hit detection
      const distance = bulletPosition.distanceTo(player.position);
      console.log(`Distance to player ${id}:`, distance);
      
      // Use 1.5 units for a more generous hit box
      if (distance < 1.5) {
        // Hit another player
        console.log(`COLLISION DETECTED with player ${id}! Emitting hitPlayer event, damage: 25`);
        if (socket && socket.connected) {
          socket.emit('hitPlayer', {
            playerId: id,
            damage: 25,
            shooterId: bulletOwner,
          });
          
          // Update the player's health locally to ensure visual feedback
          set(state => ({
            otherPlayers: {
              ...state.otherPlayers,
              [id]: {
                ...state.otherPlayers[id],
                health: Math.max(0, state.otherPlayers[id].health - 25)
              }
            }
          }));
        }
        return true;
      }
    }
    
    // Check collision with main player (if bullet isn't from main player)
    if (bulletOwner !== playerId) {
      const playerPosition = usePlayer.getState().position;
      // Use the same generous hit box for the main player
      const distance = bulletPosition.distanceTo(playerPosition);
      console.log("Distance to main player:", distance);
      
      if (distance < 1.5 && usePlayer.getState().health > 0) {
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
