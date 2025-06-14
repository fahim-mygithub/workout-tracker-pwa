import { useEffect } from 'react'
import './App.css'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import OfflineIndicator from './components/OfflineIndicator'
import StateDemo from './components/state/StateDemo'
import { registerSW } from './utils/pwa'

function App() {
  useEffect(() => {
    // Register service worker
    registerSW();
  }, []);

  return (
    <main>
      <header>
        <h1>Workout Tracker</h1>
        <p>Your Progressive Web App for Smart Workout Tracking</p>
      </header>
      
      <section>
        <p>Welcome to your workout tracking companion!</p>
        <p>Create workouts with natural language like "5x5 Bench ss 3x10 pushups"</p>
      </section>

      <StateDemo />

      <PWAInstallPrompt />
      <OfflineIndicator />
    </main>
  )
}

export default App
