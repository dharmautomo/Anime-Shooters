import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useEffect } from "react";
import { KeyboardControls } from "@react-three/drei";
import Game from "./components/Game";
import Login from "./components/Login";
import { usePlayer } from "./lib/stores/usePlayer";
import { useMultiplayer } from "./lib/stores/useMultiplayer";
import AudioManager from "./components/AudioManager";
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

// Main App component
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const { initializeSocket } = useMultiplayer();
  const { setPlayerName } = usePlayer();

  // Handle login
  const handleLogin = (name: string) => {
    if (name.trim()) {
      setUsername(name);
      setPlayerName(name);
      setIsLoggedIn(true);
      initializeSocket(name);
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
          >
            <color attach="background" args={["#87CEEB"]} />
            <Suspense fallback={null}>
              <Game username={username} />
            </Suspense>
          </Canvas>
          <AudioManager />
        </KeyboardControls>
      )}
    </>
  );
}

export default App;
