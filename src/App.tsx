import './App.css'
import { AppRouter } from './router'
import { ExerciseLoader } from './components/ExerciseLoader'

function App() {
  return (
    <>
      <ExerciseLoader />
      <AppRouter />
    </>
  );
}

export default App
