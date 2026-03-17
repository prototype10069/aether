import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ChatInterface from './pages/ChatInterface'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsAuthenticated(!!token)
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-aether-dark to-aether-card flex items-center justify-center">
        <div className="animate-spin">
          <div className="w-12 h-12 border-4 border-aether-primary border-t-aether-accent rounded-full"></div>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/signup" element={<Signup setIsAuthenticated={setIsAuthenticated} />} />
        <Route
          path="/chat"
          element={isAuthenticated ? <ChatInterface /> : <Navigate to="/login" />}
        />
        <Route path="/" element={<Navigate to={isAuthenticated ? '/chat' : '/login'} />} />
      </Routes>
    </Router>
  )
}

export default App