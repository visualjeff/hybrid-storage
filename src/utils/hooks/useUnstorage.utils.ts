import { useState, useEffect } from 'react';
import { subscriptionManager } from './useUnstorage';
import type { Storage, StorageValue } from 'unstorage';

/**
 * Utility functions for working with the useUnstorage subscription system
 */

/**
 * Manually notify all subscribers of a storage change
 * Useful for custom storage drivers that don't support automatic change detection
 */
export function notifyStorageChange(key: string): void {
  subscriptionManager.notifyChange(key);
}

/**
 * Update the last known value for a key without triggering notifications
 * Useful for custom drivers to sync their internal state
 */
export function updateStorageValue(key: string, value: unknown): void {
  subscriptionManager.updateLastValue(key, value);
}

/**
 * Get the current number of active subscriptions for a key
 */
export function getSubscriptionCount(): number {
  // This would need to be exposed by the subscription manager
  // For now, we'll return a placeholder
  return 0;
}

/**
 * Create a custom storage driver wrapper that automatically notifies subscribers
 */
export function createNotifyingDriver(driver: Storage): Storage {
  return {
    ...driver,
    setItem: async (key: string, value: StorageValue) => {
      await driver.setItem(key, value);
      notifyStorageChange(key);
    },
    removeItem: async (key: string) => {
      await driver.removeItem(key);
      notifyStorageChange(key);
    },
    setItemRaw: async (key: string, value: string) => {
      await driver.setItemRaw(key, value);
      notifyStorageChange(key);
    }
  } as Storage;
}

/**
 * Hook for debugging subscription activity
 */
export function useSubscriptionDebug(key: string) {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  useEffect(() => {
    const unsubscribe = subscriptionManager.subscribe(key, () => {
      setLastUpdate(new Date());
    }, {} as Storage);
    
    return unsubscribe;
  }, [key]);
  
  return { lastUpdate };
} 