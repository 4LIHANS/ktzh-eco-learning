import { type FormEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api, type PlatformSettings } from '../api/client'

export function AdminSettingsPage() {
  const { t } = useTranslation()
  const [settings, setSettings] = useState<PlatformSettings | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.getSettings().then((r) => setSettings(r.settings))
  }, [])

  const handleSave = async (event: FormEvent) => {
    event.preventDefault()
    if (!settings) return
    await api.updateSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (!settings) return <div className="empty-state">...</div>

  return (
    <>
      <div className="page-title">{t('settings.title')}</div>
      <div className="page-sub">{t('settings.subtitle')}</div>

      <form onSubmit={handleSave} style={{ maxWidth: 520 }}>
        <div className="form-row">
          <label className="form-label">
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
              style={{ marginRight: 8 }}
            />
            {t('settings.notifications')}
          </label>
        </div>
        <div className="form-row">
          <label className="form-label">
            <input
              type="checkbox"
              checked={settings.ssoEnabled}
              onChange={(e) => setSettings({ ...settings, ssoEnabled: e.target.checked })}
              style={{ marginRight: 8 }}
            />
            {t('settings.sso')}
          </label>
        </div>
        <div className="form-row">
          <label className="form-label">
            <input
              type="checkbox"
              checked={settings.backupEnabled}
              onChange={(e) => setSettings({ ...settings, backupEnabled: e.target.checked })}
              style={{ marginRight: 8 }}
            />
            {t('settings.backup')}
          </label>
        </div>
        <button type="submit" className="btn-primary">{t('settings.save')}</button>
        {saved && (
          <div className="notif notif-green" style={{ marginTop: 12 }}>
            <i className="ti ti-check" aria-hidden="true" />
            <span>{t('settings.saved')}</span>
          </div>
        )}
      </form>
    </>
  )
}
