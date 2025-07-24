import { Routes, Route } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import SubmissionPage from './pages/SubmissionPage'
import LoginPage from './pages/LoginPage'
import SubmissionDetailPage from './pages/SubmissionDetailPage'

function App() {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="pt-16">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/submission/:id" element={<SubmissionDetailPage />} />
          <Route path="/message/:id" element={<SubmissionDetailPage />} />
          <Route path="/submit" element={<SubmissionPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App