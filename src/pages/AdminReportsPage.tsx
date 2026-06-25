import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api, localized, type ReportsSummary } from '../api/client'

export function AdminReportsPage() {
  const { t, i18n } = useTranslation()
  const [data, setData] = useState<ReportsSummary | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.reportsSummary().then(setData).catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="empty-state">{error}</div>
  if (!data) return <div className="empty-state">...</div>

  return (
    <>
      <div className="page-title">{t('reports.title')}</div>
      <div className="page-sub">{t('reports.asOf')}</div>

      <div className="toolbar">
        <a href={api.exportReport()} className="btn-secondary" style={{ textDecoration: 'none' }}>
          {t('reports.exportExcel')}
        </a>
        <a href={api.exportReport()} className="btn-primary" style={{ textDecoration: 'none' }}>
          {t('reports.exportPdf')}
        </a>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">{t('reports.employees')}</div>
          <div className="stat-value">{data.employees}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('reports.trained')}</div>
          <div className="stat-value stat-green">{data.trained}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('reports.coverage')}</div>
          <div className="stat-value stat-green">{data.coverage}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('reports.avgScore')}</div>
          <div className="stat-value">{data.avgScore}%</div>
        </div>
      </div>

      <div className="two-col">
        <div>
          <div className="section-heading">{t('reports.byDepartment')}</div>
          {data.departmentCoverage.map((item) => (
            <div key={item.department} className="chart-bar-row">
              <div className="chart-bar-label">{item.department}</div>
              <div className="chart-bar-track">
                <div className="chart-bar-fill" style={{ width: `${item.coverage}%` }} />
              </div>
              <div className="chart-bar-val">{item.coverage}%</div>
            </div>
          ))}
        </div>
        <div>
          <div className="section-heading">{t('reports.recentResults')}</div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('reports.employee')}</th>
                <th>{t('reports.course')}</th>
                <th>{t('reports.score')}</th>
                <th>{t('reports.status')}</th>
              </tr>
            </thead>
            <tbody>
              {data.recentResults.map((row) => (
                <tr key={`${row.employee}-${row.courseRu}`}>
                  <td>{row.employee}</td>
                  <td>{localized(row.courseRu, row.courseKk, i18n.language)}</td>
                  <td>{row.score}</td>
                  <td>
                    <span className={`chip ${row.status === 'passed' ? 'chip-green' : 'chip-red'}`}>
                      {row.status === 'passed' ? t('testStatus.passed') : t('testStatus.failed')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
