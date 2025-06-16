import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Questions from './pages/Questions'
import Videos from './pages/Videos'
import Feedbacks from './pages/Feedbacks'
import './App.css'

function App() {
  return (
    <div className="App">
      <Layout>
        <Routes>
          {/* 默认重定向到仪表板 */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 主要页面路由 */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/questions" element={<Questions />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/feedbacks" element={<Feedbacks />} />
          
          {/* 404页面 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </div>
  )
}

export default App 