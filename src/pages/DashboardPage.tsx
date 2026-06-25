import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { api, localized, type CourseCard, type DashboardStats } from '../api/client'
import { useAuth } from '../context/AuthContext'

function statusBadge(course: CourseCard, t: (key: string, opts?: Record<string, unknown>) => string) {
  if (course.status === 'completed') {
    return <span className="badge badge-green">{t('courseStatus.completed')}</span>
  }
  if (course.status === 'inProgress') {
    return (
      <span className="badge badge-amber">
        {t('courseStatus.inProgress', { percent: course.progress })}
      </span>
    )
  }
  return <span className="badge badge-gray">{t('courseStatus.notStarted')}</span>
}

export function DashboardPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.dashboardStats().then(setStats).catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="empty-state">{error}</div>
  if (!stats) return <div className="empty-state">...</div>

  return (
    <>
      <div className="page-title">
        {t('dashboard.welcome', { name: user?.firstName ?? t('user.firstName') })}
      </div>
      <div className="page-sub">{t('dashboard.unfinished', { count: stats.unfinished })}</div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">{t('dashboard.totalCourses')}</div>
          <div className="stat-value">{stats.totalCourses}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('dashboard.completed')}</div>
          <div className="stat-value stat-green">{stats.completedCourses}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('dashboard.inProgress')}</div>
          <div className="stat-value">{stats.inProgressCourses}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('dashboard.avgScore')}</div>
          <div className="stat-value stat-green">{stats.avgScore}%</div>
        </div>
      </div>

      <div className="course-grid">
        {stats.courses.map((course) => (
          <div
            key={course.id}
            className="course-card"
            onClick={() => navigate(`/course/${course.id}`)}
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/course/${course.id}`)}
            role="button"
            tabIndex={0}
          >
            <div className={`course-thumb thumb-${course.thumbColor}`}>
              <i
                className={`ti ${course.icon}`}
                style={{ color: course.iconColor, fontSize: 28 }}
                aria-hidden="true"
              />
            </div>
            <div className="course-body">
              <div className="course-title">
                {localized(course.titleRu, course.titleKk, i18n.language)}
              </div>
              <div className="course-meta">
                {t('dashboard.lessons', { count: course.lessons })} ·{' '}
                {t('dashboard.duration', { min: course.durationMin })}
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${course.progress}%` }} />
              </div>
              <div style={{ marginTop: 6 }}>{statusBadge(course, t)}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
