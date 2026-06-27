import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { api, localized, type AdminTest } from '../api/client'

export function AdminTestsPage() {
  const { t, i18n } = useTranslation()
  const [tests, setTests] = useState<AdminTest[]>([])

  useEffect(() => {
    api.adminTests().then((r) => setTests(r.tests))
  }, [])

  return (
    <>
      <div className="page-title">{t('tests.title')}</div>
      <div className="page-sub">{t('tests.subtitle')}</div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>{t('reports.course')}</th>
            <th>{t('testBuilder.questionsCreated')}</th>
            <th>{t('upload.questionCount')}</th>
            <th>{t('upload.passScore')}</th>
            <th>{t('upload.attempts')}</th>
            <th>{t('upload.timeLimit')}</th>
            <th>{t('testBuilder.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {tests.map((test) => {
            const ready = test.questionCount >= test.questionsToShow
            return (
              <tr key={test.id}>
                <td>
                  {localized(test.courseRu, test.courseKk, i18n.language)} (№{test.lessonOrder})
                </td>
                <td>
                  {test.questionCount}
                  {!ready && (
                    <span className="chip chip-amber" style={{ marginLeft: 8 }}>
                      {t('testBuilder.incomplete')}
                    </span>
                  )}
                  {test.questionCount === 0 && (
                    <span className="chip chip-red" style={{ marginLeft: 8 }}>
                      {t('testBuilder.empty')}
                    </span>
                  )}
                </td>
                <td>{test.questionsToShow}</td>
                <td>{test.passScore}%</td>
                <td>{test.maxAttempts}</td>
                <td>{test.timeLimitMin}</td>
                <td>
                  <Link to={`/admin/tests/${test.id}`} className="btn-secondary" style={{ textDecoration: 'none' }}>
                    {t('testBuilder.edit')}
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}
