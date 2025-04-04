import * as THREE from 'three';

/**
 * Simple collision detection between two spheres
 */
export function checkCollision(
  position1: THREE.Vector3,
  radius1: number,
  position2: THREE.Vector3 | [number, number, number],
  radius2: number
): boolean {
  const pos2 = position2 instanceof THREE.Vector3 
    ? position2 
    : new THREE.Vector3(position2[0], position2[1], position2[2]);
  
  // Calculate distance between spheres
  const distance = position1.distanceTo(pos2);
  
  // If distance is less than sum of radii, they collide
  return distance < (radius1 + radius2);
}

/**
 * Check if position is within bounding box
 */
export function checkBoxCollision(
  position: THREE.Vector3,
  boxPosition: THREE.Vector3,
  boxSize: THREE.Vector3
): boolean {
  // Calculate box bounds
  const minX = boxPosition.x - boxSize.x / 2;
  const maxX = boxPosition.x + boxSize.x / 2;
  const minY = boxPosition.y - boxSize.y / 2;
  const maxY = boxPosition.y + boxSize.y / 2;
  const minZ = boxPosition.z - boxSize.z / 2;
  const maxZ = boxPosition.z + boxSize.z / 2;
  
  // Check if position is within bounds
  return (
    position.x >= minX && position.x <= maxX &&
    position.y >= minY && position.y <= maxY &&
    position.z >= minZ && position.z <= maxZ
  );
}

/**
 * Ray casting for collision detection
 */
export function rayCastCollision(
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  objects: THREE.Object3D[],
  maxDistance: number = 100
): THREE.Intersection | null {
  // Create raycaster
  const raycaster = new THREE.Raycaster(origin, direction.normalize(), 0, maxDistance);
  
  // Find intersections
  const intersects = raycaster.intersectObjects(objects);
  
  // Return closest intersection or null
  return intersects.length > 0 ? intersects[0] : null;
}
