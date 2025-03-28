import { useEffect } from 'react';
import { useAudio } from '../lib/stores/useAudio';

const AudioManager = () => {
  const { setBackgroundMusic, setHitSound, setSuccessSound } = useAudio();
  
  useEffect(() => {
    // Load sound effects
    const loadSounds = async () => {
      // Gunshot sound (for shooting)
      const gunshotSound = new Audio('https://cdn.freesound.org/previews/522/522122_6142149-lq.mp3');
      gunshotSound.volume = 0.3;
      
      // Reload sound
      const reloadSound = new Audio('https://cdn.freesound.org/previews/258/258113_4772965-lq.mp3');
      reloadSound.volume = 0.4;
      
      // Hit sound (for when a player gets hit)
      const hitSound = new Audio('https://cdn.freesound.org/previews/131/131142_2337290-lq.mp3');
      hitSound.volume = 0.5;
      
      // Death sound
      const deathSound = new Audio('https://cdn.freesound.org/previews/575/575385_6128004-lq.mp3');
      deathSound.volume = 0.6;
      
      // Empty gun sound
      const emptySound = new Audio('https://cdn.freesound.org/previews/416/416179_777645-lq.mp3');
      emptySound.volume = 0.3;
      
      // Ambient background sound
      const ambientSound = new Audio('https://cdn.freesound.org/previews/398/398143_1619270-lq.mp3');
      ambientSound.volume = 0.2;
      ambientSound.loop = true;
      
      // Set the sounds in the store
      setHitSound(gunshotSound);
      setSuccessSound(reloadSound);
      setBackgroundMusic(ambientSound);
      
      // Preload other sounds
      hitSound.load();
      deathSound.load();
      emptySound.load();
      
      console.log('All sound effects loaded');
    };
    
    loadSounds();
  }, [setBackgroundMusic, setHitSound, setSuccessSound]);
  
  return null;
};

export default AudioManager;
