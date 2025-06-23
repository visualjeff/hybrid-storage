import { useState } from 'react';
import { createStorage } from 'unstorage';
import indexeddbDriver from 'unstorage/drivers/indexedb';
import { useUnstorage, useIndexedDBStorage } from './index';

// Create IndexedDB storage instance
const storage = createStorage({
  driver: indexeddbDriver({ base: 'hook-comparison' })
});

// Complex object type for testing
interface ComplexObject {
  id: string;
  name: string;
  data: {
    numbers: number[];
    nested: {
      value: string;
      timestamp: Date;
    };
  };
  metadata: Record<string, unknown>;
}

export function HookComparisonDemo() {
  const [activeTab, setActiveTab] = useState<'comparison' | 'performance'>('comparison');

  // Regular hook with IndexedDB driver
  const regularHook = useUnstorage<ComplexObject>(
    storage,
    'regular-hook-test',
    {
      defaultValue: {
        id: 'default',
        name: 'Default Object',
        data: {
          numbers: [1, 2, 3],
          nested: {
            value: 'default',
            timestamp: new Date()
          }
        },
        metadata: { source: 'regular-hook' }
      }
    }
  );

  // IndexedDB-specific hook
  const indexedDBHook = useIndexedDBStorage<ComplexObject>(
    storage,
    'indexeddb-hook-test',
    {
      defaultValue: {
        id: 'default',
        name: 'Default Object',
        data: {
          numbers: [1, 2, 3],
          nested: {
            value: 'default',
            timestamp: new Date()
          }
        },
        metadata: { source: 'indexeddb-hook' }
      }
    }
  );

  // Performance test functions
  const testRegularHook = async () => {
    const start = performance.now();
    const testObject: ComplexObject = {
      id: 'test-' + Date.now(),
      name: 'Performance Test Object',
      data: {
        numbers: Array.from({ length: 1000 }, (_, i) => i),
        nested: {
          value: 'performance test',
          timestamp: new Date()
        }
      },
      metadata: {
        testType: 'regular',
        size: 'large',
        timestamp: Date.now()
      }
    };
    
    await regularHook.setValue(testObject);
    const end = performance.now();
    return end - start;
  };

  const testIndexedDBHook = async () => {
    const start = performance.now();
    const testObject: ComplexObject = {
      id: 'test-' + Date.now(),
      name: 'Performance Test Object',
      data: {
        numbers: Array.from({ length: 1000 }, (_, i) => i),
        nested: {
          value: 'performance test',
          timestamp: new Date()
        }
      },
      metadata: {
        testType: 'indexeddb',
        size: 'large',
        timestamp: Date.now()
      }
    };
    
    await indexedDBHook.setValue(testObject);
    const end = performance.now();
    return end - start;
  };

  const [performanceResults, setPerformanceResults] = useState<{
    regular: number[];
    indexeddb: number[];
  }>({ regular: [], indexeddb: [] });

  const runPerformanceTest = async () => {
    const results = { regular: [] as number[], indexeddb: [] as number[] };
    
    for (let i = 0; i < 5; i++) {
      results.regular.push(await testRegularHook());
      results.indexeddb.push(await testIndexedDBHook());
    }
    
    setPerformanceResults(results);
  };

  const updateRegularObject = () => {
    const newObject: ComplexObject = {
      id: 'updated-' + Date.now(),
      name: 'Updated Regular Object',
      data: {
        numbers: Array.from({ length: Math.floor(Math.random() * 100) + 1 }, () => Math.random()),
        nested: {
          value: 'updated regular',
          timestamp: new Date()
        }
      },
      metadata: {
        updateCount: (regularHook.value?.metadata?.updateCount as number || 0) + 1,
        lastUpdate: Date.now()
      }
    };
    regularHook.setValue(newObject);
  };

  const updateIndexedDBObject = () => {
    const newObject: ComplexObject = {
      id: 'updated-' + Date.now(),
      name: 'Updated IndexedDB Object',
      data: {
        numbers: Array.from({ length: Math.floor(Math.random() * 100) + 1 }, () => Math.random()),
        nested: {
          value: 'updated indexeddb',
          timestamp: new Date()
        }
      },
      metadata: {
        updateCount: (indexedDBHook.value?.metadata?.updateCount as number || 0) + 1,
        lastUpdate: Date.now()
      }
    };
    indexedDBHook.setValue(newObject);
  };

  return (
    <div className="hook-comparison-demo">
      <h2>Hook Comparison Demo</h2>
      
      <div className="tabs">
        <button 
          className={activeTab === 'comparison' ? 'active' : ''} 
          onClick={() => setActiveTab('comparison')}
        >
          Side-by-Side Comparison
        </button>
        <button 
          className={activeTab === 'performance' ? 'active' : ''} 
          onClick={() => setActiveTab('performance')}
        >
          Performance Test
        </button>
      </div>

      {activeTab === 'comparison' && (
        <div className="comparison-grid">
          <div className="hook-section">
            <h3>Regular Hook (useUnstorage)</h3>
            <div className="status">
              <p>Loading: {regularHook.loading ? 'Yes' : 'No'}</p>
              <p>Error: {regularHook.error?.message || 'None'}</p>
            </div>
            
            <div className="data-display">
              <h4>Stored Value:</h4>
              <pre>{JSON.stringify(regularHook.value, null, 2)}</pre>
            </div>
            
            <div className="actions">
              <button onClick={updateRegularObject}>Update Object</button>
              <button onClick={() => regularHook.removeValue()}>Remove</button>
              <button onClick={() => regularHook.loadValue()}>Reload</button>
            </div>
          </div>

          <div className="hook-section">
            <h3>IndexedDB Hook (useIndexedDBStorage)</h3>
            <div className="status">
              <p>Loading: {indexedDBHook.loading ? 'Yes' : 'No'}</p>
              <p>Error: {indexedDBHook.error?.message || 'None'}</p>
            </div>
            
            <div className="data-display">
              <h4>Stored Value:</h4>
              <pre>{JSON.stringify(indexedDBHook.value, null, 2)}</pre>
            </div>
            
            <div className="actions">
              <button onClick={updateIndexedDBObject}>Update Object</button>
              <button onClick={() => indexedDBHook.removeValue()}>Remove</button>
              <button onClick={() => indexedDBHook.loadValue()}>Reload</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="performance-section">
          <h3>Performance Comparison</h3>
          <p>This test stores a large object (1000 numbers + metadata) and measures the time taken.</p>
          
          <button onClick={runPerformanceTest} style={{ marginBottom: '1rem' }}>
            Run Performance Test (5 iterations each)
          </button>
          
          {performanceResults.regular.length > 0 && (
            <div className="performance-results">
              <div className="result-card">
                <h4>Regular Hook Results</h4>
                <p>Times: {performanceResults.regular.map(t => t.toFixed(2)).join(', ')} ms</p>
                <p>Average: {(performanceResults.regular.reduce((a, b) => a + b, 0) / performanceResults.regular.length).toFixed(2)} ms</p>
                <p>Min: {Math.min(...performanceResults.regular).toFixed(2)} ms</p>
                <p>Max: {Math.max(...performanceResults.regular).toFixed(2)} ms</p>
              </div>
              
              <div className="result-card">
                <h4>IndexedDB Hook Results</h4>
                <p>Times: {performanceResults.indexeddb.map(t => t.toFixed(2)).join(', ')} ms</p>
                <p>Average: {(performanceResults.indexeddb.reduce((a, b) => a + b, 0) / performanceResults.indexeddb.length).toFixed(2)} ms</p>
                <p>Min: {Math.min(...performanceResults.indexeddb).toFixed(2)} ms</p>
                <p>Max: {Math.max(...performanceResults.indexeddb).toFixed(2)} ms</p>
              </div>
            </div>
          )}
          
          <div className="performance-note">
            <h4>Key Differences:</h4>
            <ul>
              <li><strong>Regular Hook:</strong> Objects are JSON stringified before storage, then parsed when retrieved</li>
              <li><strong>IndexedDB Hook:</strong> Objects are stored natively without JSON serialization</li>
              <li><strong>Performance:</strong> IndexedDB hooks should be faster for complex objects</li>
              <li><strong>Memory:</strong> IndexedDB hooks use less memory (no intermediate string representations)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
} 