import { useState } from 'react'
import reactLogo from './assets/react.svg'
import { createStorage } from "unstorage";
import localStorageDriver from "unstorage/drivers/localstorage";
//import sessionStorageDriver from "unstorage/drivers/sessionstorage";
//import indexedDbDriver from "unstorage/drivers/indexedb";
// import cookieDriver from "./utils/drivers/cookie";
import { useUnstorage } from './utils/hooks';
import { HybridSignalDemo } from './utils/hooks/hybrid-signal-demo';
import viteLogo from '/vite.svg'
import './App.css'

// Regular storage using localStorage
const storage = createStorage({
  driver: localStorageDriver({ base: 'app:'}) // local storage
  //driver: sessionStorageDriver({ base: 'app:'}) // session storage
  //driver: indexedDbDriver({ base: 'app:', dbName: 'TestDatabase', storeName: 'TestStore'}), // indexed db
  //driver: cookieDriver({ prefix: 'app:' }) // cookie
});

function App() {
  const [count, setCount] = useState(0)
  
  // Using the custom useUnstorage hook for all storage operations
  const { 
    value: storedValue, 
    loading, 
    error, 
    setValue: setStoredValue,
    removeValue: removeStoredValue
  } = useUnstorage(storage, "foo:bar", {
    defaultValue: "test123",
    onError: (error) => console.error('Storage error:', error),
    subscribe: true, // Enable real-time updates
    pollInterval: 1000 // Check for changes every second
  });

  // Example of setting a value programmatically
  const handleSetValue = () => {
    setStoredValue("updated value " + Date.now());
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
      <h1>Vite + React + Unstorage</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
        
        {/* Storage Status */}
        {loading && <p>Loading storage value...</p>}
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

      {/* Hybrid Signal Demo */}
      <HybridSignalDemo storage={storage} />

      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
