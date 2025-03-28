import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { SocketManager } from "./socketManager";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Initialize Socket.io manager
  const socketManager = new SocketManager(httpServer);
  
  // API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  
  return httpServer;
}
