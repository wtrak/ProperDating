'use client' // safe for pages or app router
import { useRouter } from 'next/router'

export default function LanguageSelector() {
  const router = useRouter()
  const { locale, locales, pathname, query, asPath } = router

  const handleChange = (e) => {
    const newLocale = e.target.value
    router.push({ pathname, query }, asPath, { locale: newLocale })
  }

  return (
    <select onChange={handleChange} value={locale} className="ml-auto text-sm border px-2 py-1 rounded">
      {locales.map((loc) => (
        <option key={loc} value={loc}>
          {loc.toUpperCase()}
        </option>
      ))}
    </select>
  )
}
