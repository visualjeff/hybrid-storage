import { useStorageSignal, useComputedStorageSignal } from './useUnstorage.signals';
import { useUnstorage } from './useUnstorage';
import type { Storage } from 'unstorage';

interface ComparisonProps {
  storage: Storage;
}

export function SignalsComparison({ storage }: ComparisonProps) {
  return (
    <div style={{ padding: '2rem', border: '2px solid #6c5ce7', borderRadius: '12px', margin: '2rem 0' }}>
      <h2>🔄 Signals vs Storage-Based Reactivity</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Traditional Signals (for comparison) */}
        <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>📡 Traditional Signals</h3>
          <p style={{ fontSize: '0.9em', color: '#666' }}>
            In-memory, immediate updates, single application instance
          </p>
          
          <div style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '4px', margin: '1rem 0' }}>
            <h4>Example (SolidJS/Vue 3 style):</h4>
            <pre style={{ fontSize: '0.8em', overflow: 'auto' }}>
{`// In-memory signals
const count = signal(0);
const doubled = computed(() => count.value * 2);

// Immediate updates
count.set(5); // doubled.value = 10 instantly

// Single app instance only
// No persistence across tabs/windows`}
            </pre>
          </div>

          <h4>✅ Pros:</h4>
          <ul style={{ fontSize: '0.9em' }}>
            <li>Immediate updates</li>
            <li>Fine-grained reactivity</li>
            <li>Excellent performance</li>
            <li>Simple API</li>
          </ul>

          <h4>❌ Cons:</h4>
          <ul style={{ fontSize: '0.9em' }}>
            <li>No persistence</li>
            <li>No cross-tab sync</li>
            <li>Memory only</li>
            <li>Lost on page refresh</li>
          </ul>
        </div>

        {/* Our Storage-Based System */}
        <div style={{ padding: '1rem', border: '1px solid #00b894', borderRadius: '8px' }}>
          <h3>💾 Storage-Based Reactivity</h3>
          <p style={{ fontSize: '0.9em', color: '#666' }}>
            Persistent, cross-tab, external change detection
          </p>
          
          <div style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '4px', margin: '1rem 0' }}>
            <h4>Our Implementation:</h4>
            <pre style={{ fontSize: '0.8em', overflow: 'auto' }}>
{`// Storage-based signals
const { value, set } = useStorageSignal(storage, "count", 0);
const doubled = useComputedStorageSignal(storage, "count", 0, v => v * 2);

// Persistent updates
await set(5); // Stored in localStorage/cookies

// Cross-tab synchronization
// External change detection
// Survives page refresh`}
            </pre>
          </div>

          <h4>✅ Pros:</h4>
          <ul style={{ fontSize: '0.9em' }}>
            <li>Persistent storage</li>
            <li>Cross-tab synchronization</li>
            <li>External change detection</li>
            <li>Survives page refresh</li>
          </ul>

          <h4>❌ Cons:</h4>
          <ul style={{ fontSize: '0.9em' }}>
            <li>Polling-based updates</li>
            <li>Asynchronous operations</li>
            <li>More complex setup</li>
            <li>Storage limitations</li>
          </ul>
        </div>
      </div>

      {/* Live Demo */}
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f1f2f6', borderRadius: '8px' }}>
        <h3>🎯 Live Comparison Demo</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Storage Signal Demo */}
          <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '4px' }}>
            <h4>💾 Storage Signal</h4>
            <StorageSignalDemo storage={storage} />
          </div>

          {/* Traditional Hook Demo */}
          <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '4px' }}>
            <h4>🔄 Traditional Hook</h4>
            <TraditionalHookDemo storage={storage} />
          </div>
        </div>

        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
          <h4>🧪 Test Instructions:</h4>
          <ol style={{ fontSize: '0.9em' }}>
            <li>Open multiple browser tabs with this page</li>
            <li>Update values in one tab</li>
            <li>Watch them sync across tabs automatically</li>
            <li>Try updating from browser console: <code>localStorage.setItem('demo:count', '999')</code></li>
          </ol>
        </div>
      </div>
    </div>
  );
}

// Storage Signal Demo Component
function StorageSignalDemo({ storage }: { storage: Storage }) {
  const { value, set, update } = useStorageSignal(storage, "demo:count", 0);
  const doubled = useComputedStorageSignal(storage, "demo:count", 0, v => v * 2);

  return (
    <div>
      <p><strong>Count:</strong> {value}</p>
      <p><strong>Doubled:</strong> {doubled}</p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => set(value + 1)}>+1</button>
        <button onClick={() => update(v => v - 1)}>-1</button>
        <button onClick={() => set(0)}>Reset</button>
      </div>
    </div>
  );
}

// Traditional Hook Demo Component
function TraditionalHookDemo({ storage }: { storage: Storage }) {
  const { value, setValue } = useUnstorage(storage, "demo:count", {
    defaultValue: 0,
    subscribe: true,
    pollInterval: 500
  });

  return (
    <div>
      <p><strong>Count:</strong> {value}</p>
      <p><strong>Doubled:</strong> {value ? value * 2 : 0}</p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => setValue((value || 0) + 1)}>+1</button>
        <button onClick={() => setValue((value || 0) - 1)}>-1</button>
        <button onClick={() => setValue(0)}>Reset</button>
      </div>
    </div>
  );
} 