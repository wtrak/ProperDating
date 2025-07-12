/** @type {import('next-i18next').UserConfig} */
module.exports = {
  i18n: {
    locales: ['en', 'pl'],        // Add more languages here if needed
    defaultLocale: 'en',          // This will be the fallback/default
    localeDetection: true         // Automatically detects browser language
  },
  reloadOnPrerender: process.env.NODE_ENV === 'development'
}
