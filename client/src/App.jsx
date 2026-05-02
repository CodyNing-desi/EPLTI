import { Routes, Route } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import Landing from './pages/Landing.jsx'
import Quiz from './pages/Quiz.jsx'
import Result from './pages/Result.jsx'
import Compare from './pages/Compare.jsx'
import ExportAll from './pages/ExportAll.jsx'
import SeasonInsights from './pages/SeasonInsights.jsx'

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/result/:code" element={<Result />} />
        <Route path="/compare/:code1/:code2" element={<Compare />} />
        <Route path="/insights" element={<SeasonInsights />} />
        <Route path="/admin/export" element={<ExportAll />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App
