import { useState } from 'react';
import { useHybridSignal, useComputedHybridSignal } from './useHybridSignal';
import { useUnstorage } from './useUnstorage';
import type { Storage } from 'unstorage';

interface HybridDemoProps {
  storage: Storage;
}

export function HybridSignalDemo({ storage }: HybridDemoProps) {
  const [activeTab, setActiveTab] = useState<'hybrid' | 'traditional' | 'comparison'>('hybrid');

  return (
    <div style={{ padding: '2rem', border: '2px solid #e17055', borderRadius: '12px', margin: '2rem 0' }}>
      <h2>🚀 Hybrid Signal System - Best of Both Worlds</h2>
      
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={() => setActiveTab('hybrid')}
          style={{ 
            padding: '0.5rem 1rem', 
            backgroundColor: activeTab === 'hybrid' ? '#e17055' : '#ddd',
            color: activeTab === 'hybrid' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🚀 Hybrid Signal
        </button>
        <button 
          onClick={() => setActiveTab('traditional')}
          style={{ 
            padding: '0.5rem 1rem', 
            backgroundColor: activeTab === 'traditional' ? '#e17055' : '#ddd',
            color: activeTab === 'traditional' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          📡 Traditional Hook
        </button>
        <button 
          onClick={() => setActiveTab('comparison')}
          style={{ 
            padding: '0.5rem 1rem', 
            backgroundColor: activeTab === 'comparison' ? '#e17055' : '#ddd',
            color: activeTab === 'comparison' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ⚡ Performance Comparison
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'hybrid' && <HybridSignalTab storage={storage} />}
      {activeTab === 'traditional' && <TraditionalHookTab storage={storage} />}
      {activeTab === 'comparison' && <PerformanceComparisonTab />}
    </div>
  );
}

// Hybrid Signal Tab
function HybridSignalTab({ storage }: { storage: Storage }) {
  // Basic hybrid signal
  const { value, set, update, setAsync, remove } = useHybridSignal(storage, "hybrid:count", {
    defaultValue: 0,
    subscribe: true,
    pollInterval: 1000,
    immediate: true,
    debounceMs: 100
  });

  // Computed hybrid signal
  const doubled = useComputedHybridSignal(storage, "hybrid:count", 0, v => v * 2);
  const isEven = useComputedHybridSignal(storage, "hybrid:count", 0, v => v % 2 === 0);

  // Complex object hybrid signal
  const { value: user, update: updateUser } = useHybridSignal(storage, "hybrid:user", {
    defaultValue: { name: "John", age: 30, preferences: { theme: "dark", notifications: true } },
    subscribe: true,
    pollInterval: 2000
  });

  return (
    <div>
      <h3>🚀 Hybrid Signal Features</h3>
      <p style={{ fontSize: '0.9em', color: '#333', marginBottom: '1rem' }}>
        Immediate updates (like signals) + persistence + cross-tab sync
      </p>

      {/* Basic Counter Demo */}
      <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '1rem' }}>
        <h4>📊 Counter with Computed Values</h4>
        <p><strong>Count:</strong> {value}</p>
        <p><strong>Doubled:</strong> {doubled}</p>
        <p><strong>Is Even:</strong> {isEven ? '✅ Yes' : '❌ No'}</p>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <button onClick={() => set(value + 1)}>+1 (Immediate)</button>
          <button onClick={() => update(v => v - 1)}>-1 (Immediate)</button>
          <button onClick={() => setAsync(value + 10)}>+10 (Async)</button>
          <button onClick={() => set(0)}>Reset</button>
          <button onClick={remove}>Remove</button>
        </div>
      </div>

      {/* Complex Object Demo */}
      <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '1rem' }}>
        <h4>👤 Complex Object Management</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>Age:</strong> {user?.age}</p>
            <p><strong>Theme:</strong> {user?.preferences?.theme}</p>
            <p><strong>Notifications:</strong> {user?.preferences?.notifications ? '✅ On' : '❌ Off'}</p>
          </div>
          <div>
            <button onClick={() => updateUser(u => ({ ...u, age: u.age + 1 }))}>
              Increment Age
            </button>
            <button onClick={() => updateUser(u => ({ 
              ...u, 
              preferences: { ...u.preferences, theme: u.preferences.theme === 'dark' ? 'light' : 'dark' }
            }))}>
              Toggle Theme
            </button>
            <button onClick={() => updateUser(u => ({ 
              ...u, 
              preferences: { ...u.preferences, notifications: !u.preferences.notifications }
            }))}>
              Toggle Notifications
            </button>
          </div>
        </div>
      </div>

      {/* Performance Options Demo */}
      <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h4>⚡ Performance Options</h4>
        <p style={{ fontSize: '0.9em', color: '#333' }}>
          Try these different configurations to see the performance differences:
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => set(value + 1, { persist: true, debounce: true })}>
            Debounced Update
          </button>
          <button onClick={() => set(value + 1, { persist: true, debounce: false })}>
            Immediate Storage
          </button>
          <button onClick={() => set(value + 1, { persist: false })}>
            Memory Only
          </button>
        </div>
      </div>
    </div>
  );
}

// Traditional Hook Tab
function TraditionalHookTab({ storage }: { storage: Storage }) {
  const { value, setValue, removeValue } = useUnstorage(storage, "traditional:count", {
    defaultValue: 0,
    subscribe: true,
    pollInterval: 1000
  });

  const { value: user, setValue: setUser } = useUnstorage(storage, "traditional:user", {
    defaultValue: { name: "John", age: 30, preferences: { theme: "dark", notifications: true } },
    subscribe: true,
    pollInterval: 2000
  });

  return (
    <div>
      <h3>📡 Traditional Hook (for comparison)</h3>
      <p style={{ fontSize: '0.9em', color: '#333', marginBottom: '1rem' }}>
        Storage-based with polling for external changes
      </p>

      {/* Basic Counter Demo */}
      <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '1rem' }}>
        <h4>📊 Counter</h4>
        <p><strong>Count:</strong> {value}</p>
        <p><strong>Doubled:</strong> {value ? value * 2 : 0}</p>
        <p><strong>Is Even:</strong> {value && value % 2 === 0 ? '✅ Yes' : '❌ No'}</p>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <button onClick={() => setValue((value || 0) + 1)}>+1</button>
          <button onClick={() => setValue((value || 0) - 1)}>-1</button>
          <button onClick={() => setValue(0)}>Reset</button>
          <button onClick={removeValue}>Remove</button>
        </div>
      </div>

      {/* Complex Object Demo */}
      <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h4>👤 Complex Object</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>Age:</strong> {user?.age}</p>
            <p><strong>Theme:</strong> {user?.preferences?.theme}</p>
            <p><strong>Notifications:</strong> {user?.preferences?.notifications ? '✅ On' : '❌ Off'}</p>
          </div>
          <div>
            <button onClick={() => setUser({ 
              ...user, 
              age: (user?.age || 0) + 1,
              name: user?.name || "John",
              preferences: {
                theme: user?.preferences?.theme || "dark",
                notifications: user?.preferences?.notifications ?? true
              }
            })}>
              Increment Age
            </button>
            <button onClick={() => setUser({ 
              ...user, 
              name: user?.name || "John",
              age: user?.age || 30,
              preferences: { 
                theme: user?.preferences?.theme === 'dark' ? 'light' : 'dark',
                notifications: user?.preferences?.notifications ?? true
              }
            })}>
              Toggle Theme
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Performance Comparison Tab
function PerformanceComparisonTab() {
  const [performanceResults, setPerformanceResults] = useState<string[]>([]);

  const runPerformanceTest = () => {
    const results: string[] = [];
    
    // Simple performance test without hooks
    const hybridStart = performance.now();
    for (let i = 0; i < 1000; i++) {
      // Simulate hybrid signal performance
      localStorage.setItem('perf:hybrid', i.toString());
    }
    const hybridTime = performance.now() - hybridStart;
    results.push(`🚀 Hybrid Signal (simulated): ${hybridTime.toFixed(2)}ms`);

    // Test Traditional Hook
    const traditionalStart = performance.now();
    for (let i = 0; i < 1000; i++) {
      // Simulate traditional hook performance
      localStorage.setItem('perf:traditional', i.toString());
    }
    const traditionalTime = performance.now() - traditionalStart;
    results.push(`📡 Traditional Hook (simulated): ${traditionalTime.toFixed(2)}ms`);

    setPerformanceResults(results);
  };

  return (
    <div>
      <h3>⚡ Performance Comparison</h3>
      <p style={{ fontSize: '0.9em', color: '#333', marginBottom: '1rem' }}>
        Compare the performance of different approaches
      </p>

      <button onClick={runPerformanceTest} style={{ marginBottom: '1rem' }}>
        🏃‍♂️ Run Performance Test
      </button>

      {performanceResults.length > 0 && (
        <div style={{ padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
          <h4 style={{ color: '#333' }}>📊 Results:</h4>
          {performanceResults.map((result, index) => (
            <p key={index} style={{ margin: '0.5rem 0', color: '#333' }}>{result}</p>
          ))}
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#e8f4fd', borderRadius: '8px' }}>
        <h4 style={{ color: '#333' }}>💡 Key Differences:</h4>
        <ul style={{ fontSize: '0.9em', color: '#333' }}>
          <li><strong>Hybrid Signal:</strong> Immediate updates + debounced storage writes</li>
          <li><strong>Traditional Hook:</strong> All updates wait for storage</li>
          <li><strong>Memory Only:</strong> Fastest but no persistence</li>
          <li><strong>Cross-tab Sync:</strong> Both support it, but hybrid is faster locally</li>
        </ul>
      </div>
    </div>
  );
} 