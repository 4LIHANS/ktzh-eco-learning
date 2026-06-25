import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
            <th>{t('upload.questionCount')}</th>
            <th>{t('upload.passScore')}</th>
            <th>{t('upload.attempts')}</th>
            <th>{t('upload.timeLimit')}</th>
          </tr>
        </thead>
        <tbody>
          {tests.map((test) => (
            <tr key={test.id}>
              <td>{localized(test.courseRu, test.courseKk, i18n.language)} (№{test.lessonOrder})</td>
              <td>{test.questionCount}</td>
              <td>{test.passScore}%</td>
              <td>{test.maxAttempts}</td>
              <td>{test.timeLimitMin}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
