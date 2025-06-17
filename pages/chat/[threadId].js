import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'

export default function ChatThread() {
  const router = useRouter()
  const { threadId } = router.query
  const [user, setUser] = useState(null)
  const [thread, setThread] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [otherUser, setOtherUser] = useState(null)


  useEffect(() => {
    const getUser = async () => {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData?.user) return router.push('/auth')
      setUser(authData.user)
    }
    getUser()
  }, [])

  useEffect(() => {
    if (!threadId || !user) return

    const fetchThreadAndMessages = async () => {
      const { data: threadData, error } = await supabase
        .from('chat_threads')
        .select('*')
        .eq('id', threadId)
        .maybeSingle()

      if (error || !threadData) {
        console.error('Thread load error:', error?.message || 'Not found')
        return
      }

      setThread(threadData)

const otherUserId =
  user.id === threadData.creator_id ? threadData.supporter_id : threadData.creator_id

const { data: otherProfile, error: profileError } = await supabase
  .from('profiles')
  .select('id, display_name, photo_url')
  .eq('id', otherUserId)
  .single()

if (profileError) {
  console.error('Error loading other user profile:', profileError.message)
} else {
  setOtherUser(otherProfile)
}


      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })

      setMessages(msgs || [])
      setLoading(false)
    }

    fetchThreadAndMessages()
  }, [threadId, user])

  useEffect(() => {
    if (!threadId || !user || messages.length === 0) return

    const markAsRead = async () => {
      const { error } = await supabase
        .from('chat_reads')
        .upsert({
          thread_id: threadId,
          user_id: user.id,
          last_read_at: new Date().toISOString(),
        }, { onConflict: 'thread_id,user_id' })

      if (error) {
        console.error('Error updating read timestamp:', error.message)
      }
    }

    markAsRead()
  }, [threadId, user, messages])

  const handleSend = async () => {
    if (!input.trim() || !user || !thread) return
    const { creator_id, supporter_id } = thread
    if (!creator_id || !supporter_id) return

    const isCreator = user.id === creator_id
    const receiverId = isCreator ? supporter_id : creator_id

    const message = {
      thread_id: threadId,
      sender_id: user.id,
      receiver_id: receiverId,
      content: input.trim(),
      creator_id
    }

    const { error } = await supabase.from('messages').insert([message])

    if (!error) {
      setMessages(prev => [...prev, { ...message, created_at: new Date().toISOString() }])
      setInput('')
    }
  }

  if (loading || !user || !thread) return <p className="p-4">Loading chat...</p>

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Chat</h1>
      {otherUser && (
  <div
    className="flex items-center space-x-3 mb-4 cursor-pointer hover:bg-gray-100 p-2 rounded"
    onClick={() => router.push(`/creator/${otherUser.id}`)}
  >
    <img
      src={otherUser.photo_url || '/default-avatar.png'}
      alt={otherUser.display_name}
      className="w-10 h-10 rounded-full object-cover"
    />
    <span className="font-medium">{otherUser.display_name}</span>
  </div>
)}

      <div className="space-y-3 mb-4 border p-4 rounded h-[60vh] overflow-y-scroll bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center">No messages yet.</p>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-2 rounded max-w-[70%] ${
                msg.sender_id === user.id
                  ? 'bg-blue-100 self-end ml-auto text-right'
                  : 'bg-gray-200'
              }`}
            >
              {msg.content}
            </div>
          ))
        )}
      </div>

      <div className="flex space-x-2">
        <input
          type="text"
          className="flex-1 border rounded px-3 py-2"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend()
          }}
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  )
}
