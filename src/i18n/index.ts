import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ru from './locales/ru.json'
import kk from './locales/kk.json'

const savedLang = localStorage.getItem('ktzh-lang') ?? 'ru'

i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    kk: { translation: kk },
  },
  lng: savedLang,
  fallbackLng: 'ru',
  interpolation: { escapeValue: false },
})

export default i18n

export function setLanguage(lang: 'ru' | 'kk') {
  localStorage.setItem('ktzh-lang', lang)
  document.documentElement.lang = lang
  return i18n.changeLanguage(lang)
}

document.documentElement.lang = savedLang
