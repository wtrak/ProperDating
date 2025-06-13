import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../supabaseClient'

export default function CreatorDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [applications, setApplications] = useState([])
  const [recentViewers, setRecentViewers] = useState([])
  const [tokenBalance, setTokenBalance] = useState(0)

  useEffect(() => {
  const loadData = async () => {
    const { data: authUser } = await supabase.auth.getUser()
    if (!authUser?.user) return router.push('/auth')
    setUser(authUser.user)
    const userId = authUser.user.id
    console.log('Logged-in user ID:', userId)

    // Load date applications
    const { data: appData, error: appError } = await supabase
      .from('date_applications')
      .select('*')
      .eq('creator_id', userId)
      .order('submitted_at', { ascending: false })

    if (appError) {
      console.error('Error loading applications:', appError.message)
    } else {
      console.log('Applications loaded:', appData)
      setApplications(appData || [])
    }

    // Load recent viewers
const { data: viewerData, error: viewerError } = await supabase
  .from('profile_views')
  .select(`
    viewer_id,
    viewed_at,
    profiles!viewer_id (
      display_name,
      photo_url
    )
  `)
  .eq('viewed_id', authUser.user.id)
  .order('viewed_at', { ascending: false })
  .limit(10)



console.log('Viewer error:', viewerError)
console.log('Recent viewers raw data:', viewerData)

if (viewerError) {
  console.error('Error fetching recent viewers:', viewerError.message)
} else {
  setRecentViewers(viewerData || [])
}



    // Load token balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('tokens')
      .eq('id', userId)
      .single()
    setTokenBalance(profile?.tokens || 0)
  }

  loadData()
}, [])


  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold text-center">Creator Dashboard</h1>

      <div className="border p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Your Token Balance</h2>
        <p className="text-2xl text-green-600 font-bold">{tokenBalance} tokens</p>
      </div>

      <div className="border p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Date Applications</h2>
        {applications.length === 0 ? (
          <p className="text-sm text-gray-500">No applications yet.</p>
        ) : (
          <ul className="space-y-3">
            {applications.map((app) => (
              <li key={app.id} className="border p-3 rounded">
                <p><strong>Date:</strong> {app.proposed_date} at {app.proposed_time}</p>
                <p><strong>Location:</strong> {app.location}</p>
                <p><strong>Plan:</strong> {app.plan}</p>
                {app.gift_ideas && <p><strong>Gift Ideas:</strong> {app.gift_ideas}</p>}
                <p className="text-xs text-gray-400">From: {app.supporter_id}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Recently Viewed Your Profile</h2>
        {recentViewers.length === 0 ? (
          <p className="text-sm text-gray-500">No recent viewers yet.</p>
        ) : (
          <ul className="space-y-2">
            {recentViewers.map((view, i) => (
  <li key={i} className="flex items-center space-x-3">
    <img
      src={view.profiles?.photo_url || '/default-avatar.png'}
      alt="Viewer"
      className="w-10 h-10 rounded-full object-cover"
    />
    <span className="font-medium">
      {view.profiles?.display_name || 'Unknown'}
    </span>
  </li>
))}

          </ul>
        )}
      </div>
    </div>
  )
}
