import { useState, useEffect } from 'react';
import { userService } from '../services/userService';

/**
 * Custom hook to get user display name by user ID
 */
export const useUserDisplayName = (userId: string | null | undefined) => {
  const [displayName, setDisplayName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setDisplayName('');
      setLoading(false);
      setError(null);
      return;
    }

    const fetchUserDisplayName = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const name = await userService.getUserDisplayName(userId);
        setDisplayName(name);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user name');
        setDisplayName(`User ${userId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDisplayName();
  }, [userId]);

  return { displayName, loading, error };
};

/**
 * Custom hook to get multiple user display names
 */
export const useUserDisplayNames = (userIds: string[]) => {
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userIds.length) {
      setDisplayNames({});
      setLoading(false);
      setError(null);
      return;
    }

    const fetchUserDisplayNames = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const names: Record<string, string> = {};
        
        for (const userId of userIds) {
          const name = await userService.getUserDisplayName(userId);
          names[userId] = name;
        }
        
        setDisplayNames(names);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user names');
        // Set fallback names
        const fallbackNames: Record<string, string> = {};
        userIds.forEach(userId => {
          fallbackNames[userId] = `User ${userId}`;
        });
        setDisplayNames(fallbackNames);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDisplayNames();
  }, [userIds.join(',')]); // Use join to create a stable dependency

  return { displayNames, loading, error };
};
