import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import {
  api,
  localized,
  type AdminQuestion,
  type AdminQuestionOption,
  type AdminTestDetail,
  type QuestionInput,
} from '../api/client'

const emptyOption = (): AdminQuestionOption => ({
  textRu: '',
  textKk: '',
  isCorrect: false,
})

const defaultQuestion = (): QuestionInput => ({
  type: 'SINGLE',
  textRu: '',
  textKk: '',
  options: [emptyOption(), emptyOption(), emptyOption(), emptyOption()],
})

function questionToInput(q: AdminQuestion): QuestionInput {
  return {
    type: q.type,
    textRu: q.textRu,
    textKk: q.textKk,
    order: q.order,
    options: q.options.map((o) => ({
      textRu: o.textRu,
      textKk: o.textKk,
      isCorrect: o.isCorrect,
      order: o.order,
    })),
  }
}

export function AdminTestBuilderPage() {
  const { t, i18n } = useTranslation()
  const { testId } = useParams()
  const [test, setTest] = useState<AdminTestDetail | null>(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<QuestionInput>(defaultQuestion())
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    if (!testId) return
    setError('')
    try {
      const { test: data } = await api.adminGetTest(testId)
      setTest(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load test')
    }
  }, [testId])

  useEffect(() => {
    load()
  }, [load])

  const flashSaved = (message: string) => {
    setSaved(message)
    setTimeout(() => setSaved(''), 2500)
  }

  const handleSettingsSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!testId || !test) return
    const form = new FormData(event.currentTarget)
    try {
      await api.adminUpdateTest(testId, {
        passScore: Number(form.get('passScore')),
        maxAttempts: Number(form.get('maxAttempts')),
        timeLimitMin: Number(form.get('timeLimitMin')),
        questionsToShow: Number(form.get('questionsToShow')),
        requireMaterialView: form.get('requireMaterialView') === 'on',
      })
      await load()
      flashSaved(t('testBuilder.settingsSaved'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  const startCreate = () => {
    setEditingId(null)
    setDraft(defaultQuestion())
    setShowForm(true)
  }

  const startEdit = (question: AdminQuestion) => {
    setEditingId(question.id)
    setDraft(questionToInput(question))
    setShowForm(true)
  }

  const updateDraftOption = (index: number, patch: Partial<AdminQuestionOption>) => {
    setDraft((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) => (i === index ? { ...opt, ...patch } : opt)),
    }))
  }

  const setSingleCorrect = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) => ({ ...opt, isCorrect: i === index })),
    }))
  }

  const handleQuestionSave = async (event: FormEvent) => {
    event.preventDefault()
    if (!testId) return
    setError('')
    try {
      if (editingId) {
        await api.adminUpdateQuestion(editingId, draft)
      } else {
        await api.adminCreateQuestion(testId, draft)
      }
      setShowForm(false)
      setEditingId(null)
      setDraft(defaultQuestion())
      await load()
      flashSaved(t('testBuilder.questionSaved'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  const handleDelete = async (questionId: string) => {
    if (!window.confirm(t('testBuilder.deleteConfirm'))) return
    try {
      await api.adminDeleteQuestion(questionId)
      if (editingId === questionId) {
        setShowForm(false)
        setEditingId(null)
      }
      await load()
      flashSaved(t('testBuilder.questionDeleted'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  if (!test) {
    return <div className="empty-state">{error || '...'}</div>
  }

  const lang = i18n.language
  const courseTitle = localized(test.courseRu, test.courseKk, lang)
  const lessonTitle = localized(test.lessonTitleRu, test.lessonTitleKk, lang)
  const needsQuestions = test.questions.length === 0
  const tooFewQuestions = test.questions.length < test.questionsToShow

  return (
    <>
      <div className="toolbar" style={{ justifyContent: 'space-between' }}>
        <Link to="/admin/tests" className="btn-secondary" style={{ textDecoration: 'none' }}>
          <i className="ti ti-arrow-left" aria-hidden="true" /> {t('testBuilder.back')}
        </Link>
        <button type="button" className="btn-primary" onClick={startCreate}>
          <i className="ti ti-plus" aria-hidden="true" /> {t('testBuilder.addQuestion')}
        </button>
      </div>

      <div className="page-title">{courseTitle}</div>
      <div className="page-sub">
        {t('testBuilder.lessonLabel', { num: test.lessonOrder, title: lessonTitle })}
      </div>

      {(needsQuestions || tooFewQuestions) && (
        <div className="notif notif-amber" style={{ marginBottom: 12 }}>
          <i className="ti ti-alert-triangle" aria-hidden="true" />
          <span>
            {needsQuestions
              ? t('testBuilder.noQuestionsWarning')
              : t('testBuilder.fewQuestionsWarning', {
                  count: test.questions.length,
                  show: test.questionsToShow,
                })}
          </span>
        </div>
      )}

      {error && (
        <div className="notif notif-amber" style={{ marginBottom: 12 }}>
          <i className="ti ti-alert-triangle" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {saved && (
        <div className="notif notif-green" style={{ marginBottom: 12 }}>
          <i className="ti ti-check" aria-hidden="true" />
          <span>{saved}</span>
        </div>
      )}

      <div className="two-col" style={{ padding: '0 0 20px' }}>
        <div>
          <div className="section-heading">{t('testBuilder.questions')}</div>
          {test.questions.length === 0 ? (
            <div className="empty-state">{t('testBuilder.emptyQuestions')}</div>
          ) : (
            test.questions.map((question, index) => (
              <div key={question.id} className="question-card">
                <div className="question-card-head">
                  <strong>
                    {t('testBuilder.questionNum', { num: index + 1 })}
                  </strong>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn-secondary" onClick={() => startEdit(question)}>
                      {t('testBuilder.edit')}
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => handleDelete(question.id)}>
                      {t('testBuilder.delete')}
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 13, marginBottom: 8 }}>
                  {localized(question.textRu, question.textKk, lang)}
                </div>
                <div className="question-options-preview">
                  {question.options.map((opt) => (
                    <div
                      key={opt.id ?? `${question.id}-${opt.order}`}
                      className={`question-option-preview${opt.isCorrect ? ' correct' : ''}`}
                    >
                      <i
                        className={`ti ${opt.isCorrect ? 'ti-circle-check' : 'ti-circle'}`}
                        aria-hidden="true"
                      />
                      {localized(opt.textRu, opt.textKk, lang)}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div>
          <div className="section-heading">{t('upload.testSettings')}</div>
          <form onSubmit={handleSettingsSave}>
            <div className="form-row">
              <div className="form-label">{t('upload.questionCount')}</div>
              <input
                className="form-input"
                name="questionsToShow"
                type="number"
                min={1}
                max={50}
                defaultValue={test.questionsToShow}
              />
            </div>
            <div className="form-row">
              <div className="form-label">{t('upload.passScore')}</div>
              <input
                className="form-input"
                name="passScore"
                type="number"
                min={1}
                max={100}
                defaultValue={test.passScore}
              />
            </div>
            <div className="form-row">
              <div className="form-label">{t('upload.attempts')}</div>
              <input
                className="form-input"
                name="maxAttempts"
                type="number"
                min={1}
                max={10}
                defaultValue={test.maxAttempts}
              />
            </div>
            <div className="form-row">
              <div className="form-label">{t('upload.timeLimit')}</div>
              <input
                className="form-input"
                name="timeLimitMin"
                type="number"
                min={1}
                max={180}
                defaultValue={test.timeLimitMin}
              />
            </div>
            <label className="form-row" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" name="requireMaterialView" defaultChecked={test.requireMaterialView} />
              <span style={{ fontSize: 13 }}>{t('testBuilder.requireMaterialView')}</span>
            </label>
            <button type="submit" className="btn-primary">
              {t('testBuilder.saveSettings')}
            </button>
          </form>
        </div>
      </div>

      {showForm && (
        <div className="question-editor">
          <div className="section-heading">
            {editingId ? t('testBuilder.editQuestion') : t('testBuilder.newQuestion')}
          </div>
          <form onSubmit={handleQuestionSave}>
            <div className="form-row">
              <div className="form-label">{t('testBuilder.questionType')}</div>
              <select
                className="form-input"
                value={draft.type}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, type: e.target.value as 'SINGLE' | 'MULTIPLE' }))
                }
              >
                <option value="SINGLE">{t('testBuilder.typeSingle')}</option>
                <option value="MULTIPLE">{t('testBuilder.typeMultiple')}</option>
              </select>
            </div>
            <div className="form-row">
              <div className="form-label">{t('testBuilder.textRu')}</div>
              <textarea
                className="form-input"
                rows={3}
                value={draft.textRu}
                onChange={(e) => setDraft((prev) => ({ ...prev, textRu: e.target.value }))}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-label">{t('testBuilder.textKk')}</div>
              <textarea
                className="form-input"
                rows={3}
                value={draft.textKk}
                onChange={(e) => setDraft((prev) => ({ ...prev, textKk: e.target.value }))}
                required
              />
            </div>

            <div className="section-heading">{t('testBuilder.answerOptions')}</div>
            {draft.options.map((opt, index) => (
              <div key={index} className="option-editor-row">
                <label className="option-correct-toggle">
                  <input
                    type={draft.type === 'SINGLE' ? 'radio' : 'checkbox'}
                    name="correctOption"
                    checked={opt.isCorrect}
                    onChange={() =>
                      draft.type === 'SINGLE'
                        ? setSingleCorrect(index)
                        : updateDraftOption(index, { isCorrect: !opt.isCorrect })
                    }
                  />
                  {t('testBuilder.correct')}
                </label>
                <input
                  className="form-input"
                  placeholder={t('testBuilder.optionRu')}
                  value={opt.textRu}
                  onChange={(e) => updateDraftOption(index, { textRu: e.target.value })}
                  required
                />
                <input
                  className="form-input"
                  placeholder={t('testBuilder.optionKk')}
                  value={opt.textKk}
                  onChange={(e) => updateDraftOption(index, { textKk: e.target.value })}
                  required
                />
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDraft((prev) => ({ ...prev, options: [...prev.options, emptyOption()] }))}
                disabled={draft.options.length >= 10}
              >
                {t('testBuilder.addOption')}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    options: prev.options.length > 2 ? prev.options.slice(0, -1) : prev.options,
                  }))
                }
                disabled={draft.options.length <= 2}
              >
                {t('testBuilder.removeOption')}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                }}
              >
                {t('upload.cancel')}
              </button>
              <button type="submit" className="btn-primary">
                {t('testBuilder.saveQuestion')}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
