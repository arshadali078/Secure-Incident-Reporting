import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import LoginPage from './pages/auth/Login.jsx'
import RegisterPage from './pages/auth/Register.jsx'
import UserDashboard from './pages/user/Dashboard.jsx'
import CreateIncidentPage from './pages/user/CreateIncident.jsx'
import AdminDashboard from './pages/admin/Dashboard.jsx'
import SuperAdminDashboard from './pages/superadmin/Dashboard.jsx'
import UsersPage from './pages/superadmin/Users.jsx'
import AuditLogsPage from './pages/superadmin/Logs.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import AppLayout from './components/layout/AppLayout.jsx'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-slate-600">Loading...</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            user.role === 'SUPER_ADMIN' ? (
              <Navigate to="/superadmin" replace />
            ) : user.role === 'ADMIN' ? (
              <Navigate to="/admin" replace />
            ) : (
              <Navigate to="/user" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<AppLayout />}>
        <Route
          path="/user"
          element={
            <ProtectedRoute roles={['USER', 'ADMIN', 'SUPER_ADMIN']}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/new"
          element={
            <ProtectedRoute roles={['USER']}>
              <CreateIncidentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin"
          element={
            <ProtectedRoute roles={['SUPER_ADMIN']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/users"
          element={
            <ProtectedRoute roles={['SUPER_ADMIN']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/logs"
          element={
            <ProtectedRoute roles={['SUPER_ADMIN']}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
