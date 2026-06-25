import { type FormEvent, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth, homePath } from '../context/AuthContext'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

export function LoginPage() {
  const { t } = useTranslation()
  const { isAuthenticated, role, login, loading } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && isAuthenticated && role) {
    return <Navigate to={homePath(role)} replace />
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(username, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <LanguageSwitcher />
        </div>
        <div className="login-logo">
          <i className="ti ti-leaf" aria-hidden="true" />
          {t('app.title')}
        </div>
        <p className="login-subtitle">{t('login.subtitle')}</p>
        <p className="login-subtitle" style={{ marginTop: -12 }}>{t('app.company')}</p>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-label">{t('login.login')}</div>
            <input
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('login.loginPlaceholder')}
              autoComplete="username"
              required
            />
          </div>
          <div className="form-row">
            <div className="form-label">{t('login.password')}</div>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('login.passwordPlaceholder')}
              autoComplete="current-password"
              required
            />
          </div>
          {error && (
            <div className="notif notif-amber" style={{ marginBottom: 12 }}>
              <i className="ti ti-alert-triangle" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
          <div className="login-actions">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? '...' : t('login.employeeLogin')}
            </button>
          </div>
        </form>
        <p className="role-hint">
          {t('login.hint')}
          <br />
          admin / Admin123! · asxhat / Employee123! · manager / Manager123!
        </p>
      </div>
    </div>
  )
}
