import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import { createStorage } from "unstorage";
import indexedDbDriver from "unstorage/drivers/indexedb";
import { useIndexedDBStorage, useIndexedDBSignal, useIndexedDBHybridSignal } from './utils/hooks';
import viteLogo from '/vite.svg'
import './App.css'

// IndexedDB storage configuration
const indexedDBStorage = createStorage({
  driver: indexedDbDriver({ 
    base: 'indexeddb:', 
    dbName: 'IndexedDBTestDatabase', 
    storeName: 'IndexedDBTestStore'
  })
});

// Debug: Log to confirm IndexedDB driver is loaded
console.log('IndexedDB driver loaded:', indexedDbDriver);
console.log('IndexedDB storage created:', indexedDBStorage);

function IndexedDBApp() {
  const [count, setCount] = useState(0)
  
  // Using the IndexedDB-specific useIndexedDBStorage hook
  const { 
    value: storedValue, 
    loading, 
    error, 
    setValue: setStoredValue,
    removeValue: removeStoredValue
  } = useIndexedDBStorage(indexedDBStorage, "indexeddb:test", {
    defaultValue: "IndexedDB test value",
    onError: (error) => console.error('IndexedDB storage error:', error),
    subscribe: true,
    pollInterval: 1000
  });

  // Using IndexedDB signal hook for reactive updates
  const { value: signalValue, set: setSignalValue, remove: removeSignalValue } = useIndexedDBSignal(
    indexedDBStorage, 
    "indexeddb:signal", 
    0
  );

  // Using IndexedDB hybrid signal hook
  const { 
    value: hybridValue, 
    set: setHybridValue, 
    update: updateHybridValue,
    remove: removeHybridValue 
  } = useIndexedDBHybridSignal(indexedDBStorage, "indexeddb:hybrid", {
    defaultValue: { name: "IndexedDB User", score: 100 },
    subscribe: true,
    pollInterval: 1000
  });

  // Debug: Log to confirm hooks are initialized
  useEffect(() => {
    console.log('IndexedDBApp initialized with storage:', indexedDBStorage);
    console.log('Stored value:', storedValue);
    console.log('Signal value:', signalValue);
    console.log('Hybrid value:', hybridValue);
  }, [storedValue, signalValue, hybridValue]);

  // Example of setting a value programmatically
  const handleSetValue = () => {
    setStoredValue("IndexedDB updated value " + Date.now());
  };

  // Example of removing a value
  const handleRemoveValue = () => {
    removeStoredValue();
  };

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank" rel="noreferrer">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React + IndexedDB Storage</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/IndexedDBApp.tsx</code> and save to test HMR
        </p>
        
        {/* IndexedDB Storage Status */}
        <div style={{ marginTop: '2rem', padding: '1rem', border: '2px solid #646cff', borderRadius: '8px' }}>
          <h3>🗄️ IndexedDB Storage Demo</h3>
          {loading && <p>Loading IndexedDB value...</p>}
          {error && <p>Error: {error.message}</p>}
          {storedValue && (
            <p>
              Stored value: <code>{storedValue}</code>
            </p>
          )}
          
          {/* Storage Controls */}
          <div style={{ marginTop: '1rem' }}>
            <button onClick={handleSetValue} style={{ marginRight: '0.5rem' }}>
              Update Value
            </button>
            <button onClick={handleRemoveValue}>
              Remove Value
            </button>
          </div>
        </div>

        {/* IndexedDB Signal Demo */}
        <div style={{ marginTop: '2rem', padding: '1rem', border: '2px solid #646cff', borderRadius: '8px' }}>
          <h3>⚡ IndexedDB Signal Demo</h3>
          <p><strong>Signal Value:</strong> {signalValue}</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <button onClick={() => setSignalValue(signalValue + 1)}>+1</button>
            <button onClick={() => setSignalValue(signalValue - 1)}>-1</button>
            <button onClick={() => setSignalValue(0)}>Reset</button>
            <button onClick={removeSignalValue}>Remove</button>
          </div>
        </div>

        {/* IndexedDB Hybrid Signal Demo */}
        <div style={{ marginTop: '2rem', padding: '1rem', border: '2px solid #646cff', borderRadius: '8px' }}>
          <h3>🚀 IndexedDB Hybrid Signal Demo</h3>
          <p><strong>Name:</strong> {hybridValue?.name}</p>
          <p><strong>Score:</strong> {hybridValue?.score}</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <button onClick={() => updateHybridValue(v => ({ ...v, score: v.score + 10 }))}>
              +10 Score
            </button>
            <button onClick={() => {
              console.log('Updating name...');
              updateHybridValue(v => ({ ...v, name: "Updated User" }));
              console.log('Name updated to:', hybridValue?.name);
            }}>
              Update Name
            </button>
            <button onClick={() => setHybridValue({ name: "Reset User", score: 0 })}>
              Reset
            </button>
            <button onClick={removeHybridValue}>Remove</button>
          </div>
        </div>
      </div>

      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default IndexedDBApp 