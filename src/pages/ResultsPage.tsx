import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api, localized, type ResultItem } from '../api/client'

export function ResultsPage() {
  const { t, i18n } = useTranslation()
  const [items, setItems] = useState<ResultItem[]>([])

  useEffect(() => {
    api.results().then((r) => setItems(r.items))
  }, [])

  return (
    <>
      <div className="page-title">{t('results.title')}</div>
      <div className="page-sub">{t('results.subtitle')}</div>

      {items.length === 0 ? (
        <div className="empty-state">{t('results.empty')}</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('reports.course')}</th>
              <th>{t('upload.attempts')}</th>
              <th>{t('reports.score')}</th>
              <th>{t('results.date')}</th>
              <th>{t('reports.status')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id}>
                <td>{localized(row.courseTitleRu, row.courseTitleKk, i18n.language)}</td>
                <td>{t('results.attempt', { num: row.attempt })}</td>
                <td>{row.score}%</td>
                <td>{row.date}</td>
                <td>
                  <span className={`chip ${row.passed ? 'chip-green' : 'chip-red'}`}>
                    {row.passed ? t('testStatus.passed') : t('testStatus.failed')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
