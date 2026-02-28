import { io, Socket } from 'socket.io-client';
import type { PriceUpdate, WebSocketMessage } from '@/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';

export type PriceUpdateCallback = (update: PriceUpdate) => void;

class WebSocketClient {
  private socket: Socket | null = null;
  private priceUpdateCallbacks: Set<PriceUpdateCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      this.socket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 10000); // Max 10s
        console.log(
          `Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
        );
      }
    });

    this.socket.on('price_update', (data: PriceUpdate) => {
      this.handlePriceUpdate(data);
    });

    this.socket.on('message', (message: WebSocketMessage) => {
      this.handleMessage(message);
    });
  }

  /**
   * Handle price update
   */
  private handlePriceUpdate(update: PriceUpdate): void {
    this.priceUpdateCallbacks.forEach((callback) => {
      try {
        callback(update);
      } catch (error) {
        console.error('Error in price update callback:', error);
      }
    });
  }

  /**
   * Handle generic WebSocket message
   */
  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'price_update':
        this.handlePriceUpdate(message.data);
        break;
      case 'trade':
        // Handle trade updates if needed
        break;
      case 'orderbook_update':
        // Handle orderbook updates if needed
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  /**
   * Subscribe to price updates
   */
  onPriceUpdate(callback: PriceUpdateCallback): () => void {
    this.priceUpdateCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.priceUpdateCallbacks.delete(callback);
    };
  }

  /**
   * Subscribe to market updates
   */
  subscribeToMarket(marketId: string): void {
    if (!this.socket?.connected) {
      console.warn('Cannot subscribe: WebSocket not connected');
      return;
    }

    this.socket.emit('subscribe_market', { marketId });
    console.log(`Subscribed to market: ${marketId}`);
  }

  /**
   * Unsubscribe from market updates
   */
  unsubscribeFromMarket(marketId: string): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('unsubscribe_market', { marketId });
    console.log(`Unsubscribed from market: ${marketId}`);
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.priceUpdateCallbacks.clear();
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get WebSocket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance
export const wsClient = new WebSocketClient();

// Export for use in hooks
export default wsClient;
