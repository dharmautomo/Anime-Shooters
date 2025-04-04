// Type definitions for global window object

interface Window {
  // Store references
  usePlayer?: any;
  useMultiplayer?: any;
  
  // Shooting functions
  shootBullet?: () => void;
  testShoot?: () => string;
  
  // Debug helper functions
  getBullets?: () => {
    local: any[];
    remote: any[];
  };
  getGameState?: () => {
    player: any;
    multiplayer: any;
    controls: any;
  };
  
  // DevTools
  __ZUSTAND_DEVTOOLS__?: {
    usePlayer?: {
      getState?: () => {
        shootBullet?: () => void;
      };
    };
    useMultiplayer?: {
      getState?: () => {
        bullets?: any[];
      };
    };
  };
}