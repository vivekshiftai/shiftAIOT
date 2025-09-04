import { Notification } from '../types';
import { getNotificationCacheKey, isNotificationDataFresh } from '../utils/notificationValidation';

interface NotificationCacheEntry {
  data: Notification[];
  timestamp: number;
  organizationId: string;
  userId: string;
}

class NotificationCacheService {
  private static instance: NotificationCacheService;
  private cache: Map<string, NotificationCacheEntry> = new Map();
  // private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes - using isNotificationDataFresh instead

  private constructor() {}

  public static getInstance(): NotificationCacheService {
    if (!NotificationCacheService.instance) {
      NotificationCacheService.instance = new NotificationCacheService();
    }
    return NotificationCacheService.instance;
  }

  /**
   * Get cached notifications if they exist and are fresh
   */
  public getCachedNotifications(organizationId: string, userId: string): Notification[] | null {
    const cacheKey = getNotificationCacheKey(organizationId, userId);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      return null;
    }

    // Check if data is fresh
    if (!isNotificationDataFresh(entry.timestamp)) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.data;
  }

  /**
   * Cache notifications with timestamp
   */
  public setCachedNotifications(
    organizationId: string, 
    userId: string, 
    notifications: Notification[]
  ): void {
    const cacheKey = getNotificationCacheKey(organizationId, userId);
    const entry: NotificationCacheEntry = {
      data: notifications,
      timestamp: Date.now(),
      organizationId,
      userId
    };

    this.cache.set(cacheKey, entry);
  }

  /**
   * Update a single notification in cache
   */
  public updateCachedNotification(
    organizationId: string,
    userId: string,
    updatedNotification: Notification
  ): void {
    const cacheKey = getNotificationCacheKey(organizationId, userId);
    const entry = this.cache.get(cacheKey);

    if (!entry || !isNotificationDataFresh(entry.timestamp)) {
      return; // Cache is stale, don't update
    }

    const updatedData = entry.data.map(notification => 
      notification.id === updatedNotification.id ? updatedNotification : notification
    );

    entry.data = updatedData;
    this.cache.set(cacheKey, entry);
  }

  /**
   * Add a new notification to cache
   */
  public addCachedNotification(
    organizationId: string,
    userId: string,
    newNotification: Notification
  ): void {
    const cacheKey = getNotificationCacheKey(organizationId, userId);
    const entry = this.cache.get(cacheKey);

    if (!entry || !isNotificationDataFresh(entry.timestamp)) {
      return; // Cache is stale, don't update
    }

    // Add to beginning of array (most recent first)
    entry.data.unshift(newNotification);
    this.cache.set(cacheKey, entry);
  }

  /**
   * Remove a notification from cache
   */
  public removeCachedNotification(
    organizationId: string,
    userId: string,
    notificationId: string
  ): void {
    const cacheKey = getNotificationCacheKey(organizationId, userId);
    const entry = this.cache.get(cacheKey);

    if (!entry || !isNotificationDataFresh(entry.timestamp)) {
      return; // Cache is stale, don't update
    }

    entry.data = entry.data.filter(notification => notification.id !== notificationId);
    this.cache.set(cacheKey, entry);
  }

  /**
   * Clear cache for specific user/organization
   */
  public clearCache(organizationId: string, userId: string): void {
    const cacheKey = getNotificationCacheKey(organizationId, userId);
    this.cache.delete(cacheKey);
  }

  /**
   * Clear all cache
   */
  public clearAllCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    totalEntries: number;
    staleEntries: number;
    freshEntries: number;
  } {
    let staleEntries = 0;
    let freshEntries = 0;

    for (const entry of this.cache.values()) {
      if (isNotificationDataFresh(entry.timestamp)) {
        freshEntries++;
      } else {
        staleEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      staleEntries,
      freshEntries
    };
  }

  /**
   * Clean up stale cache entries
   */
  public cleanupStaleEntries(): void {
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (!isNotificationDataFresh(entry.timestamp)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

export const notificationCacheService = NotificationCacheService.getInstance();
