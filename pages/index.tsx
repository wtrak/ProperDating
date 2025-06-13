import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/auth') // use replace instead of push to avoid back button to index
  }, [router])

  return null
}
