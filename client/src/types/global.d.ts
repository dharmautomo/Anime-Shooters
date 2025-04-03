// Type definitions for global window object

interface Window {
  usePlayer?: any;
  shootBullet?: () => void;
  __ZUSTAND_DEVTOOLS__?: {
    usePlayer?: {
      getState?: () => {
        shootBullet?: () => void;
      };
    };
  };
}