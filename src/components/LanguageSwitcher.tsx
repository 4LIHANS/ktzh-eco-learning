import { useTranslation } from 'react-i18next'
import { setLanguage } from '../i18n'
import { api } from '../api/client'

interface LanguageSwitcherProps {
  className?: string
}

export function LanguageSwitcher({ className = 'lang-switch' }: LanguageSwitcherProps) {
  const { i18n } = useTranslation()

  const change = async (lang: 'ru' | 'kk') => {
    await setLanguage(lang)
    try {
      await api.setLanguage(lang)
    } catch {
      // ignore if not logged in
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        className={`lang-btn ${i18n.language === 'ru' ? 'active' : ''}`}
        onClick={() => change('ru')}
      >
        Рус
      </button>
      <button
        type="button"
        className={`lang-btn ${i18n.language === 'kk' ? 'active' : ''}`}
        onClick={() => change('kk')}
      >
        Қаз
      </button>
    </div>
  )
}
