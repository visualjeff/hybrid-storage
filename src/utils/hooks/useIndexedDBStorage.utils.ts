import { useState, useEffect } from 'react';
import { indexedDBSubscriptionManager } from './useIndexedDBStorage';
import type { Storage, StorageValue } from 'unstorage';

/**
 * Utility functions for working with the useIndexedDBStorage subscription system
 */

/**
 * Manually notify all subscribers of an IndexedDB storage change
 * Useful for custom IndexedDB storage drivers that don't support automatic change detection
 */
export function notifyIndexedDBChange(key: string): void {
  indexedDBSubscriptionManager.notifyChange(key);
}

/**
 * Update the last known value for a key without triggering notifications
 * Useful for custom IndexedDB drivers to sync their internal state
 */
export function updateIndexedDBValue(key: string, value: unknown): void {
  indexedDBSubscriptionManager.updateLastValue(key, value);
}

/**
 * Create a custom IndexedDB storage driver wrapper that automatically notifies subscribers
 */
export function createNotifyingIndexedDBDriver(driver: Storage): Storage {
  return {
    ...driver,
    setItem: async (key: string, value: StorageValue) => {
      await driver.setItem(key, value);
      notifyIndexedDBChange(key);
    },
    removeItem: async (key: string) => {
      await driver.removeItem(key);
      notifyIndexedDBChange(key);
    },
    setItemRaw: async (key: string, value: string) => {
      await driver.setItemRaw(key, value);
      notifyIndexedDBChange(key);
    }
  } as Storage;
}

/**
 * Hook for debugging IndexedDB subscription activity
 */
export function useIndexedDBSubscriptionDebug(key: string) {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  useEffect(() => {
    const unsubscribe = indexedDBSubscriptionManager.subscribe(key, () => {
      setLastUpdate(new Date());
    }, {} as Storage);
    
    return unsubscribe;
  }, [key]);
  
  return { lastUpdate };
}

/**
 * Type guard to check if a storage driver is an IndexedDB driver
 * This is the same function used internally by the hooks
 */
export function isIndexedDBDriver(storage: Storage): boolean {
  // Check for common IndexedDB driver indicators
  if ('name' in storage && storage.name === 'idb-keyval') {
    return true;
  }
  
  // Check if the storage object has IndexedDB-specific properties
  if ('options' in storage && storage.options && typeof storage.options === 'object') {
    const options = storage.options as Record<string, unknown>;
    if (options.dbName || options.storeName || options.base) {
      return true;
    }
  }
  
  // Check if the storage object has IndexedDB-specific methods or properties
  if ('_db' in storage || '_store' in storage) {
    return true;
  }
  
  // Check the constructor name or prototype chain
  const constructorName = storage.constructor.name.toLowerCase();
  if (constructorName.includes('indexeddb') || constructorName.includes('idb')) {
    return true;
  }
  
  // Check if the storage object has a driver property that indicates IndexedDB
  if ('driver' in storage && storage.driver) {
    const driver = storage.driver as Record<string, unknown>;
    if (driver.name === 'idb-keyval' || 
        (driver.constructor && typeof driver.constructor === 'function' && 
         driver.constructor.name.toLowerCase().includes('indexeddb')) ||
        (driver.constructor && typeof driver.constructor === 'function' && 
         driver.constructor.name.toLowerCase().includes('idb'))) {
      return true;
    }
  }
  
  // Check if the storage object has a _driver property that indicates IndexedDB
  if ('_driver' in storage && storage._driver) {
    const driver = storage._driver as Record<string, unknown>;
    if (driver.name === 'idb-keyval' || 
        (driver.constructor && typeof driver.constructor === 'function' && 
         driver.constructor.name.toLowerCase().includes('indexeddb')) ||
        (driver.constructor && typeof driver.constructor === 'function' && 
         driver.constructor.name.toLowerCase().includes('idb'))) {
      return true;
    }
  }
  
  // For unstorage, check if the storage object has the right structure
  // This is a fallback for when the driver detection fails
  try {
    // Try to access the internal driver structure
    const anyStorage = storage as unknown as Record<string, unknown>;
    if (anyStorage._driver && typeof anyStorage._driver === 'object' && 
        anyStorage._driver && 'name' in anyStorage._driver && 
        anyStorage._driver.name === 'idb-keyval') {
      return true;
    }
  } catch {
    // Ignore errors in detection
  }
  
  return false;
}

/**
 * Development warning to help prevent misuse of IndexedDB hooks
 */
export function warnIfNotIndexedDB(storage: Storage, hookName: string): void {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && !isIndexedDBDriver(storage)) {
    console.warn(
      `${hookName} is designed for IndexedDB drivers only. ` +
      `You're using a different storage driver. ` +
      `Consider using the regular storage hooks instead.`
    );
  }
}

/**
 * Performance measurement utilities for IndexedDB operations
 */
export class IndexedDBPerformanceMonitor {
  private measurements: Map<string, number[]> = new Map();

  startTimer(operation: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      if (!this.measurements.has(operation)) {
        this.measurements.set(operation, []);
      }
      this.measurements.get(operation)!.push(duration);
    };
  }

  getAverageTime(operation: string): number {
    const times = this.measurements.get(operation);
    if (!times || times.length === 0) return 0;
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  getStats(operation: string): { count: number; avg: number; min: number; max: number } {
    const times = this.measurements.get(operation);
    if (!times || times.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0 };
    }
    
    return {
      count: times.length,
      avg: times.reduce((sum, time) => sum + time, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times)
    };
  }

  clear(): void {
    this.measurements.clear();
  }
}

// Global performance monitor instance
export const indexedDBPerformanceMonitor = new IndexedDBPerformanceMonitor(); 