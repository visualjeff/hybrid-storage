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
    </div>
  );
} 