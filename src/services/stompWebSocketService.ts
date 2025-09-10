import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { logInfo, logError, logWarn } from '../utils/logger';
import { Device, Status } from '../types';

interface StompWebSocketCallbacks {
  onDeviceStatusUpdate?: (deviceId: string, status: string, deviceName: string) => void;
  onDeviceCreated?: (device: Device) => void;
  onDeviceDeleted?: (deviceId: string, deviceName: string) => void;
  onConnectionStatusChange?: (connected: boolean) => void;
}

class StompWebSocketService {
  private client: Client | null = null;
  private isConnecting = false;
  private isConnected = false;
  private organizationId: string | null = null;
  private callbacks: StompWebSocketCallbacks = {};
  private subscriptions: Map<string, StompSubscription> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds
  private connectionTimeout: NodeJS.Timeout | null = null;

  setCallbacks(callbacks: StompWebSocketCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Connect to STOMP WebSocket server
   */
  async connect(organizationId: string): Promise<void> {
    if (this.isConnecting || this.isConnected) {
      logWarn('StompWebSocket', 'Already connecting or connected, skipping connection attempt');
      return;
    }

    this.isConnecting = true;
    this.organizationId = organizationId;

    try {
      // Get the backend URL from the API config
      const { getApiConfig } = await import('../config/api');
      const backendUrl = getApiConfig().BACKEND_BASE_URL;
      const wsUrl = backendUrl + '/ws';
      
      logInfo('StompWebSocket', 'Attempting to connect to STOMP WebSocket', { 
        wsUrl, 
        organizationId,
        currentOrigin: window.location.origin,
        userAgent: navigator.userAgent
      });
      
      // Create STOMP client with SockJS
      this.client = new Client({
        webSocketFactory: () => {
          try {
            // Ensure global is available for SockJS
            if (typeof global === 'undefined') {
              (window as any).global = globalThis;
            }
            
            return new SockJS(wsUrl, null, {
              transports: ['websocket', 'xhr-streaming', 'xhr-polling']
            });
          } catch (error) {
            logError('StompWebSocket', 'Failed to create SockJS connection', error);
            throw error;
          }
        },
        debug: (str) => {
          logInfo('StompWebSocket', 'STOMP Debug', { message: str });
        },
        reconnectDelay: this.reconnectDelay,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        connectHeaders: {
          'Accept-Encoding': 'gzip, deflate',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      });

      // Set up connection handlers
      this.client.onConnect = (frame) => {
        logInfo('StompWebSocket', 'STOMP WebSocket connected successfully', { 
          frame: frame.headers,
          organizationId 
        });
        
        this.isConnecting = false;
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Clear connection timeout
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        
        this.callbacks.onConnectionStatusChange?.(true);
        
        // Subscribe to device-related topics
        this.subscribeToDeviceTopics();
      };

      this.client.onStompError = (frame) => {
        logError('StompWebSocket', 'STOMP error occurred', new Error(`STOMP Error: ${frame.headers.message}`));
        logWarn('StompWebSocket', 'STOMP error details', {
          command: frame.command,
          headers: frame.headers,
          body: frame.body,
          organizationId
        });
        
        this.isConnecting = false;
        this.isConnected = false;
        this.callbacks.onConnectionStatusChange?.(false);
      };

      this.client.onWebSocketError = (error) => {
        logError('StompWebSocket', 'WebSocket error occurred', error instanceof Error ? error : new Error('WebSocket error'));
        logWarn('StompWebSocket', 'WebSocket error details', {
          error: error,
          organizationId,
          wsUrl,
          possibleCauses: [
            'CORS policy blocking WebSocket connection',
            'Backend WebSocket server not running',
            'Network/firewall blocking WebSocket connections',
            'Backend WebSocket endpoint not configured',
            'SockJS transport negotiation failed'
          ],
          troubleshooting: [
            'Check browser console for CORS errors',
            'Verify backend is running on correct port',
            'Check if WebSocket endpoint is accessible',
            'Try different SockJS transports'
          ]
        });
        
        this.isConnecting = false;
        this.isConnected = false;
        this.callbacks.onConnectionStatusChange?.(false);
        
        // Attempt reconnection
        this.scheduleReconnect();
      };

      this.client.onWebSocketClose = (event) => {
        logWarn('StompWebSocket', 'WebSocket connection closed', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          organizationId
        });
        
        this.isConnected = false;
        this.isConnecting = false;
        this.callbacks.onConnectionStatusChange?.(false);
        
        // Clear all subscriptions
        this.subscriptions.clear();
        
        // Attempt reconnection if not a clean close
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      // Set connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (this.isConnecting) {
          logWarn('StompWebSocket', 'Connection timeout, attempting to disconnect');
          this.disconnect();
        }
      }, 10000); // 10 second timeout

      // Activate the client
      this.client.activate();
      
    } catch (error) {
      logError('StompWebSocket', 'Failed to create STOMP WebSocket connection', error instanceof Error ? error : new Error('Unknown error'));
      this.isConnecting = false;
      this.callbacks.onConnectionStatusChange?.(false);
    }
  }

  /**
   * Subscribe to device-related topics
   */
  private subscribeToDeviceTopics() {
    if (!this.client || !this.organizationId) {
      logWarn('StompWebSocket', 'Cannot subscribe to topics - client or organizationId not available');
      return;
    }

    try {
      // Subscribe to general device status updates
      const statusSubscription = this.client.subscribe('/topic/devices/status', (message: IMessage) => {
        this.handleDeviceStatusUpdate(message);
      });
      this.subscriptions.set('device-status', statusSubscription);
      logInfo('StompWebSocket', 'Subscribed to device status updates');

      // Subscribe to organization-specific device updates
      const orgStatusSubscription = this.client.subscribe(`/topic/organization/${this.organizationId}/devices/status`, (message: IMessage) => {
        this.handleDeviceStatusUpdate(message);
      });
      this.subscriptions.set('org-device-status', orgStatusSubscription);
      logInfo('StompWebSocket', 'Subscribed to organization device status updates', { organizationId: this.organizationId });

      // Subscribe to device creation notifications
      const deviceCreatedSubscription = this.client.subscribe(`/topic/organization/${this.organizationId}/devices/created`, (message: IMessage) => {
        this.handleDeviceCreated(message);
      });
      this.subscriptions.set('device-created', deviceCreatedSubscription);
      logInfo('StompWebSocket', 'Subscribed to device creation notifications', { organizationId: this.organizationId });

      // Subscribe to device deletion notifications
      const deviceDeletedSubscription = this.client.subscribe(`/topic/organization/${this.organizationId}/devices/deleted`, (message: IMessage) => {
        this.handleDeviceDeleted(message);
      });
      this.subscriptions.set('device-deleted', deviceDeletedSubscription);
      logInfo('StompWebSocket', 'Subscribed to device deletion notifications', { organizationId: this.organizationId });

      // Subscribe to device stats updates
      const deviceStatsSubscription = this.client.subscribe(`/topic/organization/${this.organizationId}/devices/stats`, (message: IMessage) => {
        this.handleDeviceStatsUpdate(message);
      });
      this.subscriptions.set('device-stats', deviceStatsSubscription);
      logInfo('StompWebSocket', 'Subscribed to device stats updates', { organizationId: this.organizationId });

    } catch (error) {
      logError('StompWebSocket', 'Failed to subscribe to device topics', error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * Handle device status update messages
   */
  private handleDeviceStatusUpdate(message: IMessage) {
    try {
      const data = JSON.parse(message.body);
      logInfo('StompWebSocket', 'Received device status update', data);
      
      if (data.type === 'DEVICE_STATUS_UPDATE' && data.deviceId && data.status) {
        this.callbacks.onDeviceStatusUpdate?.(data.deviceId, data.status, data.deviceName || 'Unknown Device');
      }
    } catch (error) {
      logError('StompWebSocket', 'Failed to parse device status update message', error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * Handle device creation messages
   */
  private handleDeviceCreated(message: IMessage) {
    try {
      const data = JSON.parse(message.body);
      logInfo('StompWebSocket', 'Received device creation notification', data);
      
      if (data.type === 'DEVICE_CREATED' && data.device) {
        this.callbacks.onDeviceCreated?.(data.device);
      }
    } catch (error) {
      logError('StompWebSocket', 'Failed to parse device creation message', error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * Handle device deletion messages
   */
  private handleDeviceDeleted(message: IMessage) {
    try {
      const data = JSON.parse(message.body);
      logInfo('StompWebSocket', 'Received device deletion notification', data);
      
      if (data.type === 'DEVICE_DELETED' && data.deviceId) {
        this.callbacks.onDeviceDeleted?.(data.deviceId, data.deviceName || 'Unknown Device');
      }
    } catch (error) {
      logError('StompWebSocket', 'Failed to parse device deletion message', error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * Handle device stats update messages
   */
  private handleDeviceStatsUpdate(message: IMessage) {
    try {
      const data = JSON.parse(message.body);
      logInfo('StompWebSocket', 'Received device stats update', data);
      
      // You can add stats handling logic here if needed
    } catch (error) {
      logError('StompWebSocket', 'Failed to parse device stats message', error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logWarn('StompWebSocket', 'Max reconnection attempts reached, giving up');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    
    logInfo('StompWebSocket', 'Scheduling reconnection attempt', { 
      attempt: this.reconnectAttempts, 
      maxAttempts: this.maxReconnectAttempts, 
      delay 
    });
    
    setTimeout(() => {
      if (!this.isConnected && this.organizationId) {
        logInfo('StompWebSocket', 'Attempting reconnection', { attempt: this.reconnectAttempts });
        this.connect(this.organizationId);
      }
    }, delay);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    logInfo('StompWebSocket', 'Disconnecting STOMP WebSocket');
    
    // Clear connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    // Unsubscribe from all topics
    this.subscriptions.forEach((subscription, key) => {
      try {
        subscription.unsubscribe();
        logInfo('StompWebSocket', 'Unsubscribed from topic', { topic: key });
      } catch (error) {
        logWarn('StompWebSocket', 'Failed to unsubscribe from topic', { topic: key, error });
      }
    });
    this.subscriptions.clear();
    
    // Deactivate client
    if (this.client) {
      try {
        this.client.deactivate();
      } catch (error) {
        logWarn('StompWebSocket', 'Error during client deactivation', error);
      }
      this.client = null;
    }
    
    this.isConnected = false;
    this.isConnecting = false;
    this.organizationId = null;
    this.reconnectAttempts = 0;
    
    this.callbacks.onConnectionStatusChange?.(false);
  }

  /**
   * Check if WebSocket is connected
   */
  isWebSocketConnected(): boolean {
    return this.isConnected && this.client?.connected === true;
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      connecting: this.isConnecting,
      organizationId: this.organizationId,
      subscriptions: Array.from(this.subscriptions.keys()),
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }

  /**
   * Send a ping message to test connection
   */
  sendPing() {
    if (!this.client || !this.isConnected) {
      logWarn('StompWebSocket', 'Cannot send ping - not connected');
      return;
    }

    try {
      this.client.publish({
        destination: '/app/ping',
        body: JSON.stringify({ timestamp: Date.now() })
      });
      logInfo('StompWebSocket', 'Ping sent');
    } catch (error) {
      logError('StompWebSocket', 'Failed to send ping', error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}

export const stompWebSocketService = new StompWebSocketService();
