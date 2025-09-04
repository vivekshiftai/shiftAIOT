import { userAPI } from './api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  organizationId: string;
}

interface UserCacheEntry {
  user: User;
  timestamp: number;
}

class UserService {
  private static instance: UserService;
  private userCache: Map<string, UserCacheEntry> = new Map();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  private constructor() {}

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * Get user by ID with caching
   */
  public async getUserById(userId: string): Promise<User | null> {
    if (!userId) {
      return null;
    }

    // Check cache first
    const cachedEntry = this.userCache.get(userId);
    if (cachedEntry && this.isCacheValid(cachedEntry.timestamp)) {
      return cachedEntry.user;
    }

    try {
      // Fetch from API
      const response = await userAPI.getById(userId);
      if (response?.data) {
        const user: User = {
          id: response.data.id,
          firstName: response.data.firstName || response.data.first_name || '',
          lastName: response.data.lastName || response.data.last_name || '',
          email: response.data.email || '',
          organizationId: response.data.organizationId || response.data.organization_id || ''
        };

        // Cache the user
        this.userCache.set(userId, {
          user,
          timestamp: Date.now()
        });

        return user;
      }
    } catch (error) {
      console.error('Failed to fetch user by ID:', error);
    }

    return null;
  }

  /**
   * Get user display name (firstName + lastName)
   */
  public async getUserDisplayName(userId: string): Promise<string> {
    const user = await this.getUserById(userId);
    if (user) {
      const firstName = user.firstName?.trim() || '';
      const lastName = user.lastName?.trim() || '';
      
      if (firstName && lastName) {
        return `${firstName} ${lastName}`;
      } else if (firstName) {
        return firstName;
      } else if (lastName) {
        return lastName;
      } else {
        return user.email || `User ${userId}`;
      }
    }
    
    return `User ${userId}`;
  }

  /**
   * Get multiple users by IDs
   */
  public async getUsersByIds(userIds: string[]): Promise<User[]> {
    const users: User[] = [];
    
    for (const userId of userIds) {
      const user = await this.getUserById(userId);
      if (user) {
        users.push(user);
      }
    }
    
    return users;
  }

  /**
   * Check if cache entry is still valid
   */
  private isCacheValid(timestamp: number): boolean {
    return (Date.now() - timestamp) < this.CACHE_DURATION;
  }

  /**
   * Clear cache for a specific user
   */
  public clearUserCache(userId: string): void {
    this.userCache.delete(userId);
  }

  /**
   * Clear all cache
   */
  public clearAllCache(): void {
    this.userCache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
  } {
    let validEntries = 0;
    let expiredEntries = 0;

    for (const entry of this.userCache.values()) {
      if (this.isCacheValid(entry.timestamp)) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.userCache.size,
      validEntries,
      expiredEntries
    };
  }

  /**
   * Clean up expired cache entries
   */
  public cleanupExpiredEntries(): void {
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.userCache.entries()) {
      if (!this.isCacheValid(entry.timestamp)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.userCache.delete(key));
  }
}

export const userService = UserService.getInstance();
