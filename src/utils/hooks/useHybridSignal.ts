import { useState, useEffect, useCallback, useRef } from 'react';
import type { Storage, StorageValue } from 'unstorage';

export interface UseHybridSignalOptions<T = unknown> {
  defaultValue: T;
  subscribe?: boolean;
  pollInterval?: number; // Default to 2000ms to prevent excessive polling
  onError?: (error: Error) => void;
  // Signal options
  immediate?: boolean; // Whether to update immediately (signal-like) or wait for storage
  debounceMs?: number; // Debounce storage writes for performance
}

// Hybrid signal that combines in-memory reactivity with persistent storage
export class HybridSignal<T = unknown> {
  private subscribers = new Set<(value: T) => void>();
  private storage: Storage;
  private key: string;
  private defaultValue: T;
  private currentValue: T;
  private isInitialized = false;
  private debounceTimeout: number | null = null;
  private lastStorageValue: T | null = null;

  constructor(storage: Storage, key: string, defaultValue: T) {
    this.storage = storage;
    this.key = key;
    this.defaultValue = defaultValue;
    this.currentValue = defaultValue;
    this.load();
  }

  private async load() {
    try {
      const result = await this.storage.getItem(this.key);
      const storageValue = result !== null ? (result as T) : this.defaultValue;
      this.lastStorageValue = storageValue;
      this.currentValue = storageValue;
      this.isInitialized = true;
      this.notify();
    } catch (error) {
      console.error('Error loading hybrid signal:', error);
      this.currentValue = this.defaultValue;
      this.isInitialized = true;
      this.notify();
    }
  }

  private notify() {
    if (this.isInitialized) {
      this.subscribers.forEach(callback => callback(this.currentValue));
    }
  }

  private async persistToStorage(value: T) {
    try {
      await this.storage.setItem(this.key, value as StorageValue);
      this.lastStorageValue = value;
    } catch (error) {
      console.error('Error persisting to storage:', error);
    }
  }

  subscribe(callback: (value: T) => void): () => void {
    this.subscribers.add(callback);
    
    // Immediately call with current value if initialized
    if (this.isInitialized) {
      callback(this.currentValue);
    }
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Signal-like immediate setter
  set(value: T, options: { persist?: boolean; debounce?: boolean } = {}) {
    const { persist = true, debounce = true } = options;
    
    // Update immediately (signal-like behavior)
    this.currentValue = value;
    this.notify();

    // Persist to storage if requested
    if (persist) {
      if (debounce && this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
      }
      
      if (debounce) {
        this.debounceTimeout = window.setTimeout(() => {
          this.persistToStorage(value);
        }, 100); // 100ms debounce
      } else {
        this.persistToStorage(value);
      }
    }
  }

  // Signal-like updater function
  update(updater: (current: T) => T, options?: { persist?: boolean; debounce?: boolean }) {
    const newValue = updater(this.currentValue);
    this.set(newValue, options);
  }

  // Get current value (signal-like)
  get value(): T {
    return this.currentValue;
  }

  // Async setter that waits for storage
  async setAsync(value: T) {
    this.currentValue = value;
    this.notify();
    await this.persistToStorage(value);
  }

  // Async updater that waits for storage
  async updateAsync(updater: (current: T) => T) {
    const newValue = updater(this.currentValue);
    await this.setAsync(newValue);
  }

  // Check if value has changed in storage
  async checkForExternalChanges(): Promise<boolean> {
    try {
      const result = await this.storage.getItem(this.key);
      const storageValue = result !== null ? (result as T) : this.defaultValue;
      
      if (JSON.stringify(storageValue) !== JSON.stringify(this.lastStorageValue)) {
        this.lastStorageValue = storageValue;
        this.currentValue = storageValue;
        this.notify();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking for external changes:', error);
      return false;
    }
  }

  async remove() {
    try {
      await this.storage.removeItem(this.key);
      this.currentValue = this.defaultValue;
      this.lastStorageValue = this.defaultValue;
      this.notify();
    } catch (error) {
      console.error('Error removing hybrid signal:', error);
    }
  }

  hasSubscribers(): boolean {
    return this.subscribers.size > 0;
  }
}

// Global registry for hybrid signals
const hybridSignalRegistry = new Map<string, HybridSignal<unknown>>();

// Main hook that provides the best of both worlds
export function useHybridSignal<T = unknown>(
  storage: Storage,
  key: string,
  options: UseHybridSignalOptions<T>
) {
  const { 
    defaultValue, 
    subscribe = true, 
    pollInterval = 2000, // Increased default to prevent excessive polling
    onError,
    immediate = true,
    debounceMs = 100
  } = options;

  const [value, setValue] = useState<T>(defaultValue);
  const signalRef = useRef<HybridSignal<T> | null>(null);
  const pollIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Get or create signal
    const signalKey = `${key}`;
    let signal = hybridSignalRegistry.get(signalKey) as HybridSignal<T> | undefined;
    
    if (!signal) {
      signal = new HybridSignal(storage, key, defaultValue);
      hybridSignalRegistry.set(signalKey, signal as HybridSignal<unknown>);
    }

    signalRef.current = signal;
    
    // Subscribe to changes
    const unsubscribe = signal.subscribe((newValue) => {
      setValue(newValue);
    });

    // Set up polling for external changes
    if (subscribe && pollInterval > 0) {
      // Safety check: don't poll more frequently than 500ms to prevent browser hanging
      const safePollInterval = Math.max(pollInterval, 500);
      pollIntervalRef.current = window.setInterval(async () => {
        try {
          await signal.checkForExternalChanges();
        } catch (error) {
          onError?.(error as Error);
        }
      }, safePollInterval);
    }

    return () => {
      unsubscribe();
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      // Clean up signal if no more subscribers
      if (!signal.hasSubscribers()) {
        hybridSignalRegistry.delete(signalKey);
      }
    };
  }, [key, subscribe, pollInterval]);

  // Signal-like immediate setter
  const set = useCallback((newValue: T | ((current: T) => T), options?: { persist?: boolean; debounce?: boolean }) => {
    if (signalRef.current) {
      const defaultOptions = {
        persist: immediate, // Use immediate option to determine default persistence
        debounce: debounceMs > 0 // Use debounceMs to determine default debouncing
      };
      const finalOptions = { ...defaultOptions, ...options };
      
      if (typeof newValue === 'function') {
        signalRef.current.update(newValue as (current: T) => T, finalOptions);
      } else {
        signalRef.current.set(newValue, finalOptions);
      }
    }
  }, [immediate, debounceMs]);

  // Async setter that waits for storage
  const setAsync = useCallback(async (newValue: T | ((current: T) => T)) => {
    if (signalRef.current) {
      if (typeof newValue === 'function') {
        await signalRef.current.updateAsync(newValue as (current: T) => T);
      } else {
        await signalRef.current.setAsync(newValue);
      }
    }
  }, []);

  // Remove value
  const remove = useCallback(async () => {
    if (signalRef.current) {
      await signalRef.current.remove();
    }
  }, []);

  // Force check for external changes
  const checkForChanges = useCallback(async () => {
    if (signalRef.current) {
      return await signalRef.current.checkForExternalChanges();
    }
    return false;
  }, []);

  return {
    // State
    value,
    
    // Signal-like setters (immediate)
    set,
    update: set,
    
    // Async setters (wait for storage)
    setAsync,
    updateAsync: setAsync,
    
    // Utilities
    remove,
    checkForChanges,
    
    // Signal-like getter
    get currentValue() {
      return signalRef.current?.value ?? defaultValue;
    }
  };
}

// Computed hybrid signal
export function useComputedHybridSignal<T, R>(
  storage: Storage,
  key: string,
  defaultValue: T,
  compute: (value: T) => R
) {
  const { value } = useHybridSignal(storage, key, { defaultValue });
  const [computedValue, setComputedValue] = useState<R>(() => compute(value));

  useEffect(() => {
    setComputedValue(compute(value));
  }, [value, compute]);

  return computedValue;
} 