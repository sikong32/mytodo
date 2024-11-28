export const i18n = {
  defaultLocale: 'ko',
  locales: ['ko', 'en', 'ja', 'zh'],
} as const

export type Locale = (typeof i18n)['locales'][number]

export const getDictionary = async (locale: Locale) => {
  switch (locale) {
    case 'ko':
      return import('./dictionaries/ko.json').then((module) => module.default)
    case 'en':
      return import('./dictionaries/en.json').then((module) => module.default)
    case 'ja':
      return import('./dictionaries/ja.json').then((module) => module.default)
    case 'zh':
      return import('./dictionaries/zh.json').then((module) => module.default)
    default:
      return import('./dictionaries/ko.json').then((module) => module.default)
  }
} 