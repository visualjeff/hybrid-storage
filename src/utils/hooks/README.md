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