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
      // Note: Weapon system has been removed, but we'll keep health/respawn mechanics for future use
      
      // Handle player respawn request
      socket.on('playerRespawn', (data: { position: { x: number, y: number, z: number } }) => {
        console.log(`Player ${socket.id} requested respawn at position:`, data.position);
        
        // Get current player data
        const player = this.gameState.getPlayer(socket.id);
        if (!player) {
          console.error(`Player ${socket.id} not found in game state during respawn request`);
          return;
        }
        
        // Update player in game state with respawn data
        this.gameState.updatePlayer(socket.id, {
          position: data.position,
          health: 100, // Reset health to full
          // Keep other properties unchanged
          rotation: player.rotation,
          username: player.username
        });
        
        // Get updated player data
        const updatedPlayer = this.gameState.getPlayer(socket.id);
        
        if (updatedPlayer) {
          console.log(`Player ${socket.id} respawned with health ${updatedPlayer.health}`);
          // Broadcast the respawned player to all clients
          this.io.emit('playerUpdated', updatedPlayer);
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