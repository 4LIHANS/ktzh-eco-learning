import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api, type AdminUser } from '../api/client'

export function AdminEmployeesPage() {
  const { t } = useTranslation()
  const [users, setUsers] = useState<AdminUser[]>([])

  useEffect(() => {
    api.users().then((r) => setUsers(r.users))
  }, [])

  const toggleBlock = async (user: AdminUser) => {
    await api.updateUser(user.id, { isBlocked: !user.isBlocked })
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, isBlocked: !u.isBlocked } : u)),
    )
  }

  return (
    <>
      <div className="page-title">{t('employees.title')}</div>
      <div className="page-sub">{t('employees.subtitle')}</div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>{t('employees.name')}</th>
            <th>{t('employees.department')}</th>
            <th>{t('employees.role')}</th>
            <th>{t('employees.status')}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {users.map((emp) => (
            <tr key={emp.id}>
              <td>{emp.fullName}</td>
              <td>{emp.department}</td>
              <td>{emp.role}</td>
              <td>
                <span className={`chip ${emp.isBlocked ? 'chip-red' : 'chip-green'}`}>
                  {emp.isBlocked ? t('employees.blocked') : t('employees.active')}
                </span>
              </td>
              <td>
                <button type="button" className="btn-secondary" onClick={() => toggleBlock(emp)}>
                  {emp.isBlocked ? t('employees.active') : t('employees.blocked')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
