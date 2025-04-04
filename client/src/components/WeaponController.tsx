import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { useWeapons, WeaponType } from '../lib/stores/useWeapons';
import { useGameControls } from '../lib/stores/useGameControls';
import { useIsMobile } from '../hooks/use-is-mobile';

const WeaponController = () => {
  const { 
    currentWeapon, 
    weapons, 
    switchWeapon, 
    shootBullet,
    reload 
  } = useWeapons();
  
  const { isControlsLocked } = useGameControls();
  const isMobile = useIsMobile();
  const isMouseDown = useRef(false);
  const lastShootTime = useRef(0);
  
  // Handle keyboard weapon switching
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isControlsLocked) return;
      
      // Number keys 1-3 for weapon switching
      switch (event.code) {
        case 'Digit1':
          switchWeapon(WeaponType.PISTOL);
          break;
        case 'Digit2':
          switchWeapon(WeaponType.RIFLE);
          break;
        case 'Digit3':
          switchWeapon(WeaponType.SHOTGUN);
          break;
        case 'KeyR':
          reload();
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isControlsLocked, switchWeapon, reload]);
  
  // Handle mouse events for shooting
  useEffect(() => {
    // Mouse down handler for shooting
    const handleMouseDown = (event: MouseEvent) => {
      if (!isControlsLocked || isMobile) return;
      
      // Left mouse button
      if (event.button === 0) {
        isMouseDown.current = true;
      }
    };
    
    // Mouse up handler
    const handleMouseUp = (event: MouseEvent) => {
      if (event.button === 0) {
        isMouseDown.current = false;
      }
    };
    
    // Add event listeners
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    // Setup mobile touch shoot button
    if (isMobile) {
      const setupShootButton = () => {
        // Create shoot button
        const shootBtn = document.createElement('div');
        shootBtn.id = 'mobile-shoot';
        shootBtn.innerText = '🔫';
        shootBtn.style.position = 'fixed';
        shootBtn.style.bottom = '20px';
        shootBtn.style.right = '20px';
        shootBtn.style.width = '60px';
        shootBtn.style.height = '60px';
        shootBtn.style.backgroundColor = 'rgba(255,0,0,0.4)';
        shootBtn.style.borderRadius = '30px';
        shootBtn.style.display = 'flex';
        shootBtn.style.justifyContent = 'center';
        shootBtn.style.alignItems = 'center';
        shootBtn.style.fontSize = '30px';
        shootBtn.style.zIndex = '1000';
        shootBtn.style.userSelect = 'none';
        shootBtn.style.touchAction = 'manipulation';
        
        // Create weapon switch button
        const weaponBtn = document.createElement('div');
        weaponBtn.id = 'mobile-weapon';
        weaponBtn.innerText = '🔄';
        weaponBtn.style.position = 'fixed';
        weaponBtn.style.bottom = '20px';
        weaponBtn.style.right = '90px';
        weaponBtn.style.width = '60px';
        weaponBtn.style.height = '60px';
        weaponBtn.style.backgroundColor = 'rgba(0,0,255,0.4)';
        weaponBtn.style.borderRadius = '30px';
        weaponBtn.style.display = 'flex';
        weaponBtn.style.justifyContent = 'center';
        weaponBtn.style.alignItems = 'center';
        weaponBtn.style.fontSize = '30px';
        weaponBtn.style.zIndex = '1000';
        weaponBtn.style.userSelect = 'none';
        weaponBtn.style.touchAction = 'manipulation';
        
        // Create reload button
        const reloadBtn = document.createElement('div');
        reloadBtn.id = 'mobile-reload';
        reloadBtn.innerText = '🔄';
        reloadBtn.style.position = 'fixed';
        reloadBtn.style.bottom = '90px';
        reloadBtn.style.right = '20px';
        reloadBtn.style.width = '60px';
        reloadBtn.style.height = '60px';
        reloadBtn.style.backgroundColor = 'rgba(0,255,0,0.4)';
        reloadBtn.style.borderRadius = '30px';
        reloadBtn.style.display = 'flex';
        reloadBtn.style.justifyContent = 'center';
        reloadBtn.style.alignItems = 'center';
        reloadBtn.style.fontSize = '24px';
        reloadBtn.style.zIndex = '1000';
        reloadBtn.style.userSelect = 'none';
        reloadBtn.style.touchAction = 'manipulation';
        
        // Shoot on touch
        shootBtn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          isMouseDown.current = true;
        });
        
        shootBtn.addEventListener('touchend', (e) => {
          e.preventDefault();
          isMouseDown.current = false;
        });
        
        // Cycle weapons on touch
        let currentWeaponIndex = 0;
        const weaponTypes = [WeaponType.PISTOL, WeaponType.RIFLE, WeaponType.SHOTGUN];
        
        weaponBtn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          currentWeaponIndex = (currentWeaponIndex + 1) % weaponTypes.length;
          switchWeapon(weaponTypes[currentWeaponIndex]);
        });
        
        // Reload on touch
        reloadBtn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          reload();
        });
        
        // Add buttons to document
        document.body.appendChild(shootBtn);
        document.body.appendChild(weaponBtn);
        document.body.appendChild(reloadBtn);
      };
      
      setupShootButton();
      
      return () => {
        // Clean up
        const shootBtn = document.getElementById('mobile-shoot');
        const weaponBtn = document.getElementById('mobile-weapon');
        const reloadBtn = document.getElementById('mobile-reload');
        
        if (shootBtn) document.body.removeChild(shootBtn);
        if (weaponBtn) document.body.removeChild(weaponBtn);
        if (reloadBtn) document.body.removeChild(reloadBtn);
      };
    }
    
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isControlsLocked, isMobile, switchWeapon, reload]);
  
  // Firing logic in the render loop
  useFrame((_, delta) => {
    if (!isControlsLocked) return;
    
    const weaponConfig = {
      [WeaponType.PISTOL]: { automatic: false, fireRate: 3 },
      [WeaponType.RIFLE]: { automatic: true, fireRate: 8 },
      [WeaponType.SHOTGUN]: { automatic: false, fireRate: 1 }
    };
    
    const now = performance.now();
    const timeSinceLastShot = now - lastShootTime.current;
    const minTimeBetweenShots = 1000 / weaponConfig[currentWeapon].fireRate;
    
    // Handle shooting based on weapon type
    if (isMouseDown.current && timeSinceLastShot >= minTimeBetweenShots) {
      // For automatic weapons, continuously fire when mouse is held down
      if (weaponConfig[currentWeapon].automatic || timeSinceLastShot >= minTimeBetweenShots * 2) {
        shootBullet();
        lastShootTime.current = now;
      }
    }
  });
  
  return null; // This is a controller component, it doesn't render anything
};

export default WeaponController;