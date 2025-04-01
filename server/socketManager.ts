import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { GameState } from './gameState';
import { PlayerData, BulletData } from '../shared/types';

export class SocketManager {
  private io: Server;
  private gameState: GameState;
  
  constructor(server: HttpServer) {
    this.io = new Server(server);
    this.gameState = new GameState();
    
    this.setupSocketHandlers();
  }
  
  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Player connected: ${socket.id}`);
      
      // Handle player joining the game
      socket.on('joinGame', (playerData: PlayerData) => {
        console.log(`Player joined: ${playerData.username}`);
        
        // Add player to game state
        this.gameState.addPlayer(playerData);
        
        // Notify other players about the new player
        socket.broadcast.emit('playerJoined', playerData);
        
        // Send existing players data to the new player
        socket.emit('existingPlayers', this.gameState.getPlayers());
      });
      
      // Handle player updates (position, rotation, health, username)
      socket.on('updatePlayer', (data: { 
        position: { x: number, y: number, z: number }, 
        rotation: number,
        health: number,
        username?: string
      }) => {
        // Update player in game state
        this.gameState.updatePlayer(socket.id, {
          position: data.position,
          rotation: data.rotation,
          health: data.health,
          username: data.username
        });
        
        // Broadcast updated player data to others
        socket.broadcast.emit('playerUpdated', {
          id: socket.id,
          position: data.position,
          rotation: data.rotation,
          health: data.health,
          username: data.username || this.gameState.getPlayerUsername(socket.id)
        });
      });
      
      // Handle bullet creation
      socket.on('createBullet', (bulletData: BulletData) => {
        // Add bullet to game state
        this.gameState.addBullet(bulletData);
        
        // Broadcast bullet creation to all players (including sender)
        this.io.emit('bulletCreated', bulletData);
      });
      
      // Handle bullet removal
      socket.on('removeBullet', (bulletId: string) => {
        // Remove bullet from game state
        this.gameState.removeBullet(bulletId);
        
        // Broadcast bullet removal to all players
        this.io.emit('bulletRemoved', bulletId);
      });
      
      // Handle player hits
      socket.on('hitPlayer', (data: { 
        playerId: string, 
        damage: number,
        shooterId: string
      }) => {
        const { playerId, damage, shooterId } = data;
        
        console.log(`Hit event received: Player ${playerId} hit by ${shooterId} for ${damage} damage`);
        
        // Get the player before the damage
        const playerBefore = this.gameState.getPlayer(playerId);
        if (!playerBefore) {
          console.log(`Player ${playerId} not found in game state`);
          return;
        }
        
        console.log(`Player ${playerId} health before: ${playerBefore.health}`);
        
        // Update player health in game state
        const playerKilled = this.gameState.damagePlayer(playerId, damage);
        
        // Get updated player data
        const playerAfter = this.gameState.getPlayer(playerId);
        console.log(`Player ${playerId} health after: ${playerAfter?.health}`);
        
        // Notify the hit player
        this.io.to(playerId).emit('playerHit', { playerId, damage });
        
        // Broadcast player update to all clients to ensure health synchronization
        if (playerAfter) {
          console.log(`Broadcasting player update for ${playerId} with health ${playerAfter.health}`);
          this.io.emit('playerUpdated', playerAfter);
        }
        
        // If player was killed
        if (playerKilled) {
          console.log(`Player ${playerId} was killed by ${shooterId}`);
          
          // Broadcast kill to all players
          this.io.emit('playerKilled', {
            killer: shooterId,
            victim: playerId
          });
          
          // Respawn player after delay
          setTimeout(() => {
            console.log(`Respawning player ${playerId}`);
            this.gameState.respawnPlayer(playerId);
            
            // Notify about respawn
            const respawnedPlayer = this.gameState.getPlayer(playerId);
            if (respawnedPlayer) {
              console.log(`Broadcasting respawn for player ${playerId} with health ${respawnedPlayer.health}`);
              this.io.emit('playerUpdated', respawnedPlayer);
            }
          }, 3000);
        }
      });
      
      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        
        // Remove player from game state
        this.gameState.removePlayer(socket.id);
        
        // Notify other players
        socket.broadcast.emit('playerLeft', socket.id);
      });
    });
  }
}
