// Type definitions for global window object

interface Window {
  // Store references
  usePlayer?: any;
  useMultiplayer?: any;
  
  // Debug helper functions
  getGameState?: () => {
    player: any;
    multiplayer: any;
    controls: any;
  };
  
  // DevTools
  __ZUSTAND_DEVTOOLS__?: {
    usePlayer?: {
      getState?: () => any;
    };
    useMultiplayer?: {
      getState?: () => any;
    };
  };
}