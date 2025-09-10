import { logInfo, logError, logWarn } from '../utils/logger';

interface PollingCallbacks {
  onDeviceStatusUpdate?: (deviceId: string, status: string, deviceName: string) => void;
  onDeviceCreated?: (device: any) => void;
  onDeviceDeleted?: (deviceId: string, deviceName: string) => void;
  onConnectionStatusChange?: (connected: boolean) => void;
}

class PollingService {
  private callbacks: PollingCallbacks = {};
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling = false;
  private organizationId: string | null = null;
  private lastDeviceCount = 0;
  private lastDeviceStatuses: Map<string, string> = new Map();
  private pollingIntervalMs = 5000; // Poll every 5 seconds

  setCallbacks(callbacks: PollingCallbacks) {
    this.callbacks = callbacks;
  }

  async start(organizationId: string) {
    if (this.isPolling) {
      return;
    }

    this.organizationId = organizationId;
    this.isPolling = true;
    
    logInfo('PollingService', 'Starting polling service', { organizationId });
    this.callbacks.onConnectionStatusChange?.(true);

    // Start polling immediately
    await this.pollForUpdates();

    // Set up interval for regular polling
    this.pollingInterval = setInterval(async () => {
      await this.pollForUpdates();
    }, this.pollingIntervalMs);
  }

  private async pollForUpdates() {
    if (!this.organizationId) {
      return;
    }

    try {
      // Get current devices and their statuses
      const { deviceAPI } = await import('./api');
      const response = await deviceAPI.getAll();
      
      if (response && response.data) {
        const devices = response.data;
        const currentDeviceCount = devices.length;
        
        // Check for new devices
        if (currentDeviceCount > this.lastDeviceCount) {
          const newDevices = devices.slice(this.lastDeviceCount);
          for (const device of newDevices) {
            logInfo('PollingService', 'New device detected', { 
              deviceId: device.id, 
              deviceName: device.name 
            });
            this.callbacks.onDeviceCreated?.(device);
          }
        }
        
        // Check for deleted devices
        if (currentDeviceCount < this.lastDeviceCount) {
          logWarn('PollingService', 'Device count decreased - some devices may have been deleted', {
            previousCount: this.lastDeviceCount,
            currentCount: currentDeviceCount
          });
          // Note: We can't easily detect which specific device was deleted with this approach
          // This is a limitation of polling vs WebSocket
        }
        
        // Check for status changes
        for (const device of devices) {
          const lastStatus = this.lastDeviceStatuses.get(device.id);
          if (lastStatus && lastStatus !== device.status) {
            logInfo('PollingService', 'Device status changed', {
              deviceId: device.id,
              deviceName: device.name,
              oldStatus: lastStatus,
              newStatus: device.status
            });
            this.callbacks.onDeviceStatusUpdate?.(device.id, device.status, device.name);
          }
          this.lastDeviceStatuses.set(device.id, device.status);
        }
        
        this.lastDeviceCount = currentDeviceCount;
      }
    } catch (error) {
      logError('PollingService', 'Failed to poll for updates', error instanceof Error ? error : new Error('Unknown error'));
      // Don't stop polling on individual errors, just log them
    }
  }

  stop() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    this.isPolling = false;
    this.organizationId = null;
    this.lastDeviceCount = 0;
    this.lastDeviceStatuses.clear();
    
    logInfo('PollingService', 'Polling service stopped');
    this.callbacks.onConnectionStatusChange?.(false);
  }

  isActive(): boolean {
    return this.isPolling;
  }

  getStatus() {
    return {
      isActive: this.isPolling,
      organizationId: this.organizationId,
      pollingInterval: this.pollingIntervalMs,
      lastDeviceCount: this.lastDeviceCount
    };
  }

  // Method to manually trigger a poll (useful after device operations)
  async triggerPoll() {
    if (this.isPolling) {
      await this.pollForUpdates();
    }
  }
}

// Export singleton instance
export const pollingService = new PollingService();
