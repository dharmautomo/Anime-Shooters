import { useState, useEffect } from 'react';

/**
 * Detect if the user is on a mobile device - uses both screen size and user agent
 * This helps optimize rendering for mobile devices
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  useEffect(() => {
    // Check screen size
    const checkMobile = () => {
      const screenTest = window.innerWidth <= 768;
      
      // Check user agent
      const userAgentTest = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      
      setIsMobile(screenTest || userAgentTest);
    };
    
    // Check on initial load
    checkMobile();
    
    // Check on resize
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  return isMobile;
}

/**
 * Returns performance settings based on device capabilities
 * Helps optimize the game for mobile devices
 */
export function usePerformanceSettings() {
  const isMobile = useIsMobile();
  
  return {
    maxBullets: isMobile ? 15 : 50,
    maxParticles: isMobile ? 20 : 100,
    shadowQuality: isMobile ? 'low' : 'high',
    renderDistance: isMobile ? 50 : 100,
    enablePostProcessing: !isMobile
  };
}