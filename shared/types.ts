// Player data structure
export interface PlayerData {
  id: string;
  username: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: number;
  health: number;
}

// Bullet data structure
export interface BulletData {
  id: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  velocity: {
    x: number;
    y: number;
    z: number;
  };
  owner: string;
}

// Kill feed item structure
export interface KillFeedItem {
  killer: string;
  victim: string;
}
