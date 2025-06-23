import { useState, useEffect, useCallback, useRef } from 'react';
import type { Storage, StorageValue } from 'unstorage';

// Signal-like IndexedDB storage implementation
export class IndexedDBSignal<T = unknown> {
  private subscribers = new Set<(value: T) => void>();
  private storage: Storage;
  private key: string;
  private defaultValue: T;
  private currentValue: T;

  constructor(storage: Storage, key: string, defaultValue: T) {
    // Remove driver validation - allow any storage driver to work
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
      console.error('Error loading IndexedDB signal:', error);
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
      // IndexedDB can store objects natively, no need to stringify
      await this.storage.setItem(this.key, value as StorageValue);
      this.currentValue = value;
      this.notify();
    } catch (error) {
      console.error('Error setting IndexedDB signal:', error);
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
      console.error('Error removing IndexedDB signal:', error);
    }
  }

  hasSubscribers(): boolean {
    return this.subscribers.size > 0;
  }
}

// Global signal registry for IndexedDB
const indexedDBSignalRegistry = new Map<string, IndexedDBSignal<unknown>>();

// Hook that provides signal-like API for IndexedDB
export function useIndexedDBSignal<T = unknown>(
  storage: Storage,
  key: string,
  defaultValue: T
) {
  const [value, setValue] = useState<T>(defaultValue);
  const signalRef = useRef<IndexedDBSignal<T> | null>(null);

  useEffect(() => {
    // Get or create signal
    const signalKey = `${key}`;
    let signal = indexedDBSignalRegistry.get(signalKey) as IndexedDBSignal<T> | undefined;
    
    if (!signal) {
      signal = new IndexedDBSignal(storage, key, defaultValue);
      indexedDBSignalRegistry.set(signalKey, signal as IndexedDBSignal<unknown>);
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
        indexedDBSignalRegistry.delete(signalKey);
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

// Computed signal for IndexedDB (signal-like computed values)
export function useComputedIndexedDBSignal<T, R>(
  storage: Storage,
  key: string,
  defaultValue: T,
  compute: (value: T) => R
) {
  const { value } = useIndexedDBSignal(storage, key, defaultValue);
  const [computedValue, setComputedValue] = useState<R>(() => compute(value));

  useEffect(() => {
    setComputedValue(compute(value));
  }, [value, compute]);

  return computedValue;
} 