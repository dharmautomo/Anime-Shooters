import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useEffect } from "react";
import { KeyboardControls } from "@react-three/drei";
import Game from "./components/Game";
import Login from "./components/Login";
import { usePlayer } from "./lib/stores/usePlayer";
import { useMultiplayer } from "./lib/stores/useMultiplayer";
import AudioManager from "./components/AudioManager";
import UI from "./components/UI";
import GameStartOverlay from "./components/GameStartOverlay";
import "@fontsource/inter";

// Define control keys for the game
export enum Controls {
  forward = 'forward',
  backward = 'backward',
  left = 'left',
  right = 'right',
  jump = 'jump',
  shoot = 'shoot',
  reload = 'reload',
}

// Define key mappings
const keyMap = [
  { name: Controls.forward, keys: ['ArrowUp', 'KeyW'] },
  { name: Controls.backward, keys: ['ArrowDown', 'KeyS'] },
  { name: Controls.left, keys: ['ArrowLeft', 'KeyA'] },
  { name: Controls.right, keys: ['ArrowRight', 'KeyD'] },
  { name: Controls.jump, keys: ['Space'] },
  { name: Controls.shoot, keys: ['click'] },
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
            onClick={() => {
              console.log("Canvas clicked, attempting pointer lock");
              const canvas = document.querySelector('canvas');
              if (canvas && !document.pointerLockElement) {
                try {
                  canvas.requestPointerLock();
                } catch (e) {
                  console.error("Error in canvas click handler:", e);
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
