import { create } from 'zustand';
import * as THREE from 'three';
import { io, Socket } from 'socket.io-client';

// Define weapon types as an enum for better type safety
export enum WeaponType {
  Pistol = 'pistol',
  Rifle = 'rifle',
  Shotgun = 'shotgun'
}

// Define the structure of a weapon
export interface Weapon {
  id: string;
  name: string;
  type: WeaponType;
  damage: number;
  fireRate: number; // rounds per second
  magazineSize: number;
  totalAmmo: number;
  reloadTime: number; // seconds
  range: number;
  spread: number; // bullet spread in radians
  projectileSpeed: number;
  automatic: boolean;
  model?: string;
  soundFire?: string;
  soundReload?: string;
  soundEmpty?: string;
}

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

// Define bullet data structure
export interface BulletData {
  id: string;
  position: THREE.Vector3;
  direction: THREE.Vector3;
  owner: string; // player id who shot the bullet
  timestamp: number;
  weaponType: WeaponType;
}

// Define weapon store
interface WeaponState {
  weapons: Weapon[];
  currentWeaponIndex: number;
  currentWeapon: Weapon;
  ammo: number;
  totalAmmo: number;
  isShooting: boolean;
  isReloading: boolean;
  lastShotTime: number;
  bullets: BulletData[];
  hitMarkers: {
    position: THREE.Vector3;
    timestamp: number;
  }[];
}

interface WeaponActions {
  initializeWeapons: () => void;
  selectWeapon: (index: number) => void;
  shootWeapon: () => void;
  reloadWeapon: () => void;
  finishReload: () => void;
  weaponCooldown: () => void;
  addBullet: (bullet: BulletData) => void;
  removeBullet: (bulletId: string) => void;
  processBulletHit: (bulletId: string, position: THREE.Vector3, targetId?: string) => void;
  resetWeapons: () => void;
}

// Combined interfaces
type PlayerStore = PlayerState & PlayerActions;
type MultiplayerStore = MultiplayerState & MultiplayerActions;
type WeaponStore = WeaponState & WeaponActions;

// Circular references for types
interface StoreReferences {
  playerStore: PlayerStore;
  multiplayerStore: MultiplayerStore;
  weaponStore: WeaponStore;
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
    const multiplayerStore = storeContext.multiplayerStore;
    if (multiplayerStore?.socket && multiplayerStore.socket.connected) {
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
  }
}));

// Create weapon store
export const useWeapon = create<WeaponStore>((set, get) => {
  // Define weapon presets
  const weaponPresets: Weapon[] = [
    {
      id: 'pistol',
      name: 'Pistol',
      type: WeaponType.Pistol,
      damage: 25,
      fireRate: 5, // shots per second
      magazineSize: 12,
      totalAmmo: 48,
      reloadTime: 1.2,
      range: 100,
      spread: 0.03,
      projectileSpeed: 1.2,
      automatic: false,
      soundFire: '/sounds/pistol-fire.mp3',
      soundReload: '/sounds/pistol-reload.mp3',
      soundEmpty: '/sounds/empty-click.mp3'
    },
    {
      id: 'rifle',
      name: 'Assault Rifle',
      type: WeaponType.Rifle,
      damage: 15,
      fireRate: 10, // shots per second
      magazineSize: 30,
      totalAmmo: 120,
      reloadTime: 2,
      range: 150,
      spread: 0.05,
      projectileSpeed: 1.5,
      automatic: true,
      soundFire: '/sounds/rifle-fire.mp3',
      soundReload: '/sounds/rifle-reload.mp3',
      soundEmpty: '/sounds/empty-click.mp3'
    },
    {
      id: 'shotgun',
      name: 'Shotgun',
      type: WeaponType.Shotgun,
      damage: 8, // per pellet (shoots multiple)
      fireRate: 1.5, // shots per second
      magazineSize: 8,
      totalAmmo: 32,
      reloadTime: 2.5,
      range: 75,
      spread: 0.2,
      projectileSpeed: 1.0,
      automatic: false,
      soundFire: '/sounds/shotgun-fire.mp3',
      soundReload: '/sounds/shotgun-reload.mp3',
      soundEmpty: '/sounds/empty-click.mp3'
    }
  ];

  return {
    // State
    weapons: weaponPresets,
    currentWeaponIndex: 0,
    currentWeapon: weaponPresets[0],
    ammo: weaponPresets[0].magazineSize,
    totalAmmo: weaponPresets[0].totalAmmo,
    isShooting: false,
    isReloading: false,
    lastShotTime: 0,
    bullets: [],
    hitMarkers: [],
    
    // Actions
    initializeWeapons: () => {
      // Initialize weapons with starting values
      set({ 
        weapons: weaponPresets,
        currentWeaponIndex: 0,
        currentWeapon: weaponPresets[0],
        ammo: weaponPresets[0].magazineSize,
        totalAmmo: weaponPresets[0].totalAmmo
      });
    },
    
    selectWeapon: (index: number) => {
      const { weapons, isReloading } = get();
      
      // Don't allow weapon switching during reload
      if (isReloading) return;
      
      // Validate index is within bounds
      if (index >= 0 && index < weapons.length) {
        set({ 
          currentWeaponIndex: index,
          currentWeapon: weapons[index],
          // Keep existing ammo state for this weapon
        });
        
        // Play weapon switch sound
        const switchSound = new Audio('/sounds/weapon-switch.mp3');
        switchSound.volume = 0.5;
        switchSound.play().catch(e => console.error("Error playing weapon switch sound:", e));
      }
    },
    
    shootWeapon: () => {
      const { currentWeapon, ammo, isReloading, isShooting, lastShotTime } = get();
      const now = Date.now();
      
      // Don't shoot if reloading, out of ammo, or still in cooldown
      if (isReloading || ammo <= 0 || isShooting) {
        // Play empty click sound if out of ammo
        if (ammo <= 0) {
          const emptySound = new Audio(currentWeapon.soundEmpty || '/sounds/empty-click.mp3');
          emptySound.volume = 0.5;
          emptySound.play().catch(e => console.error("Error playing empty sound:", e));
        }
        return;
      }
      
      // Check fire rate cooldown
      const cooldownTime = 1000 / currentWeapon.fireRate;
      if (now - lastShotTime < cooldownTime) {
        return;
      }
      
      // Play weapon fire sound
      const fireSound = new Audio(currentWeapon.soundFire || '/sounds/hit.mp3');
      fireSound.volume = 0.7;
      fireSound.play().catch(e => console.error("Error playing fire sound:", e));
      
      // Get player and multiplayer store
      const playerStore = storeContext.playerStore;
      const multiplayerStore = storeContext.multiplayerStore;
      
      if (!playerStore || !multiplayerStore) {
        console.error("Shoot error: Stores not initialized");
        return;
      }
      
      // Set shooting state
      set({ 
        isShooting: true,
        ammo: ammo - 1,
        lastShotTime: now
      });
      
      // Calculate bullet trajectory
      const canvas = document.querySelector('canvas');
      const camera = canvas ? (canvas as any).__r3f?.root?.getState()?.camera : null;
      
      if (!camera) {
        console.error("Shoot error: Camera not found");
        return;
      }
      
      // Get camera direction
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      
      // Apply weapon spread
      const spread = currentWeapon.spread;
      direction.x += (Math.random() - 0.5) * spread;
      direction.y += (Math.random() - 0.5) * spread;
      direction.z += (Math.random() - 0.5) * spread;
      direction.normalize();
      
      // Create bullet data
      const bulletId = `bullet_${playerStore.playerId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const bulletPosition = new THREE.Vector3().copy(playerStore.position);
      
      // Adjust bullet start position to be in front of the camera
      bulletPosition.add(direction.clone().multiplyScalar(0.5));
      
      // For shotgun, create multiple pellets
      if (currentWeapon.type === WeaponType.Shotgun) {
        // Create multiple pellets with spread
        const pelletCount = 8;
        for (let i = 0; i < pelletCount; i++) {
          // Create a unique ID for each pellet
          const pelletId = `${bulletId}_pellet_${i}`;
          
          // Create spread direction for each pellet
          const pelletDirection = direction.clone();
          pelletDirection.x += (Math.random() - 0.5) * spread * 2;
          pelletDirection.y += (Math.random() - 0.5) * spread * 2;
          pelletDirection.z += (Math.random() - 0.5) * spread * 2;
          pelletDirection.normalize();
          
          // Create pellet
          const pellet: BulletData = {
            id: pelletId,
            position: bulletPosition.clone(),
            direction: pelletDirection,
            owner: playerStore.playerId,
            timestamp: now,
            weaponType: currentWeapon.type
          };
          
          // Add bullet to local state
          get().addBullet(pellet);
          
          // Notify server about bullet
          if (multiplayerStore.socket && multiplayerStore.socket.connected) {
            multiplayerStore.socket.emit('bulletFired', {
              id: pelletId,
              position: {
                x: pellet.position.x,
                y: pellet.position.y,
                z: pellet.position.z
              },
              direction: {
                x: pellet.direction.x,
                y: pellet.direction.y,
                z: pellet.direction.z
              },
              weaponType: currentWeapon.type
            });
          }
        }
      } else {
        // Create a single bullet for non-shotgun weapons
        const bullet: BulletData = {
          id: bulletId,
          position: bulletPosition,
          direction: direction,
          owner: playerStore.playerId,
          timestamp: now,
          weaponType: currentWeapon.type
        };
        
        // Add bullet to local state
        get().addBullet(bullet);
        
        // Notify server about bullet
        if (multiplayerStore.socket && multiplayerStore.socket.connected) {
          multiplayerStore.socket.emit('bulletFired', {
            id: bullet.id,
            position: {
              x: bullet.position.x,
              y: bullet.position.y,
              z: bullet.position.z
            },
            direction: {
              x: bullet.direction.x,
              y: bullet.direction.y,
              z: bullet.direction.z
            },
            weaponType: currentWeapon.type
          });
        }
      }
      
      // Reset shooting state after a short delay
      setTimeout(() => {
        set({ isShooting: false });
        
        // If the weapon is automatic and the mouse button is still held down,
        // this could be the place to trigger another shot
      }, 50);
      
      // Automatically reload if out of ammo
      if (ammo - 1 <= 0 && get().totalAmmo > 0) {
        setTimeout(() => {
          get().reloadWeapon();
        }, 300); // Small delay before auto-reload
      }
    },
    
    reloadWeapon: () => {
      const { currentWeapon, ammo, totalAmmo, isReloading } = get();
      
      // Don't reload if already reloading or no ammo left or magazine already full
      if (isReloading || totalAmmo <= 0 || ammo >= currentWeapon.magazineSize) {
        return;
      }
      
      // Play reload sound
      const reloadSound = new Audio(currentWeapon.soundReload || '/sounds/reload.mp3');
      reloadSound.volume = 0.6;
      reloadSound.play().catch(e => console.error("Error playing reload sound:", e));
      
      // Set reloading state
      set({ isReloading: true });
      
      // Reload logic will be completed in finishReload after animation
    },
    
    finishReload: () => {
      const { currentWeapon, ammo, totalAmmo } = get();
      
      // Calculate amount to reload
      const ammoNeeded = currentWeapon.magazineSize - ammo;
      const ammoAvailable = Math.min(ammoNeeded, totalAmmo);
      
      // Update ammo counts
      set({
        ammo: ammo + ammoAvailable,
        totalAmmo: totalAmmo - ammoAvailable,
        isReloading: false
      });
    },
    
    weaponCooldown: () => {
      set({ isShooting: false });
    },
    
    addBullet: (bullet: BulletData) => {
      set(state => ({
        bullets: [...state.bullets, bullet]
      }));
      
      // Set up automatic bullet cleanup
      setTimeout(() => {
        get().removeBullet(bullet.id);
      }, 5000); // Bullet lifetime of 5 seconds
    },
    
    removeBullet: (bulletId: string) => {
      set(state => ({
        bullets: state.bullets.filter(b => b.id !== bulletId)
      }));
    },
    
    processBulletHit: (bulletId: string, position: THREE.Vector3, targetId?: string) => {
      // Remove bullet from state
      get().removeBullet(bulletId);
      
      // Add hit marker
      set(state => ({
        hitMarkers: [
          ...state.hitMarkers,
          {
            position: position.clone(),
            timestamp: Date.now()
          }
        ]
      }));
      
      // Play hit sound
      const hitSound = new Audio('/sounds/hit.mp3');
      hitSound.volume = 0.5;
      hitSound.play().catch(e => console.error("Error playing hit sound:", e));
      
      // If we hit a player, notify server and add score
      if (targetId) {
        const multiplayerStore = storeContext.multiplayerStore;
        const playerStore = storeContext.playerStore;
        
        if (!multiplayerStore || !playerStore) {
          console.error("Hit processing error: Stores not initialized");
          return;
        }
        
        // Find the bullet to determine damage
        const bullet = get().bullets.find(b => b.id === bulletId);
        if (!bullet) return;
        
        // Find weapon type and damage
        const { currentWeapon } = get();
        const damage = bullet.weaponType === WeaponType.Shotgun 
          ? currentWeapon.damage / 2 // Less damage per pellet for shotgun
          : currentWeapon.damage;
        
        // Notify server about hit
        if (multiplayerStore.socket && multiplayerStore.socket.connected) {
          multiplayerStore.socket.emit('playerHit', {
            targetId,
            damage,
            position: {
              x: position.x,
              y: position.y,
              z: position.z
            }
          });
        }
        
        // Add score to player (will be properly updated when server confirms kill)
        playerStore.addScore(1); // 1 point per hit
      }
      
      // Remove hit markers after a delay
      setTimeout(() => {
        set(state => ({
          hitMarkers: state.hitMarkers.filter(
            marker => Date.now() - marker.timestamp < 1000
          )
        }));
      }, 1000);
    },
    
    resetWeapons: () => {
      set({
        currentWeaponIndex: 0,
        currentWeapon: weaponPresets[0],
        ammo: weaponPresets[0].magazineSize,
        totalAmmo: weaponPresets[0].totalAmmo,
        isShooting: false,
        isReloading: false,
        bullets: [],
        hitMarkers: []
      });
    }
  };
});

// Initialize the store cross-references
storeContext.playerStore = usePlayer.getState();
storeContext.multiplayerStore = useMultiplayer.getState();
storeContext.weaponStore = useWeapon.getState();

// Subscribe to changes in each store to keep our context updated
usePlayer.subscribe(state => {
  storeContext.playerStore = state;
});

useMultiplayer.subscribe(state => {
  storeContext.multiplayerStore = state;
});

useWeapon.subscribe(state => {
  storeContext.weaponStore = state;
});

// Function to explicitly refresh store references
const refreshStoreReferences = () => {
  console.log("Refreshing store references");
  storeContext.playerStore = usePlayer.getState();
  storeContext.multiplayerStore = useMultiplayer.getState();
  storeContext.weaponStore = useWeapon.getState();
};

refreshStoreReferences();

// Export this function so it can be called from other components if needed
export { refreshStoreReferences };

// Make stores globally available for debugging
if (typeof window !== 'undefined') {
  (window as any).refreshStoreReferences = refreshStoreReferences;
  
  // Expose stores for easy debugging
  (window as any).usePlayer = usePlayer;
  (window as any).useMultiplayer = useMultiplayer;
  (window as any).useWeapon = useWeapon;
  
  // Add shootBullet to window for external access
  (window as any).shootBullet = () => {
    useWeapon.getState().shootWeapon();
  };
  
  // Debug helper to get game state
  (window as any).getGameState = () => {
    return {
      player: usePlayer.getState(),
      multiplayer: useMultiplayer.getState(),
      weapon: useWeapon.getState()
    };
  };
  
  // Debug helper to get bullets
  (window as any).getBullets = () => {
    return {
      local: useWeapon.getState().bullets
    };
  };
}

console.log('Stores initialized');