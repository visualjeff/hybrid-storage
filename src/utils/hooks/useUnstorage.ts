import { useState, useEffect, useCallback } from 'react';
import type { Storage, StorageValue } from 'unstorage';

export interface UseUnstorageOptions<T = string> {
  defaultValue?: T;
  autoLoad?: boolean;
  onError?: (error: Error) => void;
  fallbackToDefault?: boolean; // Whether to fall back to defaultValue when key doesn't exist
}

export function useUnstorage<T = string>(
  storage: Storage,
  key: string,
  options: UseUnstorageOptions<T> = {}
) {
  const { defaultValue, autoLoad = true, onError, fallbackToDefault = true } = options;
  
  const [value, setValue] = useState<T | null>(defaultValue || null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<Error | null>(null);

  // Load value from storage
  const loadValue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await storage.getItem(key);
      // If result is null (key doesn't exist), use defaultValue if fallbackToDefault is true
      setValue(result !== null ? (result as T) : (fallbackToDefault ? (defaultValue || null) : null));
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [storage, key, onError, defaultValue, fallbackToDefault]);

  // Set value in storage
  const setValueAsync = useCallback(async (newValue: T) => {
    try {
      setLoading(true);
      setError(null);
      await storage.setItem(key, newValue as StorageValue);
      setValue(newValue);
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [storage, key, onError]);

  // Remove value from storage
  const removeValue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await storage.removeItem(key);
      // Reset to defaultValue if fallbackToDefault is true, otherwise null
      setValue(fallbackToDefault ? (defaultValue || null) : null);
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [storage, key, onError, defaultValue, fallbackToDefault]);

  // Check if key exists
  const hasValue = useCallback(async (): Promise<boolean> => {
    try {
      return await storage.hasItem(key);
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
      return false;
    }
  }, [storage, key, onError]);

  // Get raw value (without parsing)
  const getRawValue = useCallback(async (): Promise<string | null> => {
    try {
      return await storage.getItemRaw(key);
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
      return null;
    }
  }, [storage, key, onError]);

  // Set raw value (without stringifying)
  const setRawValue = useCallback(async (rawValue: string) => {
    try {
      setLoading(true);
      setError(null);
      await storage.setItemRaw(key, rawValue);
      setValue(rawValue as T);
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [storage, key, onError]);

  // Auto-load value on mount if enabled
  useEffect(() => {
    if (autoLoad) {
      loadValue();
    }
  }, [loadValue, autoLoad]);

  return {
    // State
    value,
    loading,
    error,
    
    // Actions
    setValue: setValueAsync,
    removeValue,
    loadValue,
    hasValue,
    getRawValue,
    setRawValue,
    
    // Utilities
    clearError: () => setError(null),
    reset: () => {
      setValue(defaultValue || null);
      setError(null);
      setLoading(false);
    }
  };
} 