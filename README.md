# Hybrid-Storage

This repository contains a set of React hooks for managing storage operations using the [unstorage](https://unstorage.unjs.io/) library, with specialized hooks for IndexedDB and hybrid signal systems. Below is the comprehensive documentation for all available hooks.

## Table of Contents
- [useUnstorage Hook](#useunstorage-hook)
- [IndexedDB Storage Hooks](#indexeddb-storage-hooks)
- [Hybrid Signal System](#hybrid-signal-system)

## useUnstorage Hook

A comprehensive React hook for managing unstorage operations with built-in state management, loading states, and error handling. **Note**: For signal-like behavior with storage, refer to related hooks such as `useStorageSignal` discussed in later sections.

### Features

- ✅ **Automatic loading** on component mount
- ✅ **Loading states** for all operations
- ✅ **Error handling** with custom error callbacks
- ✅ **TypeScript support** with generic types
- ✅ **Manual control** options (disable auto-load)
- ✅ **Raw value operations** (get/set without JSON stringify and parsing; particularly optimized for [IndexedDB drivers](https://unstorage.unjs.io/drivers/browser#indexeddb))
- ✅ **Utility functions** (clear errors, reset state)

### Basic Usage

```tsx
import { useUnstorage } from './utils/hooks';
import { createStorage } from 'unstorage';
import localStorageDriver from 'unstorage/drivers/localStorage';

// Create a storage instance
const storage = createStorage({
  driver: localStorageDriver()
});

function MyComponent() {
  const { 
    value, 
    loading, 
    error, 
    setValue, 
    removeValue 
  } = useUnstorage(storage, "my-key", {
    defaultValue: "Hello World"
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <p>Value: {value}</p>
      <button onClick={() => setValue("New Value")}>
        Update Value
      </button>
      <button onClick={removeValue}>
        Remove Value
      </button>
    </div>
  );
}
```

### API Reference

#### Hook Parameters

```tsx
useUnstorage<T = string>(
  storage: Storage,
  key: string,
  options?: UseUnstorageOptions<T>
)
```

##### Parameters

- `storage`: The unstorage instance
- `key`: The storage key
- `options`: Configuration options (optional)

##### Options

```tsx
interface UseUnstorageOptions<T = string> {
  defaultValue?: T;        // Default value if key doesn't exist
  autoLoad?: boolean;      // Auto-load value on mount (default: true)
  onError?: (error: Error) => void;  // Custom error handler
  fallbackToDefault?: boolean;  // Fall back to defaultValue when key doesn't exist (default: true)
  subscribe?: boolean;     // Subscribe to external changes (default: true)
  pollInterval?: number;   // Polling interval in ms for change detection (default: 1000)
}
```

#### Return Value

```tsx
{
  // State
  value: T | null;         // Current value
  loading: boolean;        // Loading state
  error: Error | null;     // Error state
  
  // Actions
  setValue: (value: T) => Promise<void>;     // Set value
  removeValue: () => Promise<void>;          // Remove value
  loadValue: () => Promise<void>;            // Manually load value
  hasValue: () => Promise<boolean>;          // Check if key exists
  getRawValue: () => Promise<string | null>; // Get raw string value (particularly useful with IndexedDB for non-string data)
  setRawValue: (value: string) => Promise<void>; // Set raw string value (particularly useful with IndexedDB for non-string data)
  
  // Utilities
  clearError: () => void;  // Clear error state
  reset: () => void;       // Reset to default state
}
```

### Advanced Examples

#### Manual Control (No Auto-load)

```tsx
const { 
  value, 
  loading, 
  loadValue, 
  setValue 
} = useUnstorage(storage, "manual-key", {
  autoLoad: false
});

// Value won't load automatically
// Call loadValue() when you want to load it
```

#### Complex Data Types

```tsx
interface User {
  name: string;
  age: number;
}

const { value, setValue } = useUnstorage<User>(storage, "user", {
  defaultValue: { name: "John", age: 30 }
});

// TypeScript will ensure type safety
setValue({ name: "Jane", age: 25 });
```

#### Default Value Behavior

By default, the hook will fall back to the `defaultValue` when:
- The storage key doesn't exist (returns `null`)
- The value is removed from storage

You can disable this behavior by setting `fallbackToDefault: false`:

```tsx
const { value, setValue, removeValue } = useUnstorage(storage, "key", {
  defaultValue: "Hello",
  fallbackToDefault: false  // Will use null instead of defaultValue
});

// After removeValue(), value will be null instead of "Hello"
```

#### Error Handling

```tsx
const { 
  value, 
  error, 
  setValue, 
  clearError 
} = useUnstorage(storage, "error-key", {
  onError: (error) => {
    console.error("Storage operation failed:", error);
    // Custom error handling logic
  }
});
```

#### Real-time Updates & Subscriptions

The hook automatically subscribes to external changes by default. This means if another component or external source updates the same storage key, all subscribed components will update automatically. **Note**: Detection of external changes may vary by driver; for some drivers like cookies, changes might be detected with a delay based on the polling interval or might require specific driver support.

```tsx
// Basic subscription (enabled by default)
const { value, setValue } = useUnstorage(storage, "shared-key", {
  defaultValue: "Hello",
  subscribe: true, // Default behavior
  pollInterval: 1000 // Check for changes every second
});

// Disable subscription for performance
const { value, setValue } = useUnstorage(storage, "local-key", {
  subscribe: false // No real-time updates
});

// Custom polling interval
const { value, setValue } = useUnstorage(storage, "fast-updates", {
  pollInterval: 100 // Check every 100ms for faster updates
});

// Disable polling but keep subscription
const { value, setValue } = useUnstorage(storage, "no-polling", {
  subscribe: true,
  pollInterval: 0 // Disables polling, only in-tab updates will be detected
});
```

##### Cross-Component Synchronization

Multiple components can share the same storage key and stay synchronized:

```tsx
// Component A
function ComponentA() {
  const { value, setValue } = useUnstorage(storage, "shared-data");
  // ... component logic
}

// Component B
function ComponentB() {
  const { value, setValue } = useUnstorage(storage, "shared-data");
  // ... component logic
}
```

## IndexedDB Storage Hooks

This section covers a collection of specialized React hooks designed specifically for [IndexedDB drivers](https://unstorage.unjs.io/drivers/browser#indexeddb). These hooks provide native object storage capabilities without JSON stringification overhead, while maintaining the same API as the regular storage hooks.

### Why IndexedDB-Specific Hooks?

IndexedDB can store JavaScript objects natively without requiring JSON serialization/deserialization, unlike localStorage, sessionStorage, and cookies which only store strings. This provides:

- **Better Performance**: No JSON.stringify/parse overhead
- **Native Object Storage**: Direct storage of complex objects, arrays, dates, etc. using `setItemRaw` method from `unstorage` to avoid JSON stringification
- **Type Safety**: Better TypeScript support for complex data structures
- **Reduced Memory Usage**: No intermediate string representations

### Available Hooks

#### 1. `useIndexedDBStorage`

The basic IndexedDB storage hook, equivalent to `useUnstorage` but optimized for IndexedDB.

**Note**: The API for `useIndexedDBStorage` is consistent with `useUnstorage`, providing the same return value structure and options for ease of use and migration.

```typescript
import { useIndexedDBStorage } from './useIndexedDBStorage';
import { createStorage } from 'unstorage';
import indexeddbDriver from 'unstorage/drivers/indexedb';

// Create a storage instance for IndexedDB
const storage = createStorage({
  driver: indexeddbDriver({ base: 'my-app' })
});

function MyComponent() {
  const { value, setValue, loading, error } = useIndexedDBStorage<User>(
    storage,
    'user-profile',
    {
      defaultValue: { name: 'Default User', email: 'default@example.com' }
    }
  );

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      <pre>{JSON.stringify(value, null, 2)}</pre>
      <button onClick={() => setValue({ name: 'John', email: 'john@example.com' })}>
        Update User
      </button>
    </div>
  );
}
```

#### 2. `useIndexedDBSignal`

Signal-like IndexedDB storage hook, equivalent to `useStorageSignal` but optimized for IndexedDB.

```typescript
import { useIndexedDBSignal } from './useIndexedDBSignal';

function TodoList() {
  const { value: todos, set: setTodos } = useIndexedDBSignal<Todo[]>(
    storage,
    'todos',
    []
  );

  const addTodo = async (text: string) => {
    const newTodo = { id: Date.now().toString(), text, completed: false };
    await setTodos([...todos, newTodo]);
  };

  return (
    <div>
      {todos.map(todo => (
        <div key={todo.id}>
          <input 
            type="checkbox" 
            checked={todo.completed}
            onChange={() => setTodos(todos.map(t => 
              t.id === todo.id ? { ...t, completed: !t.completed } : t
            ))}
          />
          {todo.text}
        </div>
      ))}
    </div>
  );
}
```

#### 3. `useIndexedDBHybridSignal`

Hybrid signal that combines in-memory reactivity with persistent IndexedDB storage, equivalent to `useHybridSignal` but optimized for IndexedDB.

**Note**: Unlike `useUnstorage` and `useIndexedDBStorage`, this hook uses a signal-like API with methods such as `set` and `update` for immediate reactivity, while still maintaining persistence.

```typescript
import { useIndexedDBHybridSignal } from './useIndexedDBHybridSignal';

function AppSettings() {
  const { value: settings, set: setSettings } = useIndexedDBHybridSignal<AppSettings>(
    storage,
    'app-settings',
    {
      defaultValue: { theme: 'light', language: 'en', autoSave: true },
      immediate: true,
      debounceMs: 200
    }
  );

  return (
    <div>
      <select 
        value={settings.theme}
        onChange={(e) => setSettings(prev => ({ ...prev, theme: e.target.value }))}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      
      <label>
        <input 
          type="checkbox"
          checked={settings.autoSave}
          onChange={(e) => setSettings(prev => ({ ...prev, autoSave: e.target.checked }))}
        />
        Auto Save
      </label>
    </div>
  );
}
```

### Driver Validation

All IndexedDB hooks include runtime validation to ensure they're used with IndexedDB drivers:

```typescript
// This will throw an error if used with localStorage
const localStorage = createStorage({
  driver: localStorageDriver()
});

// ❌ This will throw an error
const { value } = useIndexedDBStorage(localStorage, 'key', { defaultValue: 'value' });

// ✅ This works correctly
const indexedDBStorage = createStorage({
  driver: indexeddbDriver({ base: 'my-app' })
});
const { value } = useIndexedDBStorage(indexedDBStorage, 'key', { defaultValue: 'value' });
```

### Performance Monitoring

The hooks include built-in performance monitoring utilities:

```typescript
import { indexedDBPerformanceMonitor } from './useIndexedDBStorage.utils';

// Measure operation performance
const stopTimer = indexedDBPerformanceMonitor.startTimer('user-update');
await updateUser();
stopTimer();

// Get performance statistics
const stats = indexedDBPerformanceMonitor.getStats('user-update');
console.log(`Average time: ${stats.avg.toFixed(2)}ms`);
```

### Utility Functions

#### `isIndexedDBDriver(storage: Storage): boolean`

Type guard to check if a storage driver is an IndexedDB driver.

#### `warnIfNotIndexedDB(storage: Storage, hookName: string): void`

Development warning to help prevent misuse of IndexedDB hooks.

#### `notifyIndexedDBChange(key: string): void`

Manually notify subscribers of IndexedDB storage changes.

#### `createNotifyingIndexedDBDriver(driver: Storage): Storage`

Create a custom IndexedDB storage driver wrapper that automatically notifies subscribers.

### Migration Guide

#### From `useUnstorage` to `useIndexedDBStorage`

```typescript
// Before
const { value, setValue } = useUnstorage(storage, 'key', { defaultValue: 'value' });

// After (for IndexedDB drivers)
const { value, setValue } = useIndexedDBStorage(storage, 'key', { defaultValue: 'value' });
```

#### From `useStorageSignal` to `useIndexedDBSignal`

```typescript
// Before
// const { value, set } = useStorageSignal(storage, 'key', defaultValue);

// After (for IndexedDB drivers)
const { value, set } = useIndexedDBSignal(storage, 'key', defaultValue);
```

## Hybrid Signal System

The Hybrid Signal System combines the **immediate reactivity of signals** with the **persistence and cross-tab synchronization of storage**. This gives you the performance of signals with the persistence of storage.

### 🎯 What Problem Does This Solve?

#### Traditional Signals (SolidJS, Vue 3, etc.)
- ✅ **Immediate updates** - UI responds instantly
- ✅ **Excellent performance** - No async operations
- ❌ **No persistence** - Lost on page refresh
- ❌ **No cross-tab sync** - Single app instance only

#### Storage-Based Systems
- ✅ **Persistent** - Survives page refresh
- ✅ **Cross-tab sync** - Multiple tabs stay in sync
- ❌ **Async updates** - UI waits for storage
- ❌ **Polling overhead** - Performance impact

#### Hybrid Signal System
- ✅ **Immediate updates** - UI responds instantly (like signals)
- ✅ **Persistent storage** - Survives page refresh
- ✅ **Cross-tab sync** - Multiple tabs stay in sync
- ✅ **Configurable performance** - Choose your trade-offs
- ✅ **Debounced writes** - Optimize storage performance
- ✅ **Native IndexedDB Storage** - Uses `setItemRaw` for storing objects as-is in IndexedDB without JSON stringification
- ✅ **Simultaneous signals and polling** - Supports immediate signal updates alongside polling for external change detection

**Note**: This dual mechanism of signals and polling is crucial for collaborative, real-time applications where both user experience and data consistency are priorities.

### 🚀 Quick Start

```tsx
import { useHybridSignal, useComputedHybridSignal } from './utils/hooks';

function MyComponent() {
  // Basic hybrid signal
  const { value, set, update, setAsync } = useHybridSignal(storage, "count", {
    defaultValue: 0,
    subscribe: true,
    pollInterval: 500,
    immediate: true,
    debounceMs: 100
  });

  // Computed hybrid signal
  const doubled = useComputedHybridSignal(storage, "count", 0, v => v * 2);

  return (
    <div>
      <p>Count: {value}</p>
      <p>Doubled: {doubled}</p>
      <button onClick={() => set(value + 1)}>+1 (Immediate)</button>
      <button onClick={() => setAsync(value + 10)}>+10 (Async)</button>
    </div>
  );
}
```

### 📚 API Reference

#### `useHybridSignal<T>`

```tsx
const { 
  value,           // Current value
  set,             // Signal-like immediate setter
  update,          // Signal-like updater function
  setAsync,        // Async setter (waits for storage)
  updateAsync,     // Async updater (waits for storage)
  remove,          // Remove value
  checkForChanges, // Force check for external changes
  currentValue     // Signal-like getter
} = useHybridSignal(storage, key, options);
```

##### Options

```tsx
interface UseHybridSignalOptions<T> {
  defaultValue: T;           // Required: Default value
  subscribe?: boolean;       // Subscribe to external changes (default: true)
  pollInterval?: number;     // Polling interval in ms (default: 1000)
  onError?: (error: Error) => void;  // Error handler
  immediate?: boolean;       // Immediate updates (default: true)
  debounceMs?: number;       // Debounce storage writes (default: 100)
}
```

#### `useComputedHybridSignal<T, R>`

```tsx
const computedValue = useComputedHybridSignal(
  storage, 
  key, 
  defaultValue, 
  computeFunction
);
```

### 🎛️ Usage Patterns

#### 1. **Immediate Updates (Signal-like)**
```tsx
const { value, set } = useHybridSignal(storage, "counter", { defaultValue: 0 });

// Updates immediately, storage writes are debounced
set(value + 1);
set(prev => prev + 1);
```

#### 2. **Async Updates (Storage-first)**
```tsx
const { value, setAsync } = useHybridSignal(storage, "important-data", { defaultValue: {} });

// Waits for storage to complete
await setAsync(newData);
```

#### 3. **Performance Optimization**
```tsx
const { set } = useHybridSignal(storage, "frequent-updates", { defaultValue: 0 });

// Memory only (no storage writes)
set(value + 1, { persist: false });

// Immediate storage (no debouncing)
set(value + 1, { persist: true, debounce: false });

// Debounced storage (default)
set(value + 1, { persist: true, debounce: true });
```

#### 4. **Complex Object Management**
```tsx
const { value: user, update } = useHybridSignal(storage, "user", {
  defaultValue: { name: "John", age: 30, preferences: { theme: "dark" } }
});

// Immutable updates (like signals)
update(u => ({ ...u, age: u.age + 1 }));
update(u => ({ 
  ...u, 
  preferences: { ...u.preferences, theme: "light" }
}));
```

#### 5. **Computed Values**
```tsx
// Used to establish a base signal with useHybridSignal that holds the user's data (specifically their age)
const { value: userData } = useHybridSignal(storage, "user", { defaultValue: { age: 30 } });

// Computed values that update automatically based on the base signal
const isAdult = useComputedHybridSignal(storage, "user", { age: 30 }, u => u.age >= 18);
const ageInDays = useComputedHybridSignal(storage, "user", { age: 30 }, u => u.age * 365);

// These computed values react to changes in userData.age
console.log(`User is adult: ${isAdult}`);
console.log(`Age in days: ${ageInDays}`);
```

### ⚡ Performance Comparison

| Operation | Traditional Signals | Storage-Based | Hybrid Signal |
|-----------|-------------------|---------------|---------------|
| **UI Updates** | ✅ Immediate | ⏳ Async | ✅ Immediate |
| **Storage Writes** | ❌ None | ✅ Immediate | ⏳ Debounced |
| **Cross-tab Sync** | ❌ No | ✅ Yes | ✅ Yes |
| **Persistence** | ❌ No | ✅ Yes | ✅ Yes |
| **Memory Usage** | ✅ Low | ⚡ Medium | ⚡ Medium |
| **CPU Usage** | ✅ Low | ⚡ Medium | ✅ Low |

### 🔧 Advanced Features

#### Custom Error Handling
```tsx
const { value, set } = useHybridSignal(storage, "data", {
  defaultValue: null,
  onError: (error) => {
    console.error('Storage error:', error);
    // Show user notification, retry logic, etc.
  }
});
```

#### Manual Change Detection
```tsx
const { value, checkForChanges } = useHybridSignal(storage, "data", { defaultValue: 0 });

// Force check for external changes
const hasChanges = await checkForChanges();
if (hasChanges) {
  console.log('External changes detected!');
}
```

#### Disable Subscriptions
```tsx
const { value, set } = useHybridSignal(storage, "local-data", {
  defaultValue: 0,
  subscribe: false, // No external change detection
  pollInterval: 0   // No polling
});
```

### 🎯 Best Practices

// ... TODO ...