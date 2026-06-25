import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useAuth } from '../context/AuthContext'
import { isAdminPanelRole } from '../api/client'

interface TopbarProps {
  title?: string
  backTo?: string
  badge?: string
}

export function Topbar({ title, backTo, badge }: TopbarProps) {
  const { t } = useTranslation()
  const { user, role } = useAuth()

  const logoTitle =
    role && isAdminPanelRole(role)
      ? t('app.titleAdmin')
      : role === 'manager'
        ? `${t('app.title')} · ${t('nav.reports')}`
        : title ?? t('app.title')

  return (
    <div className="topbar">
      <div className="topbar-logo">
        {backTo ? (
          <NavLink to={backTo} style={{ color: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ti ti-arrow-left" aria-hidden="true" />
            {title}
          </NavLink>
        ) : (
          <>
            <i className="ti ti-leaf" aria-hidden="true" />
            {logoTitle}
          </>
        )}
      </div>
      <div className="topbar-right">
        {badge && <span className="badge badge-green">{badge}</span>}
        <LanguageSwitcher />
        <span className="user-name">{user?.fullName ?? t('user.name')}</span>
        <div className="avatar">{user?.initials ?? t('user.initials')}</div>
      </div>
    </div>
  )
}
