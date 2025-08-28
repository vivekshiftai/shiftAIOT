import { pushNotificationAPI } from './api';

export interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushNotificationStatus {
  userId: string;
  pushEnabled: boolean;
  hasSubscription: boolean;
  vapidConfigured: boolean;
}

class PushNotificationService {
  private static instance: PushNotificationService;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean = false;

  private constructor() {
    this.checkSupport();
  }

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Check if push notifications are supported in this browser.
   */
  private async checkSupport(): Promise<void> {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    console.log('Push notifications supported:', this.isSupported);
  }

  /**
   * Initialize the push notification service.
   */
  async initialize(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Push notifications not supported in this browser');
      return false;
    }

    try {
      // Register service worker
      this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', this.swRegistration);
      
      // Check if we already have a subscription
      const existingSubscription = await this.swRegistration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('Existing push subscription found');
        return true;
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  /**
   * Get VAPID public key from server.
   */
  async getVapidPublicKey(): Promise<string | null> {
    try {
      const response = await pushNotificationAPI.getVapidPublicKey();
      return response.data.vapidPublicKey;
    } catch (error) {
      console.error('Failed to get VAPID public key:', error);
      return null;
    }
  }

  /**
   * Subscribe to push notifications.
   */
  async subscribe(): Promise<boolean> {
    if (!this.isSupported || !this.swRegistration) {
      console.warn('Push notifications not supported or not initialized');
      return false;
    }

    try {
      // Get VAPID public key
      const vapidPublicKey = await this.getVapidPublicKey();
      if (!vapidPublicKey) {
        console.error('VAPID public key not available');
        return false;
      }

      // Convert VAPID key to Uint8Array
      const vapidPublicKeyArray = this.urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe to push manager
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKeyArray
      });

      // Send subscription to server
      const subscriptionData: PushSubscription = {
        endpoint: subscription.endpoint,
        p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
      };

      await pushNotificationAPI.subscribe(subscriptionData);
      console.log('Push notification subscription successful');
      return true;

    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  }

  /**
   * Unsubscribe from push notifications.
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.isSupported || !this.swRegistration) {
      console.warn('Push notifications not supported or not initialized');
      return false;
    }

    try {
      // Get current subscription
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe();
        
        // Notify server
        await pushNotificationAPI.unsubscribe();
        
        console.log('Push notification unsubscription successful');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  /**
   * Get subscription status.
   */
  async getStatus(): Promise<PushNotificationStatus | null> {
    try {
      const response = await pushNotificationAPI.getStatus();
      return response.data;
    } catch (error) {
      console.error('Failed to get push notification status:', error);
      return null;
    }
  }

  /**
   * Check if user has an active subscription.
   */
  async hasSubscription(): Promise<boolean> {
    if (!this.isSupported || !this.swRegistration) {
      return false;
    }

    const subscription = await this.swRegistration.pushManager.getSubscription();
    return subscription !== null;
  }

  /**
   * Request notification permission.
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  }

  /**
   * Convert URL-safe base64 string to Uint8Array.
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Convert ArrayBuffer to base64 string.
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Check if push notifications are supported.
   */
  isPushSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Get service worker registration.
   */
  getServiceWorkerRegistration(): ServiceWorkerRegistration | null {
    return this.swRegistration;
  }
}

export default PushNotificationService;
