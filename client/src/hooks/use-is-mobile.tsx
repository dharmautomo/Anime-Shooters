import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * Detect if the user is on a mobile device - uses both screen size and user agent
 * This helps optimize rendering for mobile devices
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)
  
  React.useEffect(() => {
    // Detect mobile based on screen size
    const checkMobile = () => {
      const byScreenSize = window.innerWidth < MOBILE_BREAKPOINT;
      
      // Also check user agent for mobile devices
      const byUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      
      // Consider it mobile if either condition is true
      setIsMobile(byScreenSize || byUserAgent);
    };
    
    // Check initially
    checkMobile();
    
    // Listen for screen size changes
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    mql.addEventListener("change", checkMobile)
    
    // Also listen for orientation changes (common on mobile)
    window.addEventListener('orientationchange', checkMobile);
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => {
      mql.removeEventListener("change", checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
      window.removeEventListener('resize', checkMobile);
    }
  }, [])

  return !!isMobile
}

/**
 * Returns performance settings based on device capabilities
 * Helps optimize the game for mobile devices
 */
export function usePerformanceSettings() {
  const isMobile = useIsMobile();
  
  return React.useMemo(() => ({
    // Lower quality settings for mobile
    particleCount: isMobile ? 3 : 7,
    particleDetail: isMobile ? 6 : 10,
    shadowEnabled: !isMobile,
    drawDistance: isMobile ? 80 : 150,
    maxBullets: isMobile ? 10 : 20,
    textureQuality: isMobile ? 'low' : 'high'
  }), [isMobile]);
}
