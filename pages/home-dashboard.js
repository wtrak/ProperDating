import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../supabaseClient'

export default function CreatorDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [applications, setApplications] = useState([])
  const [recentViewers, setRecentViewers] = useState([])
  const [tokenBalance, setTokenBalance] = useState(0)
  const [supporters, setSupporters] = useState([])


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
            id,
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

// ✅ Paste this block right below:
const { data: giftBuyers } = await supabase
  .from('gift_purchases')
  .select(`
    supporter_id,
    price,
    gifts(title),
    profiles:supporter_id(display_name, photo_url)
  `)
  .eq('creator_id', userId)
  .limit(10)

const { data: setUnlocks } = await supabase
  .from('photo_purchases')
  .select(`
    supporter_id,
    photo_sets(title, price),
    profiles:supporter_id(display_name, photo_url)
  `)
  .eq('creator_id', userId)
  .limit(10)

const recentSupporters = []

giftBuyers?.forEach((g) => {
  recentSupporters.push({
    supporter_id: g.supporter_id,
    display_name: g.profiles?.display_name,
    photo_url: g.profiles?.photo_url,
    type: 'Gift Purchase',
    item: g.gifts?.title,
    amount: g.price,
  })
})

setUnlocks?.forEach((s) => {
  recentSupporters.push({
    supporter_id: s.supporter_id,
    display_name: s.profiles?.display_name,
    photo_url: s.profiles?.photo_url,
    type: 'Photo Set',
    item: s.photo_sets?.title,
    amount: s.photo_sets?.price,
  })
})

setSupporters(recentSupporters)

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
              <li
                key={i}
                onClick={() => router.push(`/creator/${view.viewer_id || view.profiles?.id}`)}
                className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 p-2 rounded"
              >
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

<div className="border p-4 rounded shadow">
  <h2 className="text-lg font-semibold mb-2">Recent Supporters</h2>
  {supporters.length === 0 ? (
    <p className="text-sm text-gray-500">No recent supporters yet.</p>
  ) : (
    <ul className="space-y-2">
      {supporters.map((s, i) => (
        <li
          key={i}
          onClick={() => router.push(`/supporter/${s.supporter_id}`)}
          className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <img
              src={s.photo_url || '/default-avatar.png'}
              alt="Supporter"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="font-medium">{s.display_name || 'Anonymous'}</p>
              <p className="text-sm text-gray-500">{s.type}: {s.item}</p>
            </div>
          </div>
                    <p className="text-sm font-semibold text-green-600">+${s.amount}</p>
        </li>
      ))}
    </ul>
  )}
</div>  

</div>  // ✅ closes the main wrapper <div className="max-w-2xl mx-auto ...">
)       // ✅ closes the return statement
}       // ✅ closes the function
