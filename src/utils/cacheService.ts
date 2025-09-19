/**
 * Local Storage Cache Service
 * Provides caching functionality for API responses to reduce backend calls
 */

import { logInfo, logWarn } from './logger';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxAge?: number; // Maximum age before forced refresh
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const DEFAULT_MAX_AGE = 30 * 60 * 1000; // 30 minutes

export class CacheService {
  private static instance: CacheService;
  private keyPrefix = 'shiftAIOT_cache_';

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  private getKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  /**
   * Set data in cache with TTL
   */
  set<T>(key: string, data: T, config: CacheConfig = { ttl: DEFAULT_TTL }): void {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + config.ttl
      };

      localStorage.setItem(this.getKey(key), JSON.stringify(cacheItem));
      logInfo('Cache', `Data cached for key: ${key}`, { 
        ttl: config.ttl, 
        expiresAt: new Date(cacheItem.expiresAt).toISOString() 
      });
    } catch (error) {
      logWarn('Cache', `Failed to cache data for key: ${key}`, error);
    }
  }

  /**
   * Get data from cache if not expired
   */
  get<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(this.getKey(key));
      if (!cached) {
        return null;
      }

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      const now = Date.now();

      // Check if expired
      if (now > cacheItem.expiresAt) {
        logInfo('Cache', `Cache expired for key: ${key}`);
        this.remove(key);
        return null;
      }

      logInfo('Cache', `Cache hit for key: ${key}`, { 
        age: now - cacheItem.timestamp,
        expiresIn: cacheItem.expiresAt - now 
      });
      return cacheItem.data;
    } catch (error) {
      logWarn('Cache', `Failed to get cached data for key: ${key}`, error);
      this.remove(key);
      return null;
    }
  }

  /**
   * Check if cache exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Remove data from cache
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(this.getKey(key));
      logInfo('Cache', `Cache cleared for key: ${key}`);
    } catch (error) {
      logWarn('Cache', `Failed to remove cache for key: ${key}`, error);
    }
  }

  /**
   * Clear all cache data
   */
  clearAll(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.keyPrefix));
      keys.forEach(key => localStorage.removeItem(key));
      logInfo('Cache', `Cleared ${keys.length} cache entries`);
    } catch (error) {
      logWarn('Cache', 'Failed to clear all cache', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { totalEntries: number; totalSize: number } {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.keyPrefix));
      const totalSize = keys.reduce((size, key) => {
        const value = localStorage.getItem(key);
        return size + (value ? value.length : 0);
      }, 0);

      return {
        totalEntries: keys.length,
        totalSize: totalSize
      };
    } catch (error) {
      logWarn('Cache', 'Failed to get cache stats', error);
      return { totalEntries: 0, totalSize: 0 };
    }
  }

  /**
   * Cached API call wrapper
   */
  async cachedApiCall<T>(
    key: string, 
    apiCall: () => Promise<T>, 
    config: CacheConfig = { ttl: DEFAULT_TTL },
    forceRefresh: boolean = false
  ): Promise<T> {
    // Force refresh bypasses cache
    if (forceRefresh) {
      logInfo('Cache', `Force refresh for key: ${key}, clearing cache and making API call`);
      this.remove(key);
    } else {
      // Try to get from cache first
      const cached = this.get<T>(key);
      if (cached !== null) {
        return cached;
      }
    }

    // Cache miss or force refresh - make API call
    logInfo('Cache', `Cache miss for key: ${key}, making API call`);
    const data = await apiCall();
    
    // Cache the result
    this.set(key, data, config);
    
    return data;
  }

  /**
   * Navigation-aware cached API call - shorter TTL for navigation scenarios
   */
  async navigationCachedApiCall<T>(
    key: string,
    apiCall: () => Promise<T>,
    isNavigation: boolean = false
  ): Promise<T> {
    const config = isNavigation 
      ? { ttl: 30 * 1000 } // 30 seconds for navigation
      : { ttl: DEFAULT_TTL }; // 5 minutes for normal use
    
    return this.cachedApiCall(key, apiCall, config, isNavigation);
  }

  /**
   * Cache section state (tab selections, form data, etc.)
   */
  setSectionState<T>(sectionId: string, userId: string, state: T): void {
    const key = `section_state_${sectionId}_${userId}`;
    this.set(key, state, CacheConfigs.SESSION);
    logInfo('Cache', `Section state cached for ${sectionId}`, { userId });
  }

  /**
   * Get cached section state
   */
  getSectionState<T>(sectionId: string, userId: string): T | null {
    const key = `section_state_${sectionId}_${userId}`;
    return this.get<T>(key);
  }

  /**
   * Cache section data (API responses, computed data, etc.)
   */
  setSectionData<T>(sectionId: string, dataKey: string, userId: string, data: T, config: CacheConfig = CacheConfigs.MEDIUM): void {
    const key = `section_data_${sectionId}_${dataKey}_${userId}`;
    this.set(key, data, config);
    logInfo('Cache', `Section data cached for ${sectionId}:${dataKey}`, { userId });
  }

  /**
   * Get cached section data
   */
  getSectionData<T>(sectionId: string, dataKey: string, userId: string): T | null {
    const key = `section_data_${sectionId}_${dataKey}_${userId}`;
    return this.get<T>(key);
  }

  /**
   * Clear all cached data for a specific section
   */
  clearSectionCache(sectionId: string, userId: string): void {
    const stateKey = `section_state_${sectionId}_${userId}`;
    const dataKeyPrefix = `section_data_${sectionId}_`;
    
    this.remove(stateKey);
    
    // Remove all data keys for this section
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.keyPrefix + dataKeyPrefix)) {
        localStorage.removeItem(key);
      }
    }
    
    logInfo('Cache', `Cleared all cache for section ${sectionId}`, { userId });
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();

// Cache configuration presets
export const CacheConfigs = {
  SHORT: { ttl: 2 * 60 * 1000 }, // 2 minutes
  MEDIUM: { ttl: 5 * 60 * 1000 }, // 5 minutes  
  LONG: { ttl: 15 * 60 * 1000 }, // 15 minutes
  VERY_LONG: { ttl: 60 * 60 * 1000 }, // 1 hour
  SESSION: { ttl: 24 * 60 * 60 * 1000 } // 24 hours for session data like tab states
};
