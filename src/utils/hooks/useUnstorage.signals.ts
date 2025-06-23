import { useState, useEffect, useCallback, useRef } from 'react';
import type { Storage, StorageValue } from 'unstorage';

// Signal-like storage implementation
export class StorageSignal<T = unknown> {
  private subscribers = new Set<(value: T) => void>();
  private storage: Storage;
  private key: string;
  private defaultValue: T;
  private currentValue: T;

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
      this.currentValue = result !== null ? (result as T) : this.defaultValue;
      this.notify();
    } catch (error) {
      console.error('Error loading storage signal:', error);
    }
  }

  private notify() {
    this.subscribers.forEach(callback => callback(this.currentValue));
  }

  subscribe(callback: (value: T) => void): () => void {
    this.subscribers.add(callback);
    // Immediately call with current value
    callback(this.currentValue);
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  async set(value: T) {
    try {
      await this.storage.setItem(this.key, value as StorageValue);
      this.currentValue = value;
      this.notify();
    } catch (error) {
      console.error('Error setting storage signal:', error);
    }
  }

  async update(updater: (current: T) => T) {
    const newValue = updater(this.currentValue);
    await this.set(newValue);
  }

  get value(): T {
    return this.currentValue;
  }

  async remove() {
    try {
      await this.storage.removeItem(this.key);
      this.currentValue = this.defaultValue;
      this.notify();
    } catch (error) {
      console.error('Error removing storage signal:', error);
    }
  }

  hasSubscribers(): boolean {
    return this.subscribers.size > 0;
  }
}

// Global signal registry
const signalRegistry = new Map<string, StorageSignal<unknown>>();

// Hook that provides signal-like API
export function useStorageSignal<T = unknown>(
  storage: Storage,
  key: string,
  defaultValue: T
) {
  const [value, setValue] = useState<T>(defaultValue);
  const signalRef = useRef<StorageSignal<T> | null>(null);

  useEffect(() => {
    // Get or create signal
    const signalKey = `${key}`;
    let signal = signalRegistry.get(signalKey) as StorageSignal<T> | undefined;
    
    if (!signal) {
      signal = new StorageSignal(storage, key, defaultValue);
      signalRegistry.set(signalKey, signal as StorageSignal<unknown>);
    }

    signalRef.current = signal;
    
    // Subscribe to changes
    const unsubscribe = signal.subscribe((newValue) => {
      setValue(newValue);
    });

    return () => {
      unsubscribe();
      // Clean up signal if no more subscribers
      if (!signal.hasSubscribers()) {
        signalRegistry.delete(signalKey);
      }
    };
  }, [storage, key, defaultValue]);

  const updateValue = useCallback(async (newValue: T | ((current: T) => T)) => {
    if (signalRef.current) {
      if (typeof newValue === 'function') {
        await signalRef.current.update(newValue as (current: T) => T);
      } else {
        await signalRef.current.set(newValue);
      }
    }
  }, []);

  const removeValue = useCallback(async () => {
    if (signalRef.current) {
      await signalRef.current.remove();
    }
  }, []);

  return {
    value,
    set: updateValue,
    update: updateValue,
    remove: removeValue
  };
}

// Computed signal (signal-like computed values)
export function useComputedStorageSignal<T, R>(
  storage: Storage,
  key: string,
  defaultValue: T,
  compute: (value: T) => R
) {
  const { value } = useStorageSignal(storage, key, defaultValue);
  const [computedValue, setComputedValue] = useState<R>(() => compute(value));

  useEffect(() => {
    setComputedValue(compute(value));
  }, [value, compute]);

  return computedValue;
} 