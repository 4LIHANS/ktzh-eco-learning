import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api, localized, type CourseDetail, type LessonDetail, type TestPayload } from '../api/client'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

export function CoursePage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [lesson, setLesson] = useState<LessonDetail | null>(null)
  const [test, setTest] = useState<TestPayload | null>(null)
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [videoWatched, setVideoWatched] = useState(false)
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    api
      .getCourse(id)
      .then((data) => {
        setCourse(data)
        const lessonOrder = Number(searchParams.get('lesson') ?? 3)
        const current =
          data.lessons.find((l) => l.order === lessonOrder) ??
          data.lessons.find((l) => !l.completed) ??
          data.lessons[0]
        setLesson(current ?? null)
        setVideoWatched(current?.videoWatched ?? false)
      })
      .catch((e) => setError(e.message))
  }, [id, searchParams])

  useEffect(() => {
    if (!id || !lesson || !lesson.hasTest) return
    api
      .getTest(id, lesson.id)
      .then(setTest)
      .catch(() => setTest(null))
  }, [id, lesson, videoWatched])

  const handleWatch = async () => {
    if (!id || !lesson) return
    await api.watchLesson(id, lesson.id)
    setVideoWatched(true)
  }

  const handleSubmit = async () => {
    if (!id || !lesson || !test) return
    const answers = test.questions.map((q) => ({
      questionId: q.id,
      optionIds: selected[q.id] ? [selected[q.id]] : [],
    }))
    const res = await api.submitTest(id, lesson.id, answers)
    setResult({ score: res.score, passed: res.passed })
  }

  if (error) return <div className="empty-state">{error}</div>
  if (!course || !lesson) return <div className="empty-state">...</div>

  const lang = i18n.language
  const title = localized(course.titleRu, course.titleKk, lang)
  const lessonTitle = localized(lesson.titleRu, lesson.titleKk, lang)
  const durationMin = Math.floor(lesson.durationSec / 60)
  const durationSec = lesson.durationSec % 60

  return (
    <div className="app-shell">
      <div className="screen">
        <div className="topbar">
          <div className="topbar-logo">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              <i className="ti ti-arrow-left" aria-hidden="true" />
              {title}
            </button>
          </div>
          <div className="topbar-right">
            <LanguageSwitcher />
            <span className="badge badge-green">
              {t('courseView.lessonOf', { current: lesson.order, total: course.lessons.length })}
            </span>
          </div>
        </div>

        <div className="two-col" style={{ padding: 20 }}>
          <div>
            <div className="video-area">
              <button type="button" className="play-btn" onClick={handleWatch} aria-label="Play">
                <i className="ti ti-player-play" aria-hidden="true" />
              </button>
              <div className="video-label">
                {t('courseView.lessonTitle', { num: lesson.order, title: lessonTitle })}
              </div>
              <div className="video-dur">
                {String(durationMin).padStart(2, '0')}:{String(durationSec).padStart(2, '0')}
              </div>
            </div>

            {course.lessons.map((l) => (
              <div key={l.id} className="mat-item" style={{ borderBottom: l.completed ? 'none' : undefined }}>
                <div
                  className="mat-icon"
                  style={{ background: l.completed ? '#e1f5ee' : '#e6f1fb', color: l.completed ? '#1a5c38' : '#185fa5' }}
                >
                  <i className={`ti ${l.completed ? 'ti-check' : 'ti-book'}`} aria-hidden="true" />
                </div>
                <div style={{ flex: 1 }}>
                  {t('courseView.lessonCompleted', { num: l.order }).replace('— завершён', l.completed ? ' — завершён' : '')}
                  {!l.completed && ` — ${localized(l.titleRu, l.titleKk, lang)}`}
                </div>
                {l.completed && <span className="badge badge-green">{t('courseView.viewed')}</span>}
              </div>
            ))}

            {lesson.materials.map((m) => (
              <div key={m.id} className="mat-item">
                <div className="mat-icon mat-pdf">
                  <i className="ti ti-file-type-pdf" aria-hidden="true" />
                </div>
                <div style={{ flex: 1 }}>{localized(m.titleRu, m.titleKk, lang)}</div>
                <a href={api.downloadMaterial(m.id)} download style={{ color: 'var(--color-text-secondary)' }}>
                  <i className="ti ti-download" style={{ fontSize: 15 }} aria-hidden="true" />
                </a>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
              {t('courseView.testTitle', { num: lesson.order })}
            </div>

            {result ? (
              <div className="test-block">
                <div className="test-q">
                  {result.passed ? t('testStatus.passed') : t('testStatus.failed')}: {result.score}%
                </div>
              </div>
            ) : test && test.questions[0] ? (
              <div className="test-block">
                <div className="test-q">
                  {localized(test.questions[0].textRu, test.questions[0].textKk, lang)}
                </div>
                {test.questions[0].options.map((opt) => (
                  <div
                    key={opt.id}
                    className={`test-opt${selected[test.questions[0]!.id] === opt.id ? ' selected' : ''}`}
                    onClick={() => videoWatched && setSelected({ [test.questions[0]!.id]: opt.id })}
                    style={{ opacity: videoWatched ? 1 : 0.6, pointerEvents: videoWatched ? 'auto' : 'none' }}
                  >
                    <i
                      className={`ti ${selected[test.questions[0]!.id] === opt.id ? 'ti-circle-check' : 'ti-circle'}`}
                      aria-hidden="true"
                    />
                    {localized(opt.textRu, opt.textKk, lang)}
                  </div>
                ))}
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={!videoWatched || !selected[test.questions[0]!.id]}
                    onClick={handleSubmit}
                  >
                    {t('courseView.nextQuestion')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-state">{error || '...'}</div>
            )}

            {!videoWatched && (
              <div style={{ marginTop: 12 }}>
                <div className="notif notif-green">
                  <i className="ti ti-info-circle" aria-hidden="true" />
                  <span>{t('courseView.testLocked')}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
