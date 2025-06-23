import { useEffect } from 'react'
import { createStorage } from "unstorage";
import localStorageDriver from "unstorage/drivers/localstorage";
import indexedDbDriver from "unstorage/drivers/indexedb";
import { useUnstorage } from './utils/hooks';
import { useIndexedDBStorage } from './utils/hooks';

// Test both storage types
const localStorage = createStorage({
  driver: localStorageDriver({ base: 'test:'})
});

const indexedDBStorage = createStorage({
  driver: indexedDbDriver({ 
    base: 'test:', 
    dbName: 'TestDB', 
    storeName: 'TestStore'
  })
});

function TestApp() {
  // Test localStorage
  const { 
    value: localStoredValue, 
    loading: localLoading, 
    error: localError 
  } = useUnstorage(localStorage, "test:local", {
    defaultValue: "localStorage test value"
  });

  // Test IndexedDB
  const { 
    value: indexedDBStoredValue, 
    loading: indexedDBLoading, 
    error: indexedDBError 
  } = useIndexedDBStorage(indexedDBStorage, "test:indexeddb", {
    defaultValue: "IndexedDB test value"
  });

  useEffect(() => {
    console.log('LocalStorage test:', { localStoredValue, localLoading, localError });
    console.log('IndexedDB test:', { indexedDBStoredValue, indexedDBLoading, indexedDBError });
  }, [localStoredValue, localLoading, localError, indexedDBStoredValue, indexedDBLoading, indexedDBError]);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Storage Test</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2>LocalStorage Test</h2>
        <p>Loading: {localLoading ? 'Yes' : 'No'}</p>
        <p>Error: {localError ? localError.message : 'None'}</p>
        <p>Value: {localStoredValue || 'No value'}</p>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>IndexedDB Test</h2>
        <p>Loading: {indexedDBLoading ? 'Yes' : 'No'}</p>
        <p>Error: {indexedDBError ? indexedDBError.message : 'None'}</p>
        <p>Value: {indexedDBStoredValue || 'No value'}</p>
      </div>

      <div>
        <h2>Debug Info</h2>
        <p>Check browser console for detailed logs</p>
      </div>
    </div>
  )
}

export default TestApp 