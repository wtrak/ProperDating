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

      // Load chat_access + joined chat_threads + profiles
      const { data: accessData, error } = await supabase
        .from('chat_access')
        .select(`
          id,
          creator_id,
          supporter_id,
          thread:thread_id (
            id
          ),
          creator:creator_id (
            display_name,
            photo_url
          ),
          supporter:supporter_id (
            display_name,
            photo_url
          )
        `)
        .or(`creator_id.eq.${auth.user.id},supporter_id.eq.${auth.user.id}`)

      if (error) {
        console.error('Error loading threads:', error)
        return
      }

      // Enrich with unread counts
      const threadsWithUnread = await Promise.all(accessData.map(async (access) => {
        const thread = access.thread
        if (!thread) return null // skip broken joins

        const isCreator = access.creator_id === auth.user.id
        const other = isCreator ? access.supporter : access.creator
        const otherUserId = isCreator ? access.supporter_id : access.creator_id

        // Get last read
        const { data: readData } = await supabase
          .from('chat_reads')
          .select('last_read_at')
          .eq('thread_id', thread.id)
          .eq('user_id', auth.user.id)
          .maybeSingle()

        const lastReadAt = readData?.last_read_at || '1970-01-01T00:00:00Z'

        const { data: unreadMessages } = await supabase
          .from('messages')
          .select('id')
          .eq('thread_id', thread.id)
          .eq('sender_id', otherUserId)
          .gt('created_at', lastReadAt)

        return {
          thread_id: thread.id,
          display_name: other.display_name,
          photo_url: other.photo_url,
          unreadCount: unreadMessages?.length || 0,
        }
      }))

      const cleaned = threadsWithUnread.filter(Boolean)

      cleaned.sort((a, b) => {
        if (a.unreadCount > 0 && b.unreadCount === 0) return -1
        if (a.unreadCount === 0 && b.unreadCount > 0) return 1
        return 0
      })

      setThreads(cleaned)
      setLoading(false)
    }

    window.addEventListener('focus', loadThreads)
    loadThreads()
    return () => window.removeEventListener('focus', loadThreads)
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
            key={thread.thread_id}
            onClick={() => router.push(`/chat/${thread.thread_id}`)}
            className="relative flex items-center gap-4 p-3 border rounded cursor-pointer hover:bg-gray-50"
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
            {thread.unreadCount > 0 && (
              <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                {thread.unreadCount}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
