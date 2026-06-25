import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { homePath, isAdminPanelRole, type UserRole } from '../api/client'

interface ProtectedRouteProps {
  children: React.ReactNode
  access: 'employee' | 'adminPanel' | 'reports'
}

function hasAccess(role: UserRole, access: ProtectedRouteProps['access']) {
  if (access === 'employee') return role === 'employee'
  if (access === 'adminPanel') return isAdminPanelRole(role)
  if (access === 'reports') return role === 'admin' || role === 'methodist' || role === 'manager'
  return false
}

export function ProtectedRoute({ children, access }: ProtectedRouteProps) {
  const { isAuthenticated, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="login-page">
        <div className="login-card" style={{ textAlign: 'center' }}>
          Загрузка...
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !role) {
    return <Navigate to="/login" replace />
  }

  if (!hasAccess(role, access)) {
    return <Navigate to={homePath(role)} replace />
  }

  return children
}
