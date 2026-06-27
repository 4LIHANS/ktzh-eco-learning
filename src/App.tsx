import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth, homePath } from './context/AuthContext'
import { AppLayout } from './components/AppLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { CoursePage } from './pages/CoursePage'
import { CertificatesPage } from './pages/CertificatesPage'
import { ResultsPage } from './pages/ResultsPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { AdminReportsPage } from './pages/AdminReportsPage'
import { AdminUploadPage } from './pages/AdminUploadPage'
import { AdminEmployeesPage } from './pages/AdminEmployeesPage'
import { AdminTestsPage } from './pages/AdminTestsPage'
import { AdminTestBuilderPage } from './pages/AdminTestBuilderPage'
import { AdminSettingsPage } from './pages/AdminSettingsPage'

function HomeRedirect() {
  const { isAuthenticated, role, loading } = useAuth()
  if (loading) return null
  if (!isAuthenticated || !role) return <Navigate to="/login" replace />
  return <Navigate to={homePath(role)} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomeRedirect />} />

          <Route
            element={
              <ProtectedRoute access="employee">
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/certificates" element={<CertificatesPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>

          <Route
            path="/course/:id"
            element={
              <ProtectedRoute access="employee">
                <CoursePage />
              </ProtectedRoute>
            }
          />

          <Route
            element={
              <ProtectedRoute access="adminPanel">
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin/upload" element={<AdminUploadPage />} />
            <Route path="/admin/tests" element={<AdminTestsPage />} />
            <Route path="/admin/tests/:testId" element={<AdminTestBuilderPage />} />
            <Route path="/admin/employees" element={<AdminEmployeesPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
          </Route>

          <Route
            element={
              <ProtectedRoute access="reports">
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin/reports" element={<AdminReportsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
