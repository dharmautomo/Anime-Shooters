import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useEffect } from "react";
import { KeyboardControls } from "@react-three/drei";
import Game from "./components/Game";
import Login from "./components/Login";
import { usePlayer, useMultiplayer } from "./lib/stores/initializeStores";
import { useGameControls } from "./lib/stores/useGameControls";
import AudioManager from "./components/AudioManager";
import UI from "./components/UI";
import GameStartOverlay from "./components/GameStartOverlay";
import "@fontsource/inter";

// Define control keys for the game - use a simple object literal to avoid Fast Refresh issues
export const Controls = {
  forward: 'forward',
  backward: 'backward',
  left: 'left',
  right: 'right',
  jump: 'jump',
  shoot: 'shoot',
  reload: 'reload',
} as const;

// Type for Controls
export type ControlsType = typeof Controls[keyof typeof Controls];

// Define key mappings
const keyMap = [
  { name: Controls.forward, keys: ['ArrowUp', 'KeyW'] },
  { name: Controls.backward, keys: ['ArrowDown', 'KeyS'] },
  { name: Controls.left, keys: ['ArrowLeft', 'KeyA'] },
  { name: Controls.right, keys: ['ArrowRight', 'KeyD'] },
  { name: Controls.jump, keys: ['Space'] },
  { name: Controls.shoot, keys: ['click', 'KeyJ'] }, // Added J key as an alternative to mouse click
  { name: Controls.reload, keys: ['KeyR'] },
];

// Helper function to parse URL parameters
const getUrlParams = () => {
  const searchParams = new URLSearchParams(window.location.search);
  return {
    username: searchParams.get('username'),
    comingFromPortal: searchParams.get('portal') === 'true',
    color: searchParams.get('color'),
    speed: searchParams.get('speed'),
    referrer: searchParams.get('ref'),
  };
};

// Main App component
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [portalReferrer, setPortalReferrer] = useState<string | null>(null);
  const { initializeSocket } = useMultiplayer();
  const { setPlayerName } = usePlayer();

  // Handle URL parameters for portal functionality
  useEffect(() => {
    const params = getUrlParams();

    // Check if the user came from a portal
    if (params.comingFromPortal && params.username) {
      console.log("User entered from a portal:", params);
      
      // Auto-login if coming from a portal
      handleLogin(params.username);
      
      // Store the referrer for return portal
      if (params.referrer) {
        setPortalReferrer(params.referrer);
      }
    }
  }, []);

  // Handle login
  const handleLogin = (name: string) => {
    if (name.trim()) {
      const trimmedName = name.trim();
      console.log("Logging in with username:", trimmedName);
      setUsername(trimmedName);
      setPlayerName(trimmedName);
      setIsLoggedIn(true);
      initializeSocket(trimmedName);
    }
  };

  // Prevent context menu on right-click
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener("contextmenu", handleContextMenu);
    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);
  
  // Track J key specifically for better shooting diagnostics
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyJ') {
        console.log("J KEY PRESSED - Direct keyboard shoot trigger");
        document.body.setAttribute('data-pressed-j', 'true');
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyJ') {
        document.body.setAttribute('data-pressed-j', 'false');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Add cursor-hidden class to body when logged in
  useEffect(() => {
    if (isLoggedIn) {
      document.body.classList.add("cursor-hidden");
    } else {
      document.body.classList.remove("cursor-hidden");
    }

    return () => {
      document.body.classList.remove("cursor-hidden");
    };
  }, [isLoggedIn]);

  // Add emergency shoot button for debugging
  useEffect(() => {
    // Make store accessible globally for emergency debugging
    if (typeof window !== 'undefined') {
      (window as any).usePlayer = usePlayer;
    }
    
    const createDebugButton = () => {
      const existingBtn = document.getElementById('debug-shoot-btn');
      if (existingBtn) return;
      
      const btn = document.createElement('button');
      btn.id = 'debug-shoot-btn';
      btn.textContent = 'EMERGENCY SHOOT';
      btn.style.position = 'fixed';
      btn.style.bottom = '20px';
      btn.style.right = '20px';
      btn.style.zIndex = '10000';
      btn.style.backgroundColor = 'red';
      btn.style.color = 'white';
      btn.style.padding = '10px';
      btn.style.border = 'none';
      btn.style.borderRadius = '5px';
      
      btn.addEventListener('click', () => {
        console.log("Emergency shoot button clicked");
        // Try to get the store from window
        if (window.usePlayer && typeof window.usePlayer.getState === 'function') {
          const playerState = window.usePlayer.getState();
          if (playerState && typeof playerState.shootBullet === 'function') {
            playerState.shootBullet();
          }
        }
        
        // Backup: Try to find and call shootBullet directly
        try {
          let shootBullet = window.shootBullet;
          
          // Try to get from devtools if available
          if (!shootBullet && (window as any).__ZUSTAND_DEVTOOLS__) {
            const devTools = (window as any).__ZUSTAND_DEVTOOLS__;
            if (devTools.usePlayer && typeof devTools.usePlayer.getState === 'function') {
              const state = devTools.usePlayer.getState();
              if (state && typeof state.shootBullet === 'function') {
                shootBullet = state.shootBullet;
              }
            }
          }
          
          if (shootBullet) shootBullet();
        } catch (e) {
          console.error("Emergency shoot failed:", e);
        }
      });
      
      document.body.appendChild(btn);
    };
    
    // Only show emergency button in development
    if (process.env.NODE_ENV === 'development') {
      createDebugButton();
    }
    
    return () => {
      const btn = document.getElementById('debug-shoot-btn');
      if (btn) btn.remove();
    };
  }, []);


  return (
    <>
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <KeyboardControls map={keyMap}>
          <Canvas
            shadows
            camera={{
              position: [0, 1.6, 0],
              fov: 75,
              near: 0.1,
              far: 1000
            }}
            gl={{
              antialias: true,
              powerPreference: "default"
            }}
            onClick={(e) => {
              console.log("Canvas clicked directly");
              // Get game state
              const { hasInteracted, isControlsLocked } = useGameControls.getState();
              const { shootBullet } = usePlayer.getState();
              
              // Attempt direct shot if pointer is locked
              if (document.pointerLockElement && hasInteracted && isControlsLocked) {
                console.log("Direct shooting attempt from Canvas click");
                shootBullet();
              }
              
              // Try to lock pointer if not already locked
              if (!document.pointerLockElement) {
                try {
                  e.currentTarget.requestPointerLock();
                } catch (err) {
                  console.error("Pointer lock failed:", err);
                }
              }
            }}
          >
            <color attach="background" args={["#87CEEB"]} />
            <Suspense fallback={null}>
              <Game username={username} />
            </Suspense>
          </Canvas>
          <GameStartOverlay />
          <UI />
          <AudioManager />
          

        </KeyboardControls>
      )}
      <a target="_blank" href="https://jam.pieter.com" style={{fontFamily: 'system-ui, sans-serif', position: 'fixed', bottom: '-1px', right: '-1px', padding: '7px', fontSize: '14px', fontWeight: 'bold', background: '#fff', color: '#000', textDecoration: 'none', zIndex: 10000, borderTopLeftRadius: '12px', border: '1px solid #fff'}}>🕹️ Vibe Jam 2025</a>
    </>
  );
}

export default App;
