import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../supabaseClient'

export default function MyDateApplications() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [applications, setApplications] = useState([])

  useEffect(() => {
    const loadApplications = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth?.user) return router.push('/auth')
      setUser(auth.user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', auth.user.id)
        .single()

      const role = profile?.role
      setUserRole(role)

      let query = supabase
        .from('date_applications')
        .select(`
          *,
          creator:creator_id(display_name, photo_url),
          supporter:supporter_id(display_name, photo_url)
        `)
        .order('submitted_at', { ascending: false })

      if (role === 'creator') {
        query = query.eq('creator_id', auth.user.id)
      } else {
        query = query.eq('supporter_id', auth.user.id)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading applications:', error.message)
      } else {
        setApplications(data || [])
      }
    }

    loadApplications()
  }, [])

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">
        {userRole === 'creator' ? 'Received Date Applications' : 'My Date Applications'}
      </h1>

      {applications.length === 0 ? (
        <p className="text-gray-500 text-center">No date applications yet.</p>
      ) : (
        <ul className="space-y-4">
          {applications.map((app) => {
            const other = userRole === 'creator' ? app.supporter : app.creator
            return (
              <li key={app.id} className="border rounded p-4 shadow">
                <div className="flex items-center mb-2 space-x-3">
                  <img
                    src={other?.photo_url || '/default-avatar.png'}
                    alt="User"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold">{other?.display_name || 'User'}</p>
                    <p className="text-sm text-gray-500">Submitted: {new Date(app.submitted_at).toLocaleString()}</p>
                  </div>
                </div>

                <p><strong>Date:</strong> {app.proposed_date} at {app.proposed_time}</p>
                <p><strong>Location:</strong> {app.location}</p>
                <p><strong>Plan:</strong> {app.plan}</p>
                {app.gift_ideas && <p><strong>Gift Ideas:</strong> {app.gift_ideas}</p>}
                {app.why_yes && <p><strong>Why Say Yes:</strong> {app.why_yes}</p>}

                <div className="mt-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    app.status === 'accepted'
                      ? 'bg-green-100 text-green-700'
                      : app.status === 'declined'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {app.status.toUpperCase()}
                  </span>
                </div>

                {app.creator_response && (
                  <p className="mt-2 text-sm text-red-600 italic">
                    Creator Response: {app.creator_response}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
