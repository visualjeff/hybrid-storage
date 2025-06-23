# IndexedDB Storage Hooks

This directory contains specialized React hooks designed specifically for IndexedDB storage drivers. These hooks provide native object storage capabilities without JSON stringification overhead, while maintaining the same API as the regular storage hooks.

## Why IndexedDB-Specific Hooks?

IndexedDB can store JavaScript objects natively without requiring JSON serialization/deserialization, unlike localStorage, sessionStorage, and cookies which only store strings. This provides:

- **Better Performance**: No JSON.stringify/parse overhead
- **Native Object Storage**: Direct storage of complex objects, arrays, dates, etc. using `setItemRaw` method from `unstorage` to avoid JSON stringification
- **Type Safety**: Better TypeScript support for complex data structures
- **Reduced Memory Usage**: No intermediate string representations

## Available Hooks

### 1. `useIndexedDBStorage`

The basic IndexedDB storage hook, equivalent to `useUnstorage` but optimized for IndexedDB.

```typescript
import { useIndexedDBStorage } from './useIndexedDBStorage';
import { createStorage } from 'unstorage';
import indexeddbDriver from 'unstorage/drivers/indexedb';

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

### 2. `useIndexedDBSignal`

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

### 3. `useIndexedDBHybridSignal`

Hybrid signal that combines in-memory reactivity with persistent IndexedDB storage, equivalent to `useHybridSignal` but optimized for IndexedDB.

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

## Driver Validation

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

## Performance Monitoring

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

## Utility Functions

### `isIndexedDBDriver(storage: Storage): boolean`

Type guard to check if a storage driver is an IndexedDB driver.

### `warnIfNotIndexedDB(storage: Storage, hookName: string): void`

Development warning to help prevent misuse of IndexedDB hooks.

### `notifyIndexedDBChange(key: string): void`

Manually notify subscribers of IndexedDB storage changes.

### `createNotifyingIndexedDBDriver(driver: Storage): Storage`

Create a custom IndexedDB storage driver wrapper that automatically notifies subscribers.

## Migration Guide

### From `useUnstorage` to `useIndexedDBStorage`

```typescript
// Before
const { value, setValue } = useUnstorage(storage, 'key', { defaultValue: 'value' });

// After (for IndexedDB drivers)
const { value, setValue } = useIndexedDBStorage(storage, 'key', { defaultValue: 'value' });
```

### From `useStorageSignal` to `useIndexedDBSignal`

```typescript
// Before
const { value, set } = useStorageSignal(storage, 'key', defaultValue);

// After (for IndexedDB drivers)
const { value, set } = useIndexedDBSignal(storage, 'key', defaultValue);
```

### From `useHybridSignal` to `useIndexedDBHybridSignal`

```typescript
// Before
const { value, set } = useHybridSignal(storage, 'key', { defaultValue });

// After (for IndexedDB drivers)
const { value, set } = useIndexedDBHybridSignal(storage, 'key', { defaultValue });
```

## Best Practices

1. **Use the Right Hook**: Always use IndexedDB-specific hooks with IndexedDB drivers
2. **Type Your Data**: Leverage TypeScript to get better type safety
3. **Handle Errors**: Always handle potential storage errors
4. **Monitor Performance**: Use the performance monitoring utilities for optimization
5. **Validate Drivers**: Use the `isIndexedDBDriver` utility to validate drivers at runtime

## Example Usage

See `useIndexedDBStorage.example.tsx` for a complete example demonstrating all three hooks with performance monitoring and driver validation.

## API Reference

### `useIndexedDBStorage<T>`

```typescript
function useIndexedDBStorage<T>(
  storage: Storage,
  key: string,
  options: UseIndexedDBOptions<T> = {}
): {
  value: T | null;
  loading: boolean;
  error: Error | null;
  setValue: (value: T) => Promise<void>;
  removeValue: () => Promise<void>;
  loadValue: () => Promise<void>;
  hasValue: () => Promise<boolean>;
  getRawValue: () => Promise<unknown>;
  setRawValue: (rawValue: unknown) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}
```

### `useIndexedDBSignal<T>`

```typescript
function useIndexedDBSignal<T>(
  storage: Storage,
  key: string,
  defaultValue: T
): {
  value: T;
  set: (value: T | ((current: T) => T)) => Promise<void>;
  update: (value: T | ((current: T) => T)) => Promise<void>;
  remove: () => Promise<void>;
}
```

### `useIndexedDBHybridSignal<T>`

```typescript
function useIndexedDBHybridSignal<T>(
  storage: Storage,
  key: string,
  options: UseIndexedDBHybridSignalOptions<T>
): {
  value: T;
  set: (value: T | ((current: T) => T), options?: { persist?: boolean; debounce?: boolean }) => void;
  update: (value: T | ((current: T) => T), options?: { persist?: boolean; debounce?: boolean }) => void;
  setAsync: (value: T | ((current: T) => T)) => Promise<void>;
  updateAsync: (value: T | ((current: T) => T)) => Promise<void>;
  remove: () => Promise<void>;
  checkForChanges: () => Promise<boolean>;
  currentValue: T;
}
``` 