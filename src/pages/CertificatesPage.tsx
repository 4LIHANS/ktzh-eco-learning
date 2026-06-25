import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api, localized, type CertificateItem } from '../api/client'

export function CertificatesPage() {
  const { t, i18n } = useTranslation()
  const [items, setItems] = useState<CertificateItem[]>([])

  useEffect(() => {
    api.certificates().then((r) => setItems(r.items))
  }, [])

  return (
    <>
      <div className="page-title">{t('certificates.title')}</div>
      <div className="page-sub">{t('certificates.subtitle')}</div>

      {items.length === 0 ? (
        <div className="empty-state">{t('certificates.empty')}</div>
      ) : (
        items.map((cert) => (
          <div key={cert.id} className="cert-card">
            <div className="cert-icon">
              <i className="ti ti-certificate" aria-hidden="true" />
            </div>
            <div style={{ flex: 1 }}>
              <div className="course-title">{localized(cert.titleRu, cert.titleKk, i18n.language)}</div>
              <div className="course-meta">{t('certificates.issued', { date: cert.issuedAt })}</div>
            </div>
            <button type="button" className="btn-primary">{t('certificates.download')}</button>
          </div>
        ))
      )}
    </>
  )
}
