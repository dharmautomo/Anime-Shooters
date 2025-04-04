import { PlayerData } from '../shared/types';

export class GameState {
  private players: Record<string, PlayerData>;
  
  constructor() {
    this.players = {};
  }
  
  // Player methods
  
  public addPlayer(playerData: PlayerData): void {
    this.players[playerData.id] = playerData;
  }
  
  public removePlayer(playerId: string): void {
    delete this.players[playerId];
  }
  
  public updatePlayer(
    playerId: string, 
    data: { 
      position: { x: number, y: number, z: number }, 
      rotation: number,
      health?: number,
      username?: string
    }
  ): void {
    if (this.players[playerId]) {
      this.players[playerId].position = data.position;
      this.players[playerId].rotation = data.rotation;
      
      if (data.health !== undefined) {
        this.players[playerId].health = data.health;
      }
      
      if (data.username !== undefined) {
        this.players[playerId].username = data.username;
      }
    }
  }
  
  public getPlayers(): Record<string, PlayerData> {
    return this.players;
  }
  
  public getPlayer(playerId: string): PlayerData | undefined {
    return this.players[playerId];
  }
  
  public getPlayerUsername(playerId: string): string {
    return this.players[playerId]?.username || 'Unknown';
  }
  
  public damagePlayer(playerId: string, damage: number): boolean {
    const player = this.players[playerId];
    
    if (player) {
      player.health = Math.max(0, player.health - damage);
      
      // Return true if player was killed
      return player.health <= 0;
    }
    
    return false;
  }
  
  public respawnPlayer(playerId: string): void {
    const player = this.players[playerId];
    
    if (player) {
      // Generate random position for respawn
      const randomX = (Math.random() - 0.5) * 40;
      const randomZ = (Math.random() - 0.5) * 40;
      
      player.position = { x: randomX, y: 1.6, z: randomZ };
      player.health = 100;
    }
  }
}