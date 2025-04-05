import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { GameState } from './gameState';
import { PlayerData } from '../shared/types';

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
      
      // Handle player damage and respawn events
      socket.on('playerHit', (data: { playerId: string, damage: number }) => {
        console.log(`Hit request received: Player ${socket.id} hit ${data.playerId} for ${data.damage} damage`);
        
        // Get target player
        const targetPlayer = this.gameState.getPlayer(data.playerId);
        if (!targetPlayer) {
          console.error(`Player ${data.playerId} not found in game state`);
          return;
        }
        
        // Apply damage to the player
        const wasKilled = this.gameState.damagePlayer(data.playerId, data.damage);
        
        // Broadcast the hit to all clients so they can update UI
        this.io.emit('playerHit', {
          playerId: data.playerId,
          damage: data.damage
        });
        
        // If player was killed, broadcast kill event
        if (wasKilled) {
          console.log(`Player ${data.playerId} was killed by ${socket.id}`);
          
          // Get usernames for kill feed
          const killerName = this.gameState.getPlayerUsername(socket.id);
          const victimName = this.gameState.getPlayerUsername(data.playerId);
          
          // Broadcast kill event
          this.io.emit('playerKilled', {
            killer: killerName,
            victim: victimName,
            killerId: socket.id,
            victimId: data.playerId
          });
        }
      });
      
      // Handle player respawn request
      socket.on('playerRespawn', () => {
        console.log(`Player ${socket.id} requested respawn`);
        
        // Get current player data
        const player = this.gameState.getPlayer(socket.id);
        if (!player) {
          console.error(`Player ${socket.id} not found in game state during respawn request`);
          return;
        }
        
        // Respawn the player (this will set health to 100 and randomize position)
        this.gameState.respawnPlayer(socket.id);
        
        // Get updated player data
        const updatedPlayer = this.gameState.getPlayer(socket.id);
        
        if (updatedPlayer) {
          console.log(`Player ${socket.id} respawned with health ${updatedPlayer.health} at position:`, updatedPlayer.position);
          
          // Broadcast the respawned player to all clients
          this.io.emit('playerUpdated', updatedPlayer);
          
          // Also send a direct message to the player that just respawned to let them know
          // where they've been placed
          socket.emit('playerRespawned', {
            position: updatedPlayer.position,
            health: updatedPlayer.health
          });
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