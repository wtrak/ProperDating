import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'

export default function ChatThread() {
  const router = useRouter()
  const { threadId } = router.query
  const [user, setUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [thread, setThread] = useState(null)

  // Load current user
  useEffect(() => {
    const init = async () => {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData?.user) return router.push('/auth')
      setUser(authData.user)
    }
    init()
  }, [])

  // Load thread and messages
  useEffect(() => {
    if (!threadId || !user) return

    const fetchData = async () => {
      // ✅ Get thread from chat_access
      const { data: threadData, error: threadError } = await supabase
        .from('chat_access')
        .select('*')
        .eq('id', threadId)
        .maybeSingle()

      if (threadError || !threadData) {
        console.error('Error loading thread:', threadError?.message || 'Not found')
        return
      }

      useEffect(() => {
  const markAsRead = async () => {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user) return

    await supabase
      .from('chat_reads')
      .upsert({
        thread_id: threadId,
        user_id: auth.user.id,
        last_read_at: new Date().toISOString(),
      }, { onConflict: ['thread_id', 'user_id'] })
  }

  markAsRead()
}, [threadId])


      setThread(threadData)

      // ✅ Get messages from messages table
      const { data: msgs, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true })

      if (msgError) {
        console.error('Error loading messages:', msgError.message)
      }

      setMessages(msgs || [])
      setLoading(false)
    }

    fetchData()
  }, [threadId, user])

  // Send message
  const handleSend = async () => {
    if (!input.trim() || !user || !thread) return

    const isCreator = user.id === thread.creator_id
    const receiverId = isCreator ? thread.supporter_id : thread.creator_id

    const message = {
      thread_id: threadId,
      sender_id: user.id,
      receiver_id: receiverId,
      content: input.trim(),
      creator_id: thread.creator_id,
    }

    const { error } = await supabase.from('messages').insert([message])

    if (error) {
      console.error('Send error:', error)
      alert('Error sending message: ' + error.message)
    } else {
      setMessages((prev) => [
        ...prev,
        {
          ...message,
          created_at: new Date().toISOString(),
        }
      ])
      setInput('')
    }
  }

  if (loading) return <p className="p-4">Loading chat...</p>

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Chat</h1>
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
