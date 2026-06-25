import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

interface SidebarItem {
  to: string
  icon: string
  labelKey: string
  roles?: string[]
}

const employeeItems: SidebarItem[] = [
  { to: '/dashboard', icon: 'ti-layout-dashboard', labelKey: 'nav.myCourses' },
  { to: '/certificates', icon: 'ti-certificate', labelKey: 'nav.certificates' },
  { to: '/results', icon: 'ti-chart-bar', labelKey: 'nav.results' },
  { to: '/notifications', icon: 'ti-bell', labelKey: 'nav.notifications' },
]

const adminItems: SidebarItem[] = [
  { to: '/admin/upload', icon: 'ti-upload', labelKey: 'nav.materials', roles: ['admin', 'methodist'] },
  { to: '/admin/tests', icon: 'ti-list-check', labelKey: 'nav.tests', roles: ['admin', 'methodist'] },
  { to: '/admin/employees', icon: 'ti-users', labelKey: 'nav.employees', roles: ['admin'] },
  { to: '/admin/reports', icon: 'ti-chart-bar', labelKey: 'nav.reports' },
  { to: '/admin/settings', icon: 'ti-settings', labelKey: 'nav.settings', roles: ['admin', 'methodist'] },
]

export function Sidebar() {
  const { t } = useTranslation()
  const { role, logout, user } = useAuth()

  const isEmployee = role === 'employee'
  const items = isEmployee
    ? employeeItems
    : adminItems.filter((item) => !item.roles || item.roles.includes(role ?? ''))

  return (
    <div className="sidebar">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
        >
          <i className={`ti ${item.icon}`} aria-hidden="true" />
          {t(item.labelKey)}
        </NavLink>
      ))}
      <button
        type="button"
        className="sidebar-item"
        style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left' }}
        onClick={() => logout()}
      >
        <i className="ti ti-logout" aria-hidden="true" />
        {t('nav.logout')}
      </button>
      {user && (
        <div style={{ padding: '12px 16px', fontSize: 11, color: 'var(--color-text-secondary)' }}>
          {user.fullName}
        </div>
      )}
    </div>
  )
}
