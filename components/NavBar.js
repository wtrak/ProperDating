import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function NavBar() {
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }

    fetchUser()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id)
      } else {
        setUserId(null)
      }
    })

    return () => listener?.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }

  return (
    <nav style={{ backgroundColor: '#1f2937', padding: '1rem', color: 'white', marginBottom: '1rem' }}>
      <Link href="/home-dashboard" style={{ marginRight: '1rem' }}>Dashboard</Link>
      <Link href="/profile" style={{ marginRight: '1rem' }}>Edit Profile</Link>
      <Link href="/creators" style={{ marginRight: '1rem' }}>Creators</Link>
      {userId && (
        <Link href={`/creator/${userId}`} style={{ marginRight: '1rem' }}>
          My Public Profile
        </Link>
      )}
      <Link href="/chats-overview" style={{ marginRight: '1rem' }}>Messages</Link>
      <Link href="/my-dates" style={{ marginRight: '1rem' }}>My Dates</Link> {/* ✅ ADD THIS LINE */}
      <Link href="/topup" style={{ marginRight: '1rem', fontWeight: 'bold', color: '#22c55e' }}>💰 Buy Tokens</Link>
      <span onClick={handleLogout} style={{ color: 'red', cursor: 'pointer' }}>
        Logout
      </span>
    </nav>
  )
}
