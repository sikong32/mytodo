import { Locale } from '../config'

const dictionaries = {
  ko: () => import('./ko.json').then(module => module.default),
  en: () => import('./en.json').then(module => module.default),
  ja: () => import('./ja.json').then(module => module.default),
  zh: () => import('./zh.json').then(module => module.default),
}

export const getDictionary = async (locale: Locale) => {
  return dictionaries[locale]()
} 