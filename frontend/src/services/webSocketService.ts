import { Message, Conversation } from '@/types';

export interface WebSocketMessage {
  type: 'message' | 'message_read' | 'typing' | 'user_online' | 'user_offline' | 'conversation_updated';
  data: any;
  timestamp: string;
}

export interface TypingIndicator {
  conversationId: number;
  userId: number;
  isTyping: boolean;
}

export interface UserOnlineStatus {
  userId: number;
  isOnline: boolean;
  lastSeen?: string;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000; // Start with 1 second
  private maxReconnectInterval = 30000; // Max 30 seconds
  private isConnecting = false;
  private token: string | null = null;
  private listeners: { [key: string]: Function[] } = {};

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting) {
        reject(new Error('Already connecting'));
        return;
      }

      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.isConnecting = true;
      this.token = token;

      const wsUrl = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:5002/ws';
      
      try {
        this.ws = new WebSocket(`${wsUrl}?token=${token}`);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.reconnectInterval = 1000;
          this.emit('connected', true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnecting = false;
          this.emit('connected', false);
          
          // Attempt to reconnect if not manually closed
          if (event.code !== 1000 && this.token) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.token = null;
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts || !this.token) {
      console.log('Max reconnect attempts reached or no token');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectInterval
    );

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.token) {
        this.connect(this.token).catch((error) => {
          console.error('Reconnection failed:', error);
        });
      }
    }, delay);
  }

  private handleMessage(message: WebSocketMessage): void {
    console.log('Received WebSocket message:', message.type);

    switch (message.type) {
      case 'message':
        this.emit('newMessage', message.data as Message);
        break;
      case 'message_read':
        this.emit('messageRead', message.data);
        break;
      case 'typing':
        this.emit('typingIndicator', message.data as TypingIndicator);
        break;
      case 'user_online':
      case 'user_offline':
        this.emit('userOnlineStatus', message.data as UserOnlineStatus);
        break;
      case 'conversation_updated':
        this.emit('conversationUpdated', message.data as Conversation);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  // Send message through WebSocket
  sendMessage(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket not connected');
    }
  }

  // Send typing indicator
  sendTyping(conversationId: number, isTyping: boolean): void {
    this.sendMessage({
      type: 'typing',
      data: {
        conversationId,
        isTyping,
      },
    });
  }

  // Mark message as read
  markAsRead(conversationId: number, messageId: number): void {
    this.sendMessage({
      type: 'mark_read',
      data: {
        conversationId,
        messageId,
      },
    });
  }

  // Join conversation room
  joinConversation(conversationId: number): void {
    this.sendMessage({
      type: 'join_conversation',
      data: {
        conversationId,
      },
    });
  }

  // Leave conversation room
  leaveConversation(conversationId: number): void {
    this.sendMessage({
      type: 'leave_conversation',
      data: {
        conversationId,
      },
    });
  }

  // Event listener management
  on(event: string, callback: Function): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Function): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  private emit(event: string, data: any): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in WebSocket event callback:', error);
        }
      });
    }
  }

  // Get connection status
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Get current connection state
  getReadyState(): number | null {
    return this.ws?.readyState || null;
  }
}

export const webSocketService = new WebSocketService();
