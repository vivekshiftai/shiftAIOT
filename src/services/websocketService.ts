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

  setCallbacks(callbacks: WebSocketCallbacks) {
    this.callbacks = callbacks;
  }

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
      
      logInfo('WebSocket', 'Connecting to WebSocket', { wsUrl, organizationId });
      
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        logInfo('WebSocket', 'WebSocket connected successfully');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
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
        this.callbacks.onConnectionStatusChange?.(false);
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = (event) => {
        logError('WebSocket', 'WebSocket error occurred', new Error('WebSocket error'));
        this.isConnecting = false;
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
    this.isConnecting = false;
    this.organizationId = null;
    this.callbacks.onConnectionStatusChange?.(false);
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
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
