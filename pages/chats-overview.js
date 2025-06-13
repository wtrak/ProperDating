import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../supabaseClient'

export default function ChatsOverview() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadThreads = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth?.user) return router.push('/auth')

      setUser(auth.user)

      const { data, error } = await supabase
        .from('chat_access')
        .select('id, creator_id, supporter_id, created_at')
        .or(`creator_id.eq.${auth.user.id},supporter_id.eq.${auth.user.id}`)

      if (error) {
        console.error('Error loading threads:', error.message)
        return
      }

      // Determine the other user in the chat
      const enriched = await Promise.all(
        data.map(async (thread) => {
          const otherId = thread.creator_id === auth.user.id ? thread.supporter_id : thread.creator_id
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, photo_url')
            .eq('id', otherId)
            .single()

          return {
            ...thread,
            display_name: profile?.display_name || 'Unknown',
            photo_url: profile?.photo_url || null,
            other_id: otherId
          }
        })
      )

      setThreads(enriched)
      setLoading(false)
    }

    loadThreads()
  }, [])

  if (loading) return <p className="p-4">Loading chats...</p>

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Your Chats</h1>
      {threads.length === 0 ? (
        <p className="text-gray-500">You have no chats yet.</p>
      ) : (
        threads.map((thread) => (
          <div
            key={thread.id}
            onClick={() => router.push(`/chat/${thread.id}`)}
            className="flex items-center gap-4 p-3 border rounded cursor-pointer hover:bg-gray-50"
          >
            <img
              src={thread.photo_url || '/default-profile.png'}
              alt="User"
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold">{thread.display_name}</p>
              <p className="text-sm text-gray-500">Tap to open chat</p>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
