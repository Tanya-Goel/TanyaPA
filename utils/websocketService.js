// utils/websocketService.js - WebSocket service for real-time notifications
import { WebSocketServer } from 'ws';
import reminderMonitor from './reminderMonitor.js';

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map();
  }

  // Initialize WebSocket server
  initialize(server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    });

    // Set up keep-alive mechanism
    this.keepAliveInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          console.log('📱 Terminating dead WebSocket connection');
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // Check every 30 seconds

    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      this.clients.set(clientId, ws);
      ws.isAlive = true;
      
      console.log(`📱 WebSocket client connected: ${clientId}`);
      
      // Add to reminder monitor for notifications
      reminderMonitor.addNotificationClient(clientId, ws);
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connected to Personal Assistant API',
        clientId: clientId,
        timestamp: new Date().toISOString()
      }));

      // Handle messages from client
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(clientId, data);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        console.log(`📱 WebSocket client disconnected: ${clientId}`);
        this.clients.delete(clientId);
        reminderMonitor.removeNotificationClient(clientId);
      });

      // Handle pong responses for keep-alive
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`❌ WebSocket error for client ${clientId}:`, error);
        this.clients.delete(clientId);
        reminderMonitor.removeNotificationClient(clientId);
      });
    });

    console.log('🔌 WebSocket server initialized on /ws');
  }

  // Handle messages from clients
  handleClientMessage(clientId, data) {
    const ws = this.clients.get(clientId);
    if (!ws) return;

    switch (data.type) {
      case 'ping':
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString()
        }));
        break;
      
      case 'get_status':
        ws.send(JSON.stringify({
          type: 'status',
          data: {
            reminderMonitor: reminderMonitor.getStatus(),
            connectedClients: this.clients.size,
            serverTime: new Date().toISOString()
          }
        }));
        break;
      
      case 'manual_check':
        reminderMonitor.manualCheck();
        ws.send(JSON.stringify({
          type: 'manual_check_triggered',
          message: 'Manual reminder check initiated'
        }));
        break;
      
      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: `Unknown message type: ${data.type}`
        }));
    }
  }

  // Generate unique client ID
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Broadcast message to all connected clients
  broadcast(message) {
    const messageData = JSON.stringify(message);
    this.clients.forEach((ws, clientId) => {
      try {
        if (ws.readyState === 1) { // WebSocket open
          ws.send(messageData);
        } else {
          this.clients.delete(clientId);
        }
      } catch (error) {
        console.error(`❌ Error broadcasting to client ${clientId}:`, error);
        this.clients.delete(clientId);
      }
    });
  }

  // Get connection status
  getStatus() {
    return {
      isRunning: this.wss !== null,
      connectedClients: this.clients.size,
      clients: Array.from(this.clients.keys())
    };
  }

  // Close WebSocket server
  close() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }
    if (this.wss) {
      this.wss.close();
      this.wss = null;
      this.clients.clear();
      console.log('🔌 WebSocket server closed');
    }
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;
