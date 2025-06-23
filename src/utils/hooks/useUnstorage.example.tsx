import { useUnstorage } from './useUnstorage';
import type { Storage } from 'unstorage';

interface ExampleProps {
  storage: Storage;
}

export function UnstorageExample({ storage }: ExampleProps) {
  // Basic usage with auto-load
  const { 
    value: basicValue, 
    loading: basicLoading, 
    setValue: setBasicValue 
  } = useUnstorage(storage, "basic:example", {
    defaultValue: "Hello World"
  });

  // Usage without auto-load (manual control)
  const { 
    value: manualValue, 
    loading: manualLoading, 
    loadValue: loadManualValue,
    setValue: setManualValue 
  } = useUnstorage(storage, "manual:example", {
    autoLoad: false
  });

  // Usage with error handling
  const { 
    value: errorValue, 
    error: storageError, 
    setValue: setErrorValue,
    clearError 
  } = useUnstorage(storage, "error:example", {
    onError: (error) => {
      console.error("Custom error handler:", error);
    }
  });

  // Usage with complex data
  const { 
    value: complexValue, 
    setValue: setComplexValue 
  } = useUnstorage<{ name: string; age: number }>(storage, "complex:example", {
    defaultValue: { name: "John", age: 30 }
  });

  // Subscription demo - this will update when other components change the same key
  const { 
    value: subscriptionValue, 
    setValue: setSubscriptionValue 
  } = useUnstorage(storage, "subscription:demo", {
    defaultValue: "Initial value",
    subscribe: true, // Enable real-time updates
    pollInterval: 500 // Check for changes every 500ms
  });

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', margin: '1rem 0' }}>
      <h3>useUnstorage Hook Examples</h3>
      
      {/* Basic Example */}
      <div style={{ marginBottom: '1rem' }}>
        <h4>Basic Usage (Auto-load)</h4>
        {basicLoading ? (
          <p>Loading...</p>
        ) : (
          <div>
            <p>Value: {basicValue}</p>
            <button onClick={() => setBasicValue("Updated at " + new Date().toLocaleTimeString())}>
              Update Basic Value
            </button>
          </div>
        )}
      </div>

      {/* Manual Control Example */}
      <div style={{ marginBottom: '1rem' }}>
        <h4>Manual Control (No Auto-load)</h4>
        {manualLoading ? (
          <p>Loading...</p>
        ) : (
          <div>
            <p>Value: {manualValue || "Not loaded"}</p>
            <button onClick={loadManualValue} style={{ marginRight: '0.5rem' }}>
              Load Value
            </button>
            <button onClick={() => setManualValue("Manual update at " + new Date().toLocaleTimeString())}>
              Set Value
            </button>
          </div>
        )}
      </div>

      {/* Error Handling Example */}
      <div style={{ marginBottom: '1rem' }}>
        <h4>Error Handling</h4>
        {storageError && (
          <div style={{ color: 'red', marginBottom: '0.5rem' }}>
            Error: {storageError.message}
            <button onClick={clearError} style={{ marginLeft: '0.5rem' }}>
              Clear Error
            </button>
          </div>
        )}
        <div>
          <p>Value: {errorValue}</p>
          <button onClick={() => setErrorValue("Error test at " + new Date().toLocaleTimeString())}>
            Test Error Handling
          </button>
        </div>
      </div>

      {/* Complex Data Example */}
      <div style={{ marginBottom: '1rem' }}>
        <h4>Complex Data</h4>
        <div>
          <p>Name: {complexValue?.name}, Age: {complexValue?.age}</p>
          <button onClick={() => setComplexValue({ 
            name: "Jane", 
            age: Math.floor(Math.random() * 50) + 20 
          })}>
            Update Complex Data
          </button>
        </div>
      </div>

      {/* Subscription Demo */}
      <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f0f0f0' }}>
        <h4>🔄 Real-time Subscription Demo</h4>
        <p style={{ fontSize: '0.9em', color: '#666' }}>
          This value will update automatically when changed by other components or external sources.
          Open multiple browser tabs or use the browser console to test!
        </p>
        <div>
          <p><strong>Current Value:</strong> {subscriptionValue}</p>
          <button onClick={() => setSubscriptionValue("Updated via hook at " + new Date().toLocaleTimeString())}>
            Update This Component
          </button>
        </div>
        <div style={{ marginTop: '0.5rem', fontSize: '0.8em', color: '#666' }}>
          <p>💡 Try this in the browser console:</p>
          <code style={{ backgroundColor: '#fff', padding: '0.2rem 0.4rem', borderRadius: '3px' }}>
            localStorage.setItem('subscription:demo', JSON.stringify('Updated from console at ' + new Date().toLocaleTimeString()))
          </code>
        </div>
      </div>
    </div>
  );
} 