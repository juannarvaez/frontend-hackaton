import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import VehiclesPage from './pages/VehiclesPage'
import VehicleDetailPage from './pages/VehicleDetailPage'
import DealRoomPage from './pages/DealRoomPage'
import CreateVehiclePage from './pages/CreateVehiclePage'
import RoomsPage from './pages/RoomsPage'
import VoiceTranscriptionPage from './pages/VoiceTranscriptionPage'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuthStore((state) => ({ 
    isAuthenticated: state.isAuthenticated, 
    isInitialized: state.isInitialized 
  }))

  if (!isInitialized) return <LoadingScreen />
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

export default function App() {
  const initAuth = useAuthStore((state) => state.init)
  const isInitialized = useAuthStore((state) => state.isInitialized)

  useEffect(() => {
    initAuth()
  }, [])

  if (!isInitialized) return <LoadingScreen />

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="vehicles" element={<VehiclesPage />} />
        <Route path="vehicles/new" element={<CreateVehiclePage />} />
        <Route path="vehicles/:id" element={<VehicleDetailPage />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="deals/:id" element={<DealRoomPage />} />
        <Route path="voice-transcription" element={<VoiceTranscriptionPage />} />
      </Route>
    </Routes>
  )
}