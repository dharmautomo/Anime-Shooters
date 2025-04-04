import { create } from "zustand";
import * as THREE from 'three';

interface AudioState {
  backgroundMusic: HTMLAudioElement | null;
  hitSound: HTMLAudioElement | null;
  successSound: HTMLAudioElement | null;
  isMuted: boolean;
  
  // Setter functions
  setBackgroundMusic: (music: HTMLAudioElement) => void;
  setHitSound: (sound: HTMLAudioElement) => void;
  setSuccessSound: (sound: HTMLAudioElement) => void;
  setSoundFunction: (fn: any) => void;
  
  // Control functions
  toggleMute: () => void;
  playHit: () => void;
  playSuccess: () => void;
  
  // Additional functions for positional audio
  createPositionalSound: (
    url: string, 
    position: THREE.Vector3, 
    volume?: number
  ) => THREE.PositionalAudio | null;
}

export const useAudio = create<AudioState>((set, get) => ({
  backgroundMusic: null,
  hitSound: null,
  successSound: null,
  isMuted: false, // Start with audio enabled
  
  setBackgroundMusic: (music) => set({ backgroundMusic: music }),
  setHitSound: (sound) => set({ hitSound: sound }),
  setSuccessSound: (sound) => set({ successSound: sound }),
  setSoundFunction: () => {
    // Empty function - no sound functions needed
  },
  
  toggleMute: () => {
    const { isMuted } = get();
    const newMutedState = !isMuted;
    
    // Just update the muted state
    set({ isMuted: newMutedState });
    
    // Log the change
    console.log(`Sound ${newMutedState ? 'muted' : 'unmuted'}`);
  },
  
  playHit: () => {
    // No hit sound needed
  },
  
  playSuccess: () => {
    // No success sound needed
  },
  
  // Create positional audio for 3D sound effects
  createPositionalSound: (url, position, volume = 1.0) => {
    try {
      // Try to access the audio listener from the scene
      const canvas = document.querySelector('canvas');
      const listenerObject = canvas && (canvas as any)?.__r3f?.root?.camera;
      
      if (!listenerObject) {
        console.warn("No audio listener found in the scene");
        return null;
      }
      
      // Create an audio listener if it doesn't exist
      if (!listenerObject.children.find((child: any) => child instanceof THREE.AudioListener)) {
        const listener = new THREE.AudioListener();
        listenerObject.add(listener);
      }
      
      const listener = listenerObject.children.find(
        (child: any) => child instanceof THREE.AudioListener
      ) as THREE.AudioListener;
      
      // Create a positional audio source
      const sound = new THREE.PositionalAudio(listener);
      
      // Load a sound and set it as the PositionalAudio object's buffer
      const audioLoader = new THREE.AudioLoader();
      
      audioLoader.load(url, (buffer) => {
        sound.setBuffer(buffer);
        sound.setRefDistance(5);
        sound.setVolume(volume);
        sound.setLoop(false);
        
        // Position the sound in 3D space
        sound.position.copy(position);
        
        // Log success
        console.log("Positional sound loaded:", url);
      });
      
      return sound;
    } catch (error) {
      console.error("Error creating positional sound:", error);
      return null;
    }
  }
}));