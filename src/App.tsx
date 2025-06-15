import { useEffect } from 'react'
import './App.css'
import { AppRouter } from './router'
import { registerSW } from './utils/pwa'
import { useLoadExercises } from './hooks/useLoadExercises'

function App() {
  useEffect(() => {
    // Register service worker
    registerSW();
  }, []);

  // Load exercises on app startup
  useLoadExercises();

  return <AppRouter />;
}

export default App
