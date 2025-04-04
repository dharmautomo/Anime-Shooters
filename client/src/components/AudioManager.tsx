import { useEffect, useRef } from 'react';
import { useAudio } from '../lib/stores/useAudio';

// Create audio context for better sound handling
let audioContext: AudioContext | null = null;

const AudioManager = () => {
  const { setBackgroundMusic, setHitSound, setSuccessSound, setSoundFunction } = useAudio();
  const isSetup = useRef(false);
  
  useEffect(() => {
    if (isSetup.current) return;
    isSetup.current = true;
    
    // Initialize Web Audio API
    try {
      // Create audio context for better browser support
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      console.log('Web Audio API initialized for direct sound playback');
    } catch (err) {
      console.error('Audio context setup failed:', err);
    }
    
    // Load traditional audio elements as backup
    const loadSounds = async () => {
      // Ambient background sound
      const ambientSound = new Audio('https://cdn.freesound.org/previews/398/398143_1619270-lq.mp3');
      ambientSound.volume = 0.2;
      ambientSound.loop = true;
      
      // Pre-load sounds
      ambientSound.load();
      
      // Set the sounds in the store
      setHitSound(new Audio());
      setSuccessSound(new Audio());
      setBackgroundMusic(ambientSound);
      
      console.log('All sound effects loaded');
    };
    
    loadSounds();
  }, [setBackgroundMusic, setHitSound, setSuccessSound, setSoundFunction]);
  
  // Create interaction hook for unlocking audio
  useEffect(() => {
    const unlockAudio = () => {
      if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
        console.log('Audio context resumed on user interaction');
      }
    };
    
    // Unlock audio on any user interaction
    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
    
    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, []);
  
  return null;
};

export default AudioManager;