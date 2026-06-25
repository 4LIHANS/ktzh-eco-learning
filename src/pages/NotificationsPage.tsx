import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api, localized, type NotificationItem } from '../api/client'

export function NotificationsPage() {
  const { t, i18n } = useTranslation()
  const [items, setItems] = useState<NotificationItem[]>([])

  useEffect(() => {
    api.notifications().then((r) => setItems(r.items))
  }, [])

  return (
    <>
      <div className="page-title">{t('notifications.title')}</div>
      <div className="page-sub">{t('notifications.subtitle')}</div>

      {items.map((item) => (
        <div key={item.id} className={`notif ${item.isRead ? '' : 'notif-amber'}`}>
          <i className="ti ti-bell" aria-hidden="true" />
          <div>
            <div style={{ fontWeight: 500, marginBottom: 2 }}>
              {localized(item.titleRu, item.titleKk, i18n.language)}
            </div>
            <div>{localized(item.messageRu, item.messageKk, i18n.language)}</div>
          </div>
        </div>
      ))}
    </>
  )
}
