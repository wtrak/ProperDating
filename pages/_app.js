import '@/styles/globals.css'
import NavBar from '../components/NavBar'
import { appWithTranslation } from 'next-i18next'

function MyApp({ Component, pageProps }) {
  return (
    <>
      <NavBar />
      <Component {...pageProps} />
    </>
  )
}

export default appWithTranslation(MyApp)
