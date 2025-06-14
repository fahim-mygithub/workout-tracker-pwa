import { useEffect } from 'react'
import './App.css'
import { AppRouter } from './router'
import { registerSW } from './utils/pwa'

function App() {
  useEffect(() => {
    // Register service worker
    registerSW();
  }, []);

  return <AppRouter />;
}

export default App
