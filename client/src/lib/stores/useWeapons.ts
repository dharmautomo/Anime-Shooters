import { create } from 'zustand';
import * as THREE from 'three';
import { usePlayer, useMultiplayer } from './initializeStores';

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

export enum WeaponType {
  PISTOL = 'pistol',
  RIFLE = 'rifle',
  SHOTGUN = 'shotgun'
}

interface WeaponStats {
  name: string;
  damage: number;
  fireRate: number; // shots per second
  reloadTime: number; // seconds
  magazineSize: number;
  range: number;
  spread: number; // in degrees
  automatic: boolean;
  model?: THREE.Group;
}

interface Bullet {
  id: string;
  position: THREE.Vector3;
  direction: THREE.Vector3;
  speed: number;
  damage: number;
  playerId: string;
  weaponType: WeaponType;
  createdAt: number;
}

interface WeaponState {
  // Current weapon selection
  currentWeapon: WeaponType;
  weapons: Record<WeaponType, {
    ammo: number;
    totalAmmo: number;
    isReloading: boolean;
    lastFired: number;
  }>;
  
  // Active bullets
  bullets: Bullet[];
  
  // Cooldowns and flags
  isFiring: boolean;
  
  // Actions
  switchWeapon: (weaponType: WeaponType) => void;
  shootBullet: () => void;
  reload: () => void;
  
  // Bullet lifecycle
  updateBullets: (deltaTime: number) => void;
  clearOldBullets: () => void;
}

export const WEAPON_CONFIGS: Record<WeaponType, WeaponStats> = {
  [WeaponType.PISTOL]: {
    name: "Pistol",
    damage: 20,
    fireRate: 3, // 3 shots per second
    reloadTime: 1, // 1 second reload
    magazineSize: 12,
    range: 50,
    spread: 2, // degrees
    automatic: false
  },
  [WeaponType.RIFLE]: {
    name: "Assault Rifle",
    damage: 15,
    fireRate: 8, // 8 shots per second
    reloadTime: 1.5, // 1.5 second reload
    magazineSize: 30,
    range: 70,
    spread: 5, // degrees
    automatic: true
  },
  [WeaponType.SHOTGUN]: {
    name: "Shotgun",
    damage: 10, // per pellet, multiplied by number of pellets
    fireRate: 1, // 1 shot per second
    reloadTime: 2, // 2 second reload
    magazineSize: 6,
    range: 30,
    spread: 15, // degrees
    automatic: false
  }
};

export const useWeapons = create<WeaponState>((set, get) => ({
  // Initial state
  currentWeapon: WeaponType.PISTOL,
  weapons: {
    [WeaponType.PISTOL]: {
      ammo: WEAPON_CONFIGS[WeaponType.PISTOL].magazineSize,
      totalAmmo: 60,
      isReloading: false,
      lastFired: 0
    },
    [WeaponType.RIFLE]: {
      ammo: WEAPON_CONFIGS[WeaponType.RIFLE].magazineSize,
      totalAmmo: 90,
      isReloading: false,
      lastFired: 0
    },
    [WeaponType.SHOTGUN]: {
      ammo: WEAPON_CONFIGS[WeaponType.SHOTGUN].magazineSize,
      totalAmmo: 30,
      isReloading: false,
      lastFired: 0
    }
  },
  bullets: [],
  isFiring: false,
  
  // Switch to a different weapon
  switchWeapon: (weaponType: WeaponType) => {
    // Do nothing if same weapon or currently reloading
    if (
      get().currentWeapon === weaponType || 
      get().weapons[get().currentWeapon].isReloading
    ) {
      return;
    }
    
    set({ currentWeapon: weaponType });
    console.log(`Switched to ${WEAPON_CONFIGS[weaponType].name}`);
  },
  
  // Shooting logic
  shootBullet: () => {
    // Get the current state
    const { isAlive, position, playerId } = usePlayer.getState();
    const { socket } = useMultiplayer.getState();
    const { currentWeapon, weapons } = get();
    
    // Check if player is alive
    if (!isAlive) return;
    
    // Get weapon config
    const weaponConfig = WEAPON_CONFIGS[currentWeapon];
    const weaponState = weapons[currentWeapon];
    
    // Check if weapon can fire (ammo, reload state, fire rate)
    if (
      weaponState.ammo <= 0 || 
      weaponState.isReloading ||
      (Date.now() - weaponState.lastFired < (1000 / weaponConfig.fireRate))
    ) {
      // Can't fire
      if (weaponState.ammo <= 0) {
        console.log("Out of ammo! Reload needed.");
        // Auto-reload when empty
        get().reload();
      }
      return;
    }
    
    // Update ammo count
    set(state => ({
      weapons: {
        ...state.weapons,
        [currentWeapon]: {
          ...state.weapons[currentWeapon],
          ammo: state.weapons[currentWeapon].ammo - 1,
          lastFired: Date.now()
        }
      }
    }));
    
    // Get camera direction for bullet trajectory
    // We need to access the camera from the Three.js scene
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    
    const camera = (canvas as any)?.__r3f?.root?.camera;
    if (!camera) {
      console.error("Camera not found for bullet direction");
      return;
    }
    
    // Create a vector representing the direction the camera is facing
    const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
    
    // Apply weapon spread
    if (weaponConfig.spread > 0) {
      // Add random spread
      const spreadRadians = THREE.MathUtils.degToRad(weaponConfig.spread);
      direction.x += (Math.random() - 0.5) * spreadRadians;
      direction.y += (Math.random() - 0.5) * spreadRadians;
      direction.z += (Math.random() - 0.5) * spreadRadians;
      direction.normalize(); // Ensure it's still a unit vector
    }
    
    // Create a bullet
    const bullet: Bullet = {
      id: generateId(),
      position: new THREE.Vector3(position.x, position.y + 1.5, position.z), // From camera height
      direction: direction,
      speed: 50, // Units per second
      damage: weaponConfig.damage,
      playerId,
      weaponType: currentWeapon,
      createdAt: Date.now()
    };
    
    // Add bullet to state
    set(state => ({
      bullets: [...state.bullets, bullet]
    }));
    
    // Send bullet data to server if multiplayer is active
    if (socket) {
      socket.emit('shootBullet', {
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
        speed: bullet.speed,
        damage: bullet.damage,
        id: bullet.id,
        weaponType: bullet.weaponType
      });
    }
    
    // For shotgun, create multiple pellets
    if (currentWeapon === WeaponType.SHOTGUN) {
      // Create 6 additional pellets with spread
      const pelletCount = 6;
      const pellets: Bullet[] = [];
      
      for (let i = 0; i < pelletCount; i++) {
        // Create a new direction vector with more spread
        const pelletDirection = direction.clone();
        const spreadRadians = THREE.MathUtils.degToRad(weaponConfig.spread * 1.5);
        
        pelletDirection.x += (Math.random() - 0.5) * spreadRadians;
        pelletDirection.y += (Math.random() - 0.5) * spreadRadians;
        pelletDirection.z += (Math.random() - 0.5) * spreadRadians;
        pelletDirection.normalize();
        
        const pellet: Bullet = {
          id: generateId(),
          position: bullet.position.clone(),
          direction: pelletDirection,
          speed: bullet.speed * (0.8 + Math.random() * 0.4), // Varied speed
          damage: weaponConfig.damage,
          playerId,
          weaponType: currentWeapon,
          createdAt: Date.now()
        };
        
        pellets.push(pellet);
        
        // Send pellet data to server if multiplayer is active
        if (socket) {
          socket.emit('shootBullet', {
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
            speed: pellet.speed,
            damage: pellet.damage,
            id: pellet.id,
            weaponType: pellet.weaponType
          });
        }
      }
      
      // Add all pellets to state
      set(state => ({
        bullets: [...state.bullets, ...pellets]
      }));
    }
    
    // Log debug info
    console.log(`Fired ${currentWeapon}, remaining ammo: ${weaponState.ammo - 1}`);
  },
  
  // Reload weapon
  reload: () => {
    const { currentWeapon, weapons } = get();
    const weaponState = weapons[currentWeapon];
    const weaponConfig = WEAPON_CONFIGS[currentWeapon];
    
    // Check if reload is necessary and possible
    if (
      weaponState.ammo === weaponConfig.magazineSize || // Already full
      weaponState.isReloading || // Already reloading
      weaponState.totalAmmo <= 0 // No ammo left
    ) {
      return;
    }
    
    console.log(`Reloading ${WEAPON_CONFIGS[currentWeapon].name}...`);
    
    // Start reloading
    set(state => ({
      weapons: {
        ...state.weapons,
        [currentWeapon]: {
          ...state.weapons[currentWeapon],
          isReloading: true
        }
      }
    }));
    
    // Set timeout to finish reloading
    setTimeout(() => {
      const currentState = get();
      const currentWeaponState = currentState.weapons[currentWeapon];
      const ammoNeeded = weaponConfig.magazineSize - currentWeaponState.ammo;
      const ammoToAdd = Math.min(ammoNeeded, currentWeaponState.totalAmmo);
      
      set(state => ({
        weapons: {
          ...state.weapons,
          [currentWeapon]: {
            ...state.weapons[currentWeapon],
            ammo: state.weapons[currentWeapon].ammo + ammoToAdd,
            totalAmmo: state.weapons[currentWeapon].totalAmmo - ammoToAdd,
            isReloading: false
          }
        }
      }));
      
      console.log(`Reload complete. ${currentWeapon} ammo: ${currentWeaponState.ammo + ammoToAdd}/${currentWeaponState.totalAmmo - ammoToAdd}`);
    }, weaponConfig.reloadTime * 1000);
  },
  
  // Update bullet positions
  updateBullets: (deltaTime: number) => {
    const { bullets } = get();
    const { otherPlayers } = useMultiplayer.getState();
    const { takeDamage, addScore, playerId, position: playerPosition } = usePlayer.getState();
    
    // Move bullets and check collisions
    const updatedBullets = bullets.map(bullet => {
      // Update position
      const moveDistance = bullet.speed * deltaTime;
      const newPosition = bullet.position.clone().add(
        bullet.direction.clone().multiplyScalar(moveDistance)
      );
      
      // Return updated bullet
      return {
        ...bullet,
        position: newPosition
      };
    });
    
    // Check for bullet collisions with players
    updatedBullets.forEach(bullet => {
      // Skip bullets fired by the local player against themselves
      if (bullet.playerId === playerId) {
        // Check collision with other players
        Object.values(otherPlayers).forEach(otherPlayer => {
          const playerPos = new THREE.Vector3(
            otherPlayer.position.x,
            otherPlayer.position.y,
            otherPlayer.position.z
          );
          
          // Simple sphere-based collision (player has ~1 unit radius)
          const hitDistance = 1;
          const distance = bullet.position.distanceTo(playerPos);
          
          if (distance < hitDistance) {
            // Hit an opponent
            console.log(`Hit player ${otherPlayer.username} with ${bullet.weaponType}`);
            
            // Remove this bullet from active bullets
            set(state => ({
              bullets: state.bullets.filter(b => b.id !== bullet.id)
            }));
            
            // Send hit event to server
            const { socket } = useMultiplayer.getState();
            if (socket) {
              socket.emit('playerHit', {
                playerId: otherPlayer.id, 
                damage: bullet.damage,
                bulletId: bullet.id
              });
            }
          }
        });
      } else {
        // Check if bullet hits the local player
        const distance = bullet.position.distanceTo(playerPosition);
        const hitDistance = 1;
        
        if (distance < hitDistance) {
          // Local player was hit
          console.log(`Local player hit by bullet from ${bullet.playerId}`);
          
          // Apply damage to local player
          takeDamage(bullet.damage);
          
          // Remove the bullet
          set(state => ({
            bullets: state.bullets.filter(b => b.id !== bullet.id)
          }));
        }
      }
    });
    
    set({ bullets: updatedBullets });
  },
  
  // Clean up old bullets
  clearOldBullets: () => {
    const { bullets } = get();
    const { position } = usePlayer.getState();
    const now = Date.now();
    const maxAge = 5000; // bullets expire after 5 seconds
    const maxDistance = 200; // bullets expire after 200 units
    
    const remainingBullets = bullets.filter(bullet => {
      const age = now - bullet.createdAt;
      const distance = bullet.position.distanceTo(position);
      
      return age < maxAge && distance < maxDistance;
    });
    
    if (bullets.length !== remainingBullets.length) {
      set({ bullets: remainingBullets });
    }
  }
}));

// Attach to window for debugging
if (typeof window !== 'undefined') {
  (window as any).useWeapons = useWeapons;
}