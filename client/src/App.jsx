import { Routes, Route } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import Landing from './pages/Landing.jsx'
import Quiz from './pages/Quiz.jsx'
import Result from './pages/Result.jsx'

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/result/:code" element={<Result />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App
