import { Link } from 'react-router-dom'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api, localized, type SectionItem } from '../api/client'

export function AdminUploadPage() {
  const { t, i18n } = useTranslation()
  const [sections, setSections] = useState<SectionItem[]>([])
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [sectionId, setSectionId] = useState('')

  useEffect(() => {
    api.adminSections().then(({ sections: s }) => {
      setSections(s)
      if (s[0]) setSectionId(s[0].id)
    })
  }, [])

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    const form = event.currentTarget
    const formData = new FormData(form)
    formData.set('sectionId', sectionId)
    const titleRu = formData.get('titleRu')?.toString() ?? ''
    formData.set('titleKk', titleRu)
    try {
      await api.uploadMaterial(formData)
      setSaved(true)
      form.reset()
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  return (
    <>
      <div className="screen-title">{t('upload.title')}</div>
      <form onSubmit={handleSave}>
        <div className="two-col" style={{ padding: 20 }}>
          <div>
            <div
              className="upload-zone"
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              <input ref={fileRef} type="file" name="file" hidden accept=".pdf,.docx,.pptx,.mp4,.avi" />
              <div className="upload-icon">
                <i className="ti ti-cloud-upload" aria-hidden="true" />
              </div>
              <div className="upload-text">
                <strong>{t('upload.dragDrop')}</strong> {t('upload.orClick')}
              </div>
              <div className="upload-text" style={{ marginTop: 4, fontSize: 11 }}>
                {t('upload.formats')}
              </div>
            </div>
            <div className="form-row">
              <div className="form-label">{t('upload.materialName')}</div>
              <input className="form-input" name="titleRu" placeholder={t('upload.namePlaceholder')} required />
              <input type="hidden" name="titleKk" value="" />
            </div>
            <div className="form-row">
              <div className="form-label">{t('upload.section')}</div>
              <select className="form-input" value={sectionId} onChange={(e) => setSectionId(e.target.value)} required>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {localized(s.nameRu, s.nameKk, i18n.language)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-label">{t('upload.materialType')}</div>
              <select className="form-input" name="materialType" defaultValue="VIDEO">
                <option value="VIDEO">{t('materialTypes.video')}</option>
                <option value="PPTX">{t('materialTypes.presentation')}</option>
                <option value="PDF">{t('materialTypes.pdf')}</option>
              </select>
            </div>
          </div>
          <div>
            <div className="section-heading">{t('upload.testSettings')}</div>
            <div className="form-row">
              <div className="form-label">{t('upload.questionCount')}</div>
              <input className="form-input" name="questionCount" type="number" defaultValue={10} />
            </div>
            <div className="form-row">
              <div className="form-label">{t('upload.passScore')}</div>
              <input className="form-input" name="passScore" type="number" defaultValue={70} />
            </div>
            <div className="form-row">
              <div className="form-label">{t('upload.attempts')}</div>
              <input className="form-input" name="maxAttempts" type="number" defaultValue={3} />
            </div>
            <div className="form-row">
              <div className="form-label">{t('upload.timeLimit')}</div>
              <input className="form-input" name="timeLimitMin" type="number" defaultValue={30} />
            </div>
            <div className="notif notif-amber">
              <i className="ti ti-alert-triangle" aria-hidden="true" />
              <span>{t('upload.testWarning')}</span>
            </div>
            {error && (
              <div className="notif notif-amber">
                <i className="ti ti-alert-triangle" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="btn-secondary">
                {t('upload.cancel')}
              </button>
              <button type="submit" className="btn-primary">
                {t('upload.save')}
              </button>
            </div>
            {saved && (
              <div className="notif notif-green" style={{ marginTop: 12 }}>
                <i className="ti ti-check" aria-hidden="true" />
                <span>
                  {t('upload.saved')}. {t('upload.savedHint')}{' '}
                  <Link to="/admin/tests">{t('nav.tests')}</Link>
                </span>
              </div>
            )}
          </div>
        </div>
      </form>
    </>
  )
}
