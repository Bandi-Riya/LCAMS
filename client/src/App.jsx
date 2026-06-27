import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/layout/Layout'
import Spinner from './components/common/Spinner'
import { AuthProvider } from './context/AuthContext'
import useAuth from './hooks/useAuth'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Infrastructure from './pages/Infrastructure'
import RoomDetail from './pages/RoomDetail'
import Assets from './pages/Assets'
import AssetDetail from './pages/AssetDetail'
import Maintenance from './pages/Maintenance'
import Search from './pages/Search'
import Reports from './pages/Reports'
import Users from './pages/Users'
import Profile from './pages/Profile'

function PrivateRoute() {
  const { token, isLoading } = useAuth()
  if (isLoading) return <Spinner fullPage />
  if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}

function ComingSoon({ title }) {
  return (
    <div className="card">
      <div style={{ fontSize: 18, fontWeight: 800 }}>{title}</div>
      <div style={{ marginTop: 8, color: 'var(--color-text-light)' }}>
        Page coming soon.
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/infrastructure" element={<Infrastructure />} />
              <Route path="/rooms/:id" element={<RoomDetail />} />
              <Route path="/assets" element={<Assets />} />
              <Route path="/assets/:id" element={<AssetDetail />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/search" element={<Search />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/users" element={<Users />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
