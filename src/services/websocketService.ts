import { logInfo, logError, logWarn } from '../utils/logger';

interface WebSocketCallbacks {
  onDeviceStatusUpdate?: (deviceId: string, status: string, deviceName: string) => void;
  onDeviceCreated?: (device: any) => void;
  onDeviceDeleted?: (deviceId: string, deviceName: string) => void;
  onConnectionStatusChange?: (connected: boolean) => void;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private callbacks: WebSocketCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private organizationId: string | null = null;
  private isConnecting = false;
  private connectionTimeout: NodeJS.Timeout | null = null;

  setCallbacks(callbacks: WebSocketCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Connect to WebSocket server
   * 
   * NOTE: This service uses raw WebSocket, but the backend is configured for STOMP over WebSocket.
   * This will cause connection failures. The polling service is used as a fallback for real-time updates.
   */
  async connect(organizationId: string) {
    if (this.isConnecting || this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;
    this.organizationId = organizationId;

    try {
      // Get the backend URL from the API config instead of environment variable
      const { getApiConfig } = await import('../config/api');
      const backendUrl = getApiConfig().BACKEND_BASE_URL;
      const wsUrl = backendUrl.replace('http', 'ws') + '/ws';
      
      logInfo('WebSocket', 'Attempting to connect to WebSocket', { wsUrl, organizationId });
      
      // Check if WebSocket is supported
      if (!window.WebSocket) {
        logWarn('WebSocket', 'WebSocket not supported in this browser');
        this.isConnecting = false;
        return;
      }
      
      this.socket = new WebSocket(wsUrl);
      
      // Set connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
          logWarn('WebSocket', 'Connection timeout - closing socket');
          this.socket.close();
          this.isConnecting = false;
        }
      }, 10000); // 10 second timeout
      
      this.socket.onopen = () => {
        logInfo('WebSocket', 'WebSocket connected successfully');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Clear connection timeout
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        
        this.callbacks.onConnectionStatusChange?.(true);
        
        // Subscribe to organization-specific topics
        this.subscribeToTopics();
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          logError('WebSocket', 'Failed to parse WebSocket message', error instanceof Error ? error : new Error('Unknown error'));
        }
      };

      this.socket.onclose = (event) => {
        logWarn('WebSocket', 'WebSocket connection closed', { code: event.code, reason: event.reason });
        this.isConnecting = false;
        
        // Clear connection timeout
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        
        this.callbacks.onConnectionStatusChange?.(false);
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = (error) => {
        logError('WebSocket', 'WebSocket connection failed', new Error('WebSocket connection error'));
        logWarn('WebSocket', 'WebSocket connection details', {
          wsUrl,
          organizationId,
          readyState: this.socket?.readyState,
          error: error,
          protocolMismatch: 'Backend uses STOMP over WebSocket, frontend uses raw WebSocket',
          possibleCauses: [
            'Protocol mismatch: Backend expects STOMP over WebSocket, frontend uses raw WebSocket',
            'Backend WebSocket server not running',
            'Network/firewall blocking WebSocket connections',
            'CORS configuration issues',
            'Backend WebSocket endpoint not configured'
          ],
          solution: 'Polling service will handle real-time updates instead'
        });
        this.isConnecting = false;
        
        // Clear connection timeout
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        
        this.callbacks.onConnectionStatusChange?.(false);
        
        // Don't attempt reconnection for WebSocket errors - let polling service handle it
        logWarn('WebSocket', 'WebSocket connection failed due to protocol mismatch - polling service will handle real-time updates');
      };

    } catch (error) {
      logError('WebSocket', 'Failed to create WebSocket connection', error instanceof Error ? error : new Error('Unknown error'));
      this.isConnecting = false;
    }
  }

  private subscribeToTopics() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || !this.organizationId) {
      return;
    }

    try {
      // Subscribe to organization-specific device status updates
      const subscribeMessage = {
        type: 'SUBSCRIBE',
        topics: [
          `/topic/organization/${this.organizationId}/devices/status`,
          `/topic/organization/${this.organizationId}/devices/created`,
          `/topic/organization/${this.organizationId}/devices/deleted`,
          `/topic/organization/${this.organizationId}/devices/stats`
        ]
      };

      this.socket.send(JSON.stringify(subscribeMessage));
      logInfo('WebSocket', 'Subscribed to device topics', { organizationId: this.organizationId });
    } catch (error) {
      logError('WebSocket', 'Failed to subscribe to topics', error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  private handleMessage(message: any) {
    try {
      switch (message.type) {
        case 'DEVICE_STATUS_UPDATE':
          console.log(`🔄 WebSocket: Device status update received`, {
            deviceId: message.deviceId,
            status: message.status,
            deviceName: message.deviceName,
            updatedAt: message.updatedAt
          });
          
          this.callbacks.onDeviceStatusUpdate?.(
            message.deviceId,
            message.status,
            message.deviceName
          );
          break;

        case 'DEVICE_CREATED':
          console.log(`🆕 WebSocket: Device created`, {
            deviceId: message.device?.id,
            deviceName: message.device?.name
          });
          
          this.callbacks.onDeviceCreated?.(message.device);
          break;

        case 'DEVICE_DELETED':
          console.log(`🗑️ WebSocket: Device deleted`, {
            deviceId: message.deviceId,
            deviceName: message.deviceName
          });
          
          this.callbacks.onDeviceDeleted?.(
            message.deviceId,
            message.deviceName
          );
          break;

        case 'DEVICE_STATS_UPDATE':
          console.log(`📊 WebSocket: Device stats update received`, message.stats);
          // Handle device stats updates if needed
          logInfo('WebSocket', 'Device stats update received', message.stats);
          break;


        default:
          console.warn(`⚠️ WebSocket: Unknown message type received`, { type: message.type });
          logWarn('WebSocket', 'Unknown message type received', { type: message.type });
      }
    } catch (error) {
      logError('WebSocket', 'Failed to handle WebSocket message', error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    logInfo('WebSocket', 'Scheduling reconnection attempt', { 
      attempt: this.reconnectAttempts, 
      delay,
      organizationId: this.organizationId 
    });

    setTimeout(() => {
      if (this.organizationId) {
        this.connect(this.organizationId);
      }
    }, delay);
  }

  disconnect() {
    if (this.socket) {
      logInfo('WebSocket', 'Disconnecting WebSocket');
      this.socket.close(1000, 'User initiated disconnect');
      this.socket = null;
    }
    
    // Clear connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    this.isConnecting = false;
    this.organizationId = null;
    this.callbacks.onConnectionStatusChange?.(false);
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Check if WebSocket is supported and available
   */
  isWebSocketSupported(): boolean {
    return typeof window !== 'undefined' && !!window.WebSocket;
  }

  /**
   * Get connection status information
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected(),
      isConnecting: this.isConnecting,
      isSupported: this.isWebSocketSupported(),
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      organizationId: this.organizationId
    };
  }

  sendMessage(message: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(message));
              return true;
    } catch (error) {
      logError('WebSocket', 'Failed to send message', error instanceof Error ? error : new Error('Unknown error'));
      return false;
    }
    }
    return false;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
