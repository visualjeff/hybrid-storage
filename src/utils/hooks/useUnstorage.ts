import { useState, useEffect, useCallback, useRef } from 'react';
import type { Storage, StorageValue } from 'unstorage';
import { Type } from '@sinclair/typebox';
import type { Static } from '@sinclair/typebox';

// Schema for UseUnstorageOptions
export const UseUnstorageOptionsSchema = Type.Object({
  defaultValue: Type.Optional(Type.Any()),
  autoLoad: Type.Optional(Type.Boolean()),
  onError: Type.Optional(Type.Function([Type.Object({})], Type.Void())),
  fallbackToDefault: Type.Optional(Type.Boolean()),
  subscribe: Type.Optional(Type.Boolean()),
  pollInterval: Type.Optional(Type.Number())
});

export type UseUnstorageOptions<T = string> = Static<typeof UseUnstorageOptionsSchema> & { defaultValue?: T };

// Global subscription manager
class StorageSubscriptionManager {
  private subscriptions = new Map<string, Set<() => void>>();
  private pollIntervals = new Map<string, NodeJS.Timeout>();
  private lastValues = new Map<string, unknown>();
  private storageInstances = new Map<string, Storage>();

  subscribe(key: string, callback: () => void, storage: Storage, pollInterval?: number): () => void {
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
      this.storageInstances.set(key, storage);
    }
    
    this.subscriptions.get(key)!.add(callback);
    
    // Start polling if this is the first subscriber and pollInterval is provided
    if (pollInterval && !this.pollIntervals.has(key)) {
      this.startPolling(key, pollInterval);
    }
    
    // Return unsubscribe function
    return () => {
      const subscribers = this.subscriptions.get(key);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscriptions.delete(key);
          this.storageInstances.delete(key);
          this.stopPolling(key);
        }
      }
    };
  }

  private startPolling(key: string, interval: number) {
    const timeout = setInterval(async () => {
      await this.checkForChanges(key);
    }, interval);
    this.pollIntervals.set(key, timeout);
  }

  private stopPolling(key: string) {
    const timeout = this.pollIntervals.get(key);
    if (timeout) {
      clearInterval(timeout);
      this.pollIntervals.delete(key);
    }
  }

  private async checkForChanges(key: string) {
    const storage = this.storageInstances.get(key);
    if (!storage) return;

    try {
      const currentValue = await storage.getItem(key);
      const lastValue = this.lastValues.get(key);
      
      // Deep comparison of values
      if (JSON.stringify(currentValue) !== JSON.stringify(lastValue)) {
        this.lastValues.set(key, currentValue);
        this.notifySubscribers(key);
      }
    } catch (error) {
      console.warn('Error checking for storage changes:', error);
    }
  }

  notifySubscribers(key: string) {
    const subscribers = this.subscriptions.get(key);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Error in storage subscription callback:', error);
        }
      });
    }
  }

  // Method to manually notify subscribers (useful for custom drivers)
  notifyChange(key: string) {
    this.notifySubscribers(key);
  }

  // Method to update last known value (useful for custom drivers)
  updateLastValue(key: string, value: unknown) {
    this.lastValues.set(key, value);
  }
}

// Global instance
const subscriptionManager = new StorageSubscriptionManager();

export function useUnstorage<T = string>(
  storage: Storage,
  key: string,
  options: UseUnstorageOptions<T> = {}
) {
  const { 
    defaultValue, 
    autoLoad = true, 
    onError, 
    fallbackToDefault = true,
    subscribe = true
    // pollInterval = 1000 - temporarily disabled
  } = options;
  
  const [value, setValue] = useState<T | null>(defaultValue || null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  
  // Use refs to store stable references
  const storageRef = useRef(storage);
  const keyRef = useRef(key);
  const onErrorRef = useRef(onError);
  const defaultValueRef = useRef(defaultValue);
  const fallbackToDefaultRef = useRef(fallbackToDefault);
  const subscribeRef = useRef(subscribe);
  
  // Update refs when props change
  storageRef.current = storage;
  keyRef.current = key;
  onErrorRef.current = onError;
  defaultValueRef.current = defaultValue;
  fallbackToDefaultRef.current = fallbackToDefault;
  subscribeRef.current = subscribe;

  // Load value from storage - stable function that doesn't change
  const loadValue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await storageRef.current.getItem(keyRef.current);
      const newValue = result !== null ? (result as T) : (fallbackToDefaultRef.current ? (defaultValueRef.current || null) : null);
      setValue(newValue);
      
      // Update the subscription manager's last known value
      if (subscribeRef.current) {
        subscriptionManager.updateLastValue(keyRef.current, result);
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      onErrorRef.current?.(error);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array - function never changes

  // Set value in storage
  const setValueAsync = useCallback(async (newValue: T) => {
    try {
      setLoading(true);
      setError(null);
      await storageRef.current.setItem(keyRef.current, newValue as StorageValue);
      setValue(newValue);
      
      // Update the subscription manager's last known value and notify subscribers
      if (subscribeRef.current) {
        subscriptionManager.updateLastValue(keyRef.current, newValue);
        subscriptionManager.notifyChange(keyRef.current);
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      onErrorRef.current?.(error);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array - function never changes

  // Remove value from storage
  const removeValue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await storageRef.current.removeItem(keyRef.current);
      const newValue = fallbackToDefaultRef.current ? (defaultValueRef.current || null) : null;
      setValue(newValue);
      
      // Update the subscription manager's last known value and notify subscribers
      if (subscribeRef.current) {
        subscriptionManager.updateLastValue(keyRef.current, null);
        subscriptionManager.notifyChange(keyRef.current);
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      onErrorRef.current?.(error);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array - function never changes

  // Check if key exists
  const hasValue = useCallback(async (): Promise<boolean> => {
    try {
      return await storageRef.current.hasItem(keyRef.current);
    } catch (err) {
      const error = err as Error;
      setError(error);
      onErrorRef.current?.(error);
      return false;
    }
  }, []); // Empty dependency array - function never changes

  // Get raw value (without parsing)
  const getRawValue = useCallback(async (): Promise<string | null> => {
    try {
      return await storageRef.current.getItemRaw(keyRef.current);
    } catch (err) {
      const error = err as Error;
      setError(error);
      onErrorRef.current?.(error);
      return null;
    }
  }, []); // Empty dependency array - function never changes

  // Set raw value (without stringifying)
  const setRawValue = useCallback(async (rawValue: string) => {
    try {
      setLoading(true);
      setError(null);
      await storageRef.current.setItemRaw(keyRef.current, rawValue);
      setValue(rawValue as T);
      
      // Update the subscription manager's last known value and notify subscribers
      if (subscribeRef.current) {
        subscriptionManager.updateLastValue(keyRef.current, rawValue);
        subscriptionManager.notifyChange(keyRef.current);
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      onErrorRef.current?.(error);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array - function never changes

  // Subscribe to external changes
  useEffect(() => {
    // Temporarily disable subscription to prevent infinite loops
    // if (subscribe) {
    //   unsubscribeRef.current = subscriptionManager.subscribe(
    //     key, 
    //     loadValue, 
    //     storage,
    //     pollInterval
    //   );
    // }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run once

  // Auto-load value on mount if enabled
  useEffect(() => {
    if (autoLoad) {
      loadValue();
    }
  }, [autoLoad, loadValue]);

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

// Export the subscription manager for manual notifications
export { subscriptionManager }; 