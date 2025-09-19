import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { cacheService, CacheConfigs } from '../utils/cacheService';
import { logInfo } from '../utils/logger';

interface SectionStateOptions {
  autoSave?: boolean;
  saveDelay?: number;
}

/**
 * Custom hook for managing persistent section state across tab navigation
 * Automatically saves and restores section state using local storage
 */
export function useSectionState<T>(
  sectionId: string,
  initialState: T,
  options: SectionStateOptions = {}
): [T, (state: T | ((prevState: T) => T)) => void, () => void] {
  const { user } = useAuth();
  const { autoSave = true, saveDelay = 500 } = options;

  // Initialize state from cache or use initial state
  const [state, setState] = useState<T>(() => {
    if (!user?.id) return initialState;
    
    const cachedState = cacheService.getSectionState<T>(sectionId, user.id);
    if (cachedState !== null) {
      logInfo('SectionState', `Restored state for section ${sectionId}`, { userId: user.id });
      return cachedState;
    }
    
    return initialState;
  });

  // Save state to cache
  const saveState = useCallback((stateToSave: T) => {
    if (!user?.id || !autoSave) return;
    
    cacheService.setSectionState(sectionId, user.id, stateToSave);
    logInfo('SectionState', `Saved state for section ${sectionId}`, { userId: user.id });
  }, [sectionId, user?.id, autoSave]);

  // Manual save function
  const manualSave = useCallback(() => {
    if (user?.id) {
      cacheService.setSectionState(sectionId, user.id, state);
      logInfo('SectionState', `Manually saved state for section ${sectionId}`, { userId: user.id });
    }
  }, [sectionId, user?.id, state]);

  // Enhanced setState that handles both function and direct updates
  const setStateWithPersistence = useCallback((newState: T | ((prevState: T) => T)) => {
    setState(prevState => {
      const nextState = typeof newState === 'function' 
        ? (newState as (prevState: T) => T)(prevState)
        : newState;
      
      // Save to cache with debouncing
      if (autoSave) {
        setTimeout(() => saveState(nextState), saveDelay);
      }
      
      return nextState;
    });
  }, [saveState, autoSave, saveDelay]);

  // Load cached state when user changes
  useEffect(() => {
    if (!user?.id) return;
    
    const cachedState = cacheService.getSectionState<T>(sectionId, user.id);
    if (cachedState !== null) {
      setState(cachedState);
      logInfo('SectionState', `Loaded cached state for section ${sectionId}`, { userId: user.id });
    }
  }, [sectionId, user?.id]);

  return [state, setStateWithPersistence, manualSave];
}

/**
 * Custom hook for managing persistent section data (API responses, computed data)
 */
export function useSectionData<T>(
  sectionId: string,
  dataKey: string,
  initialData: T | null = null
): [T | null, (data: T) => void, () => void, () => T | null] {
  const { user } = useAuth();

  // Initialize data from cache
  const [data, setData] = useState<T | null>(() => {
    if (!user?.id) return initialData;
    
    const cachedData = cacheService.getSectionData<T>(sectionId, dataKey, user.id);
    if (cachedData !== null) {
      logInfo('SectionData', `Restored data for section ${sectionId}:${dataKey}`, { userId: user.id });
      return cachedData;
    }
    
    return initialData;
  });

  // Save data to cache
  const saveData = useCallback((dataToSave: T) => {
    if (!user?.id) return;
    
    setData(dataToSave);
    cacheService.setSectionData(sectionId, dataKey, user.id, dataToSave, CacheConfigs.MEDIUM);
    logInfo('SectionData', `Saved data for section ${sectionId}:${dataKey}`, { userId: user.id });
  }, [sectionId, dataKey, user?.id]);

  // Clear data from cache and state
  const clearData = useCallback(() => {
    if (!user?.id) return;
    
    setData(null);
    cacheService.remove(`section_data_${sectionId}_${dataKey}_${user.id}`);
    logInfo('SectionData', `Cleared data for section ${sectionId}:${dataKey}`, { userId: user.id });
  }, [sectionId, dataKey, user?.id]);

  // Get fresh data from cache (useful for checking if data exists)
  const getFreshData = useCallback((): T | null => {
    if (!user?.id) return null;
    
    return cacheService.getSectionData<T>(sectionId, dataKey, user.id);
  }, [sectionId, dataKey, user?.id]);

  // Load cached data when user changes
  useEffect(() => {
    if (!user?.id) return;
    
    const cachedData = cacheService.getSectionData<T>(sectionId, dataKey, user.id);
    if (cachedData !== null) {
      setData(cachedData);
      logInfo('SectionData', `Loaded cached data for section ${sectionId}:${dataKey}`, { userId: user.id });
    }
  }, [sectionId, dataKey, user?.id]);

  return [data, saveData, clearData, getFreshData];
}
