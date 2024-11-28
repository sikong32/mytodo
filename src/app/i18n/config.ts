export const defaultLocale = 'ko'
export const locales = ['ko', 'en', 'ja'] as const
export type ValidLocale = typeof locales[number]

export const getDictionary = async (locale: ValidLocale) => {
  switch (locale) {
    case 'ko':
      return import('./dictionaries/ko.json').then((module) => module.default)
    case 'en':
      return import('./dictionaries/en.json').then((module) => module.default)
    case 'ja':
      return import('./dictionaries/ja.json').then((module) => module.default)
    default:
      return import('./dictionaries/ko.json').then((module) => module.default)
  }
} 