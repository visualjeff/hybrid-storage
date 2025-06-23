import { useState } from 'react';
import { createStorage } from 'unstorage';
import indexeddbDriver from 'unstorage/drivers/indexedb';
import { useIndexedDBStorage } from './useIndexedDBStorage';
import { useIndexedDBSignal } from './useIndexedDBSignal';
import { useIndexedDBHybridSignal } from './useIndexedDBHybridSignal';
import { isIndexedDBDriver, indexedDBPerformanceMonitor } from './useIndexedDBStorage.utils';

// Create IndexedDB storage instance
const indexedDBStorage = createStorage({
  driver: indexeddbDriver({ base: 'unstorage-demo' })
});

// Example data types
interface User {
  id: string;
  name: string;
  email: string;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  tags: string[];
}

interface PerformanceStats {
  count: number;
  avg: number;
  min: number;
  max: number;
}

export function IndexedDBStorageExample() {
  const [activeTab, setActiveTab] = useState<'basic' | 'signal' | 'hybrid'>('basic');
  const [performanceStats, setPerformanceStats] = useState<Record<string, PerformanceStats>>({});

  // Basic IndexedDB storage hook
  const userStorage = useIndexedDBStorage<User>(
    indexedDBStorage,
    'user-profile',
    {
      defaultValue: {
        id: 'default',
        name: 'Default User',
        email: 'default@example.com',
        preferences: {
          theme: 'light',
          notifications: true
        }
      }
    }
  );

  // IndexedDB signal hook
  const todoSignal = useIndexedDBSignal<TodoItem[]>(
    indexedDBStorage,
    'todos',
    []
  );

  // IndexedDB hybrid signal hook
  const settingsHybrid = useIndexedDBHybridSignal<{
    language: string;
    timezone: string;
    autoSave: boolean;
  }>(
    indexedDBStorage,
    'app-settings',
    {
      defaultValue: {
        language: 'en',
        timezone: 'UTC',
        autoSave: true
      },
      immediate: true,
      debounceMs: 200
    }
  );

  // Performance monitoring
  const measureOperation = async (operation: string, fn: () => Promise<void>) => {
    const stopTimer = indexedDBPerformanceMonitor.startTimer(operation);
    await fn();
    stopTimer();
    
    // Update stats
    setPerformanceStats(prev => ({
      ...prev,
      [operation]: indexedDBPerformanceMonitor.getStats(operation)
    }));
  };

  // Example operations
  const updateUser = async () => {
    await measureOperation('updateUser', async () => {
      await userStorage.setValue({
        id: 'user-' + Date.now(),
        name: 'John Doe',
        email: 'john@example.com',
        preferences: {
          theme: 'dark',
          notifications: false
        }
      });
    });
  };

  const addTodo = async () => {
    await measureOperation('addTodo', async () => {
      const newTodo: TodoItem = {
        id: 'todo-' + Date.now(),
        text: `New todo ${Date.now()}`,
        completed: false,
        createdAt: new Date(),
        tags: ['work', 'important']
      };
      
      await todoSignal.set([...todoSignal.value, newTodo]);
    });
  };

  const toggleSettings = async () => {
    await measureOperation('toggleSettings', async () => {
      await settingsHybrid.set(prev => ({
        ...prev,
        autoSave: !prev.autoSave
      }));
    });
  };

  const clearAllData = async () => {
    await measureOperation('clearAllData', async () => {
      await userStorage.removeValue();
      await todoSignal.remove();
      await settingsHybrid.remove();
    });
  };

  // Driver validation
  const isIndexedDB = isIndexedDBDriver(indexedDBStorage);

  return (
    <div className="indexeddb-example">
      <h2>IndexedDB Storage Hooks Example</h2>
      
      <div className="driver-info">
        <h3>Driver Information</h3>
        <p>Is IndexedDB Driver: {isIndexedDB ? '✅ Yes' : '❌ No'}</p>
        <p>Driver Type: {indexedDBStorage.constructor.name}</p>
      </div>

      <div className="tabs">
        <button 
          className={activeTab === 'basic' ? 'active' : ''} 
          onClick={() => setActiveTab('basic')}
        >
          Basic Storage
        </button>
        <button 
          className={activeTab === 'signal' ? 'active' : ''} 
          onClick={() => setActiveTab('signal')}
        >
          Signal Storage
        </button>
        <button 
          className={activeTab === 'hybrid' ? 'active' : ''} 
          onClick={() => setActiveTab('hybrid')}
        >
          Hybrid Signal
        </button>
      </div>

      {activeTab === 'basic' && (
        <div className="tab-content">
          <h3>Basic IndexedDB Storage</h3>
          <div className="storage-info">
            <p>Loading: {userStorage.loading ? 'Yes' : 'No'}</p>
            <p>Error: {userStorage.error?.message || 'None'}</p>
          </div>
          
          <div className="data-display">
            <h4>User Profile:</h4>
            <pre>{JSON.stringify(userStorage.value, null, 2)}</pre>
          </div>
          
          <div className="actions">
            <button onClick={updateUser}>Update User</button>
            <button onClick={() => userStorage.loadValue()}>Reload</button>
            <button onClick={() => userStorage.clearError()}>Clear Error</button>
          </div>
        </div>
      )}

      {activeTab === 'signal' && (
        <div className="tab-content">
          <h3>IndexedDB Signal Storage</h3>
          
          <div className="data-display">
            <h4>Todos ({todoSignal.value.length}):</h4>
            <ul>
              {todoSignal.value.map(todo => (
                <li key={todo.id}>
                  <input 
                    type="checkbox" 
                    checked={todo.completed}
                    onChange={async () => {
                      await todoSignal.set(todoSignal.value.map(t => 
                        t.id === todo.id ? { ...t, completed: !t.completed } : t
                      ));
                    }}
                  />
                  <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
                    {todo.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="actions">
            <button onClick={addTodo}>Add Todo</button>
            <button onClick={() => todoSignal.set([])}>Clear All</button>
          </div>
        </div>
      )}

      {activeTab === 'hybrid' && (
        <div className="tab-content">
          <h3>IndexedDB Hybrid Signal</h3>
          
          <div className="data-display">
            <h4>App Settings:</h4>
            <pre>{JSON.stringify(settingsHybrid.value, null, 2)}</pre>
          </div>
          
          <div className="actions">
            <button onClick={toggleSettings}>Toggle Auto Save</button>
            <button onClick={() => settingsHybrid.set(prev => ({ ...prev, language: 'es' }))}>
              Set Spanish
            </button>
            <button onClick={() => settingsHybrid.set(prev => ({ ...prev, timezone: 'America/New_York' }))}>
              Set EST Timezone
            </button>
          </div>
        </div>
      )}

      <div className="performance-section">
        <h3>Performance Statistics</h3>
        <div className="stats-grid">
          {Object.entries(performanceStats).map(([operation, stats]) => (
            <div key={operation} className="stat-card">
              <h4>{operation}</h4>
              <p>Count: {stats.count}</p>
              <p>Avg: {stats.avg.toFixed(2)}ms</p>
              <p>Min: {stats.min.toFixed(2)}ms</p>
              <p>Max: {stats.max.toFixed(2)}ms</p>
            </div>
          ))}
        </div>
        <button onClick={() => {
          indexedDBPerformanceMonitor.clear();
          setPerformanceStats({});
        }}>
          Clear Stats
        </button>
      </div>

      <div className="global-actions">
        <h3>Global Actions</h3>
        <button onClick={clearAllData}>Clear All Data</button>
      </div>
    </div>
  );
} 