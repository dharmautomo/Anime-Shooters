import React, { useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { nanoid } from 'nanoid';
import Bullet from './Bullet';
import BulletImpact from './BulletImpact';

interface BulletData {
  id: string;
  position: THREE.Vector3;
  direction: THREE.Vector3;
  createdAt: number;
}

interface ImpactData {
  id: string;
  position: THREE.Vector3;
  normal: THREE.Vector3;
  type: 'ground' | 'wall' | 'player';
  createdAt: number;
}

interface BulletManagerProps {
  bulletLifetime?: number;
  impactLifetime?: number;
}

// Create a component to manage all bullets and impacts
const BulletManager: React.FC<BulletManagerProps> = ({
  bulletLifetime = 1.5,
  impactLifetime = 1.0
}) => {
  // State to track active bullets and impacts
  const [bullets, setBullets] = useState<BulletData[]>([]);
  const [impacts, setImpacts] = useState<ImpactData[]>([]);
  
  // Method to add a new bullet to the scene
  const addBullet = (position: THREE.Vector3, direction: THREE.Vector3) => {
    const newBullet: BulletData = {
      id: nanoid(),
      position: position.clone(),
      direction: direction.clone().normalize(),
      createdAt: Date.now()
    };
    
    setBullets(prev => [...prev, newBullet]);
    return newBullet.id; // Return ID so caller can track this bullet if needed
  };
  
  // Method to handle bullet impacts
  const handleBulletImpact = (bulletId: string, position: THREE.Vector3, normal: THREE.Vector3, type: 'ground' | 'wall' | 'player' = 'ground') => {
    // Remove the bullet
    setBullets(prev => prev.filter(b => b.id !== bulletId));
    
    // Add an impact effect
    const newImpact: ImpactData = {
      id: nanoid(),
      position: position.clone(),
      normal: normal.clone().normalize(),
      type,
      createdAt: Date.now()
    };
    
    setImpacts(prev => [...prev, newImpact]);
    
    // Return the impact ID
    return newImpact.id;
  };
  
  // Clean up old bullets and impacts periodically
  useFrame(() => {
    const now = Date.now();
    
    // Clean up expired bullets
    setBullets(prev => prev.filter(bullet => {
      const age = (now - bullet.createdAt) / 1000;
      return age < bulletLifetime;
    }));
    
    // Clean up expired impacts
    setImpacts(prev => prev.filter(impact => {
      const age = (now - impact.createdAt) / 1000;
      return age < impactLifetime;
    }));
  });
  
  // Expose methods to the global window object for easy access
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).bulletManager = {
        addBullet,
        handleBulletImpact
      };
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).bulletManager;
      }
    };
  }, []);
  
  return (
    <group>
      {/* Render all active bullets */}
      {bullets.map(bullet => (
        <Bullet
          key={bullet.id}
          position={bullet.position}
          direction={bullet.direction}
          lifetime={bulletLifetime}
          onHit={(position, normal) => handleBulletImpact(bullet.id, position, normal)}
        />
      ))}
      
      {/* Render all active impacts */}
      {impacts.map(impact => (
        <BulletImpact
          key={impact.id}
          position={impact.position}
          normal={impact.normal}
          type={impact.type}
          lifetime={impactLifetime}
        />
      ))}
    </group>
  );
};

export default BulletManager;