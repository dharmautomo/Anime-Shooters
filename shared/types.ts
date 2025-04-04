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

// Kill feed item structure
export interface KillFeedItem {
  killer: string;
  victim: string;
}