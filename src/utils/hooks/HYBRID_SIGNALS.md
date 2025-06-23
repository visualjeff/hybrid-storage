# 🚀 Hybrid Signal System - Best of Both Worlds

The Hybrid Signal System combines the **immediate reactivity of signals** with the **persistence and cross-tab synchronization of storage**. This gives you the performance of signals with the persistence of storage.

## 🎯 What Problem Does This Solve?

### Traditional Signals (SolidJS, Vue 3, etc.)
- ✅ **Immediate updates** - UI responds instantly
- ✅ **Excellent performance** - No async operations
- ❌ **No persistence** - Lost on page refresh
- ❌ **No cross-tab sync** - Single app instance only

### Storage-Based Systems
- ✅ **Persistent** - Survives page refresh
- ✅ **Cross-tab sync** - Multiple tabs stay in sync
- ❌ **Async updates** - UI waits for storage
- ❌ **Polling overhead** - Performance impact

### Hybrid Signal System
- ✅ **Immediate updates** - UI responds instantly (like signals)
- ✅ **Persistent storage** - Survives page refresh
- ✅ **Cross-tab sync** - Multiple tabs stay in sync
- ✅ **Configurable performance** - Choose your trade-offs
- ✅ **Debounced writes** - Optimize storage performance
- ✅ **Native IndexedDB Storage** - Uses `setItemRaw` for storing objects as-is in IndexedDB without JSON stringification

## 🚀 Quick Start

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

## 📚 API Reference

### `useHybridSignal<T>`

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

#### Options

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

### `useComputedHybridSignal<T, R>`

```tsx
const computedValue = useComputedHybridSignal(
  storage, 
  key, 
  defaultValue, 
  computeFunction
);
```

## 🎛️ Usage Patterns

### 1. **Immediate Updates (Signal-like)**
```tsx
const { value, set } = useHybridSignal(storage, "counter", { defaultValue: 0 });

// Updates immediately, storage writes are debounced
set(value + 1);
set(prev => prev + 1);
```

### 2. **Async Updates (Storage-first)**
```tsx
const { value, setAsync } = useHybridSignal(storage, "important-data", { defaultValue: {} });

// Waits for storage to complete
await setAsync(newData);
```

### 3. **Performance Optimization**
```tsx
const { set } = useHybridSignal(storage, "frequent-updates", { defaultValue: 0 });

// Memory only (no storage writes)
set(value + 1, { persist: false });

// Immediate storage (no debouncing)
set(value + 1, { persist: true, debounce: false });

// Debounced storage (default)
set(value + 1, { persist: true, debounce: true });
```

### 4. **Complex Object Management**
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

### 5. **Computed Values**
```tsx
const { value } = useHybridSignal(storage, "user", { defaultValue: { age: 30 } });

// Computed values that update automatically
const isAdult = useComputedHybridSignal(storage, "user", { age: 30 }, u => u.age >= 18);
const ageInDays = useComputedHybridSignal(storage, "user", { age: 30 }, u => u.age * 365);
```

## ⚡ Performance Comparison

| Operation | Traditional Signals | Storage-Based | Hybrid Signal |
|-----------|-------------------|---------------|---------------|
| **UI Updates** | ✅ Immediate | ⏳ Async | ✅ Immediate |
| **Storage Writes** | ❌ None | ✅ Immediate | ⏳ Debounced |
| **Cross-tab Sync** | ❌ No | ✅ Yes | ✅ Yes |
| **Persistence** | ❌ No | ✅ Yes | ✅ Yes |
| **Memory Usage** | ✅ Low | ⚡ Medium | ⚡ Medium |
| **CPU Usage** | ✅ Low | ⚡ Medium | ✅ Low |

## 🔧 Advanced Features

### Custom Error Handling
```tsx
const { value, set } = useHybridSignal(storage, "data", {
  defaultValue: null,
  onError: (error) => {
    console.error('Storage error:', error);
    // Show user notification, retry logic, etc.
  }
});
```

### Manual Change Detection
```tsx
const { value, checkForChanges } = useHybridSignal(storage, "data", { defaultValue: 0 });

// Force check for external changes
const hasChanges = await checkForChanges();
if (hasChanges) {
  console.log('External changes detected!');
}
```

### Disable Subscriptions
```tsx
const { value, set } = useHybridSignal(storage, "local-data", {
  defaultValue: 0,
  subscribe: false, // No external change detection
  pollInterval: 0   // No polling
});
```

## 🎯 Best Practices

### 1. **Choose the Right Pattern**
- **UI State**: Use immediate updates (`set`)
- **Important Data**: Use async updates (`setAsync`)
- **Frequent Updates**: Use debounced storage
- **Temporary Data**: Use memory-only updates

### 2. **Optimize Performance**
```tsx
// For rapid updates (like counters, sliders)
const { set } = useHybridSignal(storage, "counter", {
  defaultValue: 0,
  debounceMs: 200 // Longer debounce for better performance
});

// For important data (like form data)
const { setAsync } = useHybridSignal(storage, "form-data", {
  defaultValue: {},
  debounceMs: 0 // No debounce for immediate persistence
});
```

### 3. **Handle Loading States**
```tsx
const { value, setAsync } = useHybridSignal(storage, "data", { defaultValue: null });
const [isSaving, setIsSaving] = useState(false);

const handleSave = async () => {
  setIsSaving(true);
  try {
    await setAsync(newData);
  } finally {
    setIsSaving(false);
  }
};
```

### 4. **Type Safety**
```tsx
interface User {
  name: string;
  age: number;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

const { value: user, update } = useHybridSignal<User>(storage, "user", {
  defaultValue: {
    name: "John",
    age: 30,
    preferences: { theme: "dark", notifications: true }
  }
});

// TypeScript will ensure type safety
update(u => ({ ...u, age: u.age + 1 }));
```

## 🔄 Migration Guide

### From Traditional Signals
```tsx
// Before (SolidJS style)
const count = signal(0);
const doubled = computed(() => count.value * 2);

// After (Hybrid Signal)
const { value: count, set } = useHybridSignal(storage, "count", { defaultValue: 0 });
const doubled = useComputedHybridSignal(storage, "count", 0, v => v * 2);
```

### From Storage-Based Hooks
```tsx
// Before
const { value, setValue } = useUnstorage(storage, "data", { defaultValue: 0 });

// After (immediate updates)
const { value, set } = useHybridSignal(storage, "data", { defaultValue: 0 });
```

## 🎉 Benefits

1. **🚀 Performance**: Immediate UI updates like signals
2. **💾 Persistence**: Data survives page refresh
3. **🔄 Synchronization**: Cross-tab and cross-window sync
4. **⚡ Flexibility**: Choose your performance trade-offs
5. **🛡️ Type Safety**: Full TypeScript support
6. **🔧 Configurable**: Fine-tune for your use case

The Hybrid Signal System gives you the best of both worlds - the performance and developer experience of signals with the persistence and synchronization capabilities of storage-based systems! 🎯 