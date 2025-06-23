import { useState } from 'react'
import App from './App'
import IndexedDBApp from './IndexedDBApp'

function AppRouter() {
  const [currentApp, setCurrentApp] = useState<'regular' | 'indexeddb'>('regular')

  return (
    <div>
      {/* Navigation */}
      <div style={{ 
        position: 'fixed', 
        top: '10px', 
        right: '10px', 
        zIndex: 1000,
        display: 'flex',
        gap: '10px'
      }}>
        <button 
          onClick={() => setCurrentApp('regular')}
          style={{
            padding: '8px 16px',
            backgroundColor: currentApp === 'regular' ? '#646cff' : '#ddd',
            color: currentApp === 'regular' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Regular App
        </button>
        <button 
          onClick={() => setCurrentApp('indexeddb')}
          style={{
            padding: '8px 16px',
            backgroundColor: currentApp === 'indexeddb' ? '#646cff' : '#ddd',
            color: currentApp === 'indexeddb' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          IndexedDB App
        </button>
      </div>

      {/* Render current app */}
      {currentApp === 'regular' ? <App /> : <IndexedDBApp />}
    </div>
  )
}

export default AppRouter 