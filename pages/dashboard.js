import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../supabaseClient'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [supports, setSupports] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/auth')
      setUser(user)

      // Fetch logs where current user is the supporter
      const { data, error } = await supabase
        .from('support_log')
        .select(`
          id,
          created_at,
          amount,
          profiles:creator_id (
            id,
            display_name,
            photo_url,
            bio
          )
        `)
        .eq('supporter_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading support history:', error.message)
      } else {
        setSupports(data)
      }

      setLoading(false)
    }

    loadData()
  }, [])

  if (loading) return <p className="p-4">Loading...</p>

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Welcome, {user?.email}</h1>
      <p className="text-gray-600">You’re logged in 🎉</p>

      <button
        className="bg-red-600 text-white px-4 py-2 rounded"
        onClick={() => supabase.auth.signOut().then(() => router.push('/auth'))}
      >
        Log Out
      </button>

      <h2 className="text-xl font-semibold mt-10">Your Support History</h2>
      {supports.length === 0 ? (
        <p className="text-gray-500">You haven’t supported anyone yet.</p>
      ) : (
        <ul className="space-y-4">
          {supports.map((s) => (
            <li key={s.id} className="border p-4 rounded shadow-sm">
              <div className="flex items-center space-x-4">
                {s.profiles?.photo_url && (
                  <img
                    src={s.profiles.photo_url}
                    alt={s.profiles.display_name}
                    className="w-12 h-12 rounded object-cover"
                  />
                )}
                <div>
                  <p className="font-semibold">{s.profiles?.display_name || 'Unknown Creator'}</p>
                  <p className="text-sm text-gray-500">
                    Supported on {new Date(s.created_at).toLocaleDateString()} &mdash; ${s.amount}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
