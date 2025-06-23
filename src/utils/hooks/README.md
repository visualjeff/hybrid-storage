# useUnstorage Hook

A comprehensive React hook for managing unstorage operations with built-in state management, loading states, and error handling.

## Features

- ✅ **Automatic loading** on component mount
- ✅ **Loading states** for all operations
- ✅ **Error handling** with custom error callbacks
- ✅ **TypeScript support** with generic types
- ✅ **Manual control** options (disable auto-load)
- ✅ **Raw value operations** (get/set without parsing)
- ✅ **Utility functions** (clear errors, reset state)

## Basic Usage

```tsx
import { useUnstorage } from './utils/hooks';

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

## API Reference

### Hook Parameters

```tsx
useUnstorage<T = string>(
  storage: Storage,
  key: string,
  options?: UseUnstorageOptions<T>
)
```

#### Parameters

- `storage`: The unstorage instance
- `key`: The storage key
- `options`: Configuration options (optional)

#### Options

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

### Return Value

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
  getRawValue: () => Promise<string | null>; // Get raw string value
  setRawValue: (value: string) => Promise<void>; // Set raw string value
  
  // Utilities
  clearError: () => void;  // Clear error state
  reset: () => void;       // Reset to default state
}
```

## Advanced Examples

### Manual Control (No Auto-load)

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

### Complex Data Types

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

### Default Value Behavior

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

### Error Handling

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

### Real-time Updates & Subscriptions

The hook automatically subscribes to external changes by default. This means if another component or external source updates the same storage key, all subscribed components will update automatically.

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
```

#### Cross-Component Synchronization

Multiple components can share the same storage key and stay synchronized:

```tsx
// Component A
function ComponentA() {
  const { value, setValue } = useUnstorage(storage, "shared-data");
  
  return (
    <div>
      <p>Value: {value}</p>
      <button onClick={() => setValue("Updated by A")}>
        Update from A
      </button>
    </div>
  );
}

// Component B (will automatically update when Component A changes the value)
function ComponentB() {
  const { value, setValue } = useUnstorage(storage, "shared-data");
  
  return (
    <div>
      <p>Value: {value}</p>
      <button onClick={() => setValue("Updated by B")}>
        Update from B
      </button>
    </div>
  );
}
```

#### External Updates

The hook can detect changes made by external sources (browser console, other tabs, etc.):

```tsx
const { value } = useUnstorage(storage, "external-updates", {
  pollInterval: 500 // Check every 500ms
});

// This will be detected automatically:
// localStorage.setItem('external-updates', JSON.stringify('New value'))
```

#### Manual Notifications

For custom storage drivers, you can manually notify subscribers:

```tsx
import { subscriptionManager } from './utils/hooks';

// In your custom storage driver
subscriptionManager.notifyChange('my-key');
```

### Raw Value Operations

```tsx
const { 
  getRawValue, 
  setRawValue 
} = useUnstorage(storage, "raw-key");

// Get/set raw string values without JSON parsing
const rawValue = await getRawValue();
await setRawValue("raw string value");
```

## Best Practices

1. **Always handle loading states** to provide good UX
2. **Use error boundaries** or error handling for production apps
3. **Set appropriate default values** for better user experience
4. **Use TypeScript generics** for type safety with complex data
5. **Consider disabling auto-load** for performance-critical components

## Migration from Direct unstorage Usage

### Before (Direct usage)
```tsx
const [value, setValue] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadValue = async () => {
    try {
      setLoading(true);
      const result = await storage.getItem(key);
      setValue(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  loadValue();
}, []);
```

### After (With useUnstorage)
```tsx
const { value, loading, error, setValue } = useUnstorage(storage, key);
```

Much cleaner and more maintainable! 🎉 

# Unstorage Hooks with IndexedDB Optimization

This collection of React hooks provides optimized storage functionality with automatic driver detection and performance improvements.

## Features

### 🚀 Automatic IndexedDB Optimization

The hooks automatically detect IndexedDB drivers and use optimized storage methods to avoid unnecessary JSON serialization overhead:

- **Automatic Detection**: Uses multiple heuristics to identify IndexedDB drivers
- **Raw IndexedDB Access**: Bypasses unstorage driver entirely for true native object storage
- **Performance Boost**: Uses `setItemRaw`/`getItemRaw` as fallback for IndexedDB
- **Zero Configuration**: Works automatically without any setup required
- **Backward Compatible**: Falls back to standard methods for other drivers

### Available Hooks

1. **`useUnstorage`** - Main storage hook with full feature set
2. **`useStorageSignal`** - Signal-like API for reactive storage
3. **`useHybridSignal`** - Hybrid approach combining signals with persistent storage

## IndexedDB Optimization Details

### How It Works

When an IndexedDB driver is detected, the hooks automatically:

1. **Extract database info** from the unstorage driver configuration
2. **Create raw IndexedDB wrapper** that bypasses unstorage entirely
3. **Store objects natively** without any JSON stringification
4. **Fallback to setItemRaw** if raw access isn't available

### Performance Benefits

- **Zero JSON overhead** for raw IndexedDB access
- **Native object storage** preserving all object properties and methods
- **Faster storage operations** especially for complex objects
- **Lower memory overhead** during serialization
- **Better responsiveness** in data-intensive applications

### Storage Methods

The optimization provides three levels of performance:

1. **Raw IndexedDB** (Best) - Direct IndexedDB access, no JSON stringification
2. **setItemRaw** (Good) - Single JSON stringify instead of double
3. **Standard** (Baseline) - Normal unstorage behavior

### Driver Detection

The optimization automatically detects IndexedDB drivers using:

```typescript
// Multiple detection methods
if ('name' in storage && storage.name === 'indexeddb') return true;
if ('options' in storage && storage.options?.dbName) return true;
if ('_db' in storage || '_store' in storage) return true;
if (storage.constructor.name.toLowerCase().includes('indexeddb')) return true;
```

## Usage Examples

### Basic Usage (Automatic Optimization)

```typescript
import { useUnstorage } from './utils/hooks';
import { createStorage } from 'unstorage';
import indexedDbDriver from 'unstorage/drivers/indexedb';

const storage = createStorage({
  driver: indexedDbDriver({ 
    base: 'app:', 
    dbName: 'MyDatabase', 
    storeName: 'MyStore' 
  })
});

function MyComponent() {
  const { value, setValue } = useUnstorage(storage, 'my-key', {
    defaultValue: { name: 'John', age: 30 }
  });
  
  // Automatically optimized for IndexedDB!
  // Objects are stored natively without JSON stringification
  return <button onClick={() => setValue({ name: 'Jane', age: 25 })}>
    Update Value
  </button>;
}
```

### Performance Testing

```typescript
import { compareStoragePerformance, getStorageMethodInfo } from './utils/hooks';

// Check what storage method is being used
const storageInfo = getStorageMethodInfo(storage);
console.log('Storage method:', storageInfo.method);

// Test performance difference
const result = await compareStoragePerformance(
  storage, 
  'test-key', 
  { complex: 'data' }, 
  1000
);

console.log(`Performance improvement: ${result.improvement.toFixed(1)}%`);
```

## API Reference

### `isIndexedDBDriver(storage: Storage): boolean`

Detects if a storage driver is an IndexedDB driver.

### `isUsingRawIndexedDB(storage: Storage): boolean`

Checks if we're using raw IndexedDB storage (true object storage without JSON stringification).

### `getStorageMethodInfo(storage: Storage): { isIndexedDB: boolean; isRawIndexedDB: boolean; method: string }`

Gets detailed information about the storage method being used.

### `setStorageValueOptimized(storage: Storage, key: string, value: unknown): Promise<void>`

Optimized setter that automatically chooses the best method based on driver type.

### `getStorageValueOptimized(storage: Storage, key: string): Promise<unknown>`

Optimized getter that automatically chooses the best method based on driver type.

### `compareStoragePerformance(storage: Storage, key: string, testValue: unknown, iterations?: number): Promise<{ optimized: number; standard: number; improvement: number }>`

Compares performance between optimized and standard approaches.

## Browser Support

- **Chrome**: Full support
- **Firefox**: Full support  
- **Safari**: Full support
- **Edge**: Full support

## Performance Notes

- **Raw IndexedDB** provides the best performance for complex objects
- **setItemRaw** provides good performance improvement over standard methods
- The optimization is most beneficial for complex objects and frequent operations
- Simple string values see minimal benefit
- The performance improvement varies based on object complexity and browser implementation
- For best results, use with IndexedDB drivers and complex data structures

## Troubleshooting

### Objects Still Being Stringified

If you're still seeing JSON strings in storage, check:

1. **Driver Configuration**: Ensure your IndexedDB driver has `dbName` and `storeName` options
2. **Browser Support**: Verify IndexedDB is available in your browser
3. **Storage Method**: Use `getStorageMethodInfo()` to see which method is being used

### Performance Not Improving

If you're not seeing performance improvements:

1. **Check Storage Method**: Use `getStorageMethodInfo()` to verify optimization is active
2. **Test with Complex Objects**: Simple strings won't show significant improvement
3. **Increase Test Iterations**: Use more iterations in performance tests for accurate results 