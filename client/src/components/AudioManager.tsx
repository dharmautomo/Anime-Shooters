import { useEffect, useRef } from 'react';
import { useAudio } from '../lib/stores/useAudio';

// Create audio context for better sound handling
let audioContext: AudioContext | null = null;

// Functions to generate and play sound with Web Audio API
const createGunshot = (context: AudioContext) => {
  // Create oscillator for basic tone
  const osc = context.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(80, context.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, context.currentTime + 0.1);
  
  // Create noise for the blast
  const noise = context.createBufferSource();
  const bufferSize = context.sampleRate * 0.1; // 100ms
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const data = buffer.getChannelData(0);
  
  // Fill with noise
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  noise.buffer = buffer;
  
  // Create filter for the noise
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2000, context.currentTime);
  filter.frequency.exponentialRampToValueAtTime(500, context.currentTime + 0.1);
  
  // Create amplitude envelopes
  const oscGain = context.createGain();
  oscGain.gain.setValueAtTime(0.3, context.currentTime);
  oscGain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2);
  
  const noiseGain = context.createGain();
  noiseGain.gain.setValueAtTime(0.2, context.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
  
  // Connect everything
  osc.connect(oscGain);
  noise.connect(filter);
  filter.connect(noiseGain);
  
  oscGain.connect(context.destination);
  noiseGain.connect(context.destination);
  
  // Start and stop
  osc.start(context.currentTime);
  noise.start(context.currentTime);
  
  osc.stop(context.currentTime + 0.2);
  noise.stop(context.currentTime + 0.2);
  
  console.log("GUNSHOT SOUND PLAYED DIRECTLY");
  
  return { osc, noise };
};

// Function to create a mechanical reload sound
const createReload = (context: AudioContext) => {
  // Create multiple short sounds for the reload sequence
  
  // First click (slide back)
  const click1 = context.createOscillator();
  click1.type = "square";
  click1.frequency.setValueAtTime(120, context.currentTime);
  
  const click1Gain = context.createGain();
  click1Gain.gain.setValueAtTime(0.03, context.currentTime);
  click1Gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.08);
  
  click1.connect(click1Gain);
  click1Gain.connect(context.destination);
  
  // Second metallic sound (mag removed)
  const metallic = context.createOscillator();
  metallic.type = "sawtooth";
  metallic.frequency.setValueAtTime(200, context.currentTime + 0.1);
  metallic.frequency.exponentialRampToValueAtTime(180, context.currentTime + 0.2);
  
  const metallicGain = context.createGain();
  metallicGain.gain.setValueAtTime(0.05, context.currentTime + 0.1);
  metallicGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);
  
  // Filter for metallic sound
  const metallicFilter = context.createBiquadFilter();
  metallicFilter.type = "bandpass";
  metallicFilter.frequency.value = 500;
  metallicFilter.Q.value = 5;
  
  metallic.connect(metallicFilter);
  metallicFilter.connect(metallicGain);
  metallicGain.connect(context.destination);
  
  // Third click (slide forward)
  const click2 = context.createOscillator();
  click2.type = "square";
  click2.frequency.setValueAtTime(150, context.currentTime + 0.3);
  
  const click2Gain = context.createGain();
  click2Gain.gain.setValueAtTime(0.05, context.currentTime + 0.3);
  click2Gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.4);
  
  click2.connect(click2Gain);
  click2Gain.connect(context.destination);
  
  // Start and stop all sounds with appropriate timing
  click1.start(context.currentTime);
  click1.stop(context.currentTime + 0.1);
  
  metallic.start(context.currentTime + 0.1);
  metallic.stop(context.currentTime + 0.3);
  
  click2.start(context.currentTime + 0.3);
  click2.stop(context.currentTime + 0.4);
  
  console.log("RELOAD SOUND PLAYED DIRECTLY");
  
  return { click1, metallic, click2 };
};

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
      
      // Set direct sound function in store
      setSoundFunction((type: 'gunshot' | 'reload') => {
        // Initialize context if needed (for autoplay restrictions)
        if (audioContext?.state === 'suspended') {
          audioContext.resume();
        }
        
        if (!audioContext) return;
        
        // Play the appropriate sound based on type
        if (type === 'gunshot') {
          createGunshot(audioContext);
        } else if (type === 'reload') {
          createReload(audioContext);
        }
      });
      
      console.log('Web Audio API initialized for direct sound playback');
    } catch (err) {
      console.error('Audio context setup failed:', err);
    }
    
    // Load traditional audio elements as backup
    const loadSounds = async () => {
      // Gunshot sound (for shooting)
      const gunshotSound = new Audio('https://cdn.freesound.org/previews/522/522122_6142149-lq.mp3');
      gunshotSound.volume = 0.5;
      
      // Reload sound
      const reloadSound = new Audio('https://cdn.freesound.org/previews/258/258113_4772965-lq.mp3');
      reloadSound.volume = 0.4;
      
      // Ambient background sound
      const ambientSound = new Audio('https://cdn.freesound.org/previews/398/398143_1619270-lq.mp3');
      ambientSound.volume = 0.2;
      ambientSound.loop = true;
      
      // Pre-load all sounds to ensure they're ready for playback
      gunshotSound.load();
      reloadSound.load();
      ambientSound.load();
      
      // Set the sounds in the store
      setHitSound(gunshotSound);
      setSuccessSound(reloadSound);
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
