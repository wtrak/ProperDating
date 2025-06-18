import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../supabaseClient'

export default function CreatorDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [applications, setApplications] = useState([])
  const [recentViewers, setRecentViewers] = useState([])
  const [tokenBalance, setTokenBalance] = useState(0)
  const [userRole, setUserRole] = useState(null)
  const [supporters, setSupporters] = useState([])


  useEffect(() => {
    const loadData = async () => {
      const { data: authUser } = await supabase.auth.getUser()
      if (!authUser?.user) return router.push('/auth')
      setUser(authUser.user)
const userId = authUser.user.id

// ✅ Fetch user role and tokens
const { data: profileData, error: profileError } = await supabase
  .from('profiles')
  .select('role, tokens')
  .eq('id', userId)
  .single()

if (profileError) {
  console.error('Error fetching profile role:', profileError.message)
  return
}

setUserRole(profileData?.role || 'supporter')
setTokenBalance(profileData?.tokens || 0)

      console.log('Logged-in user ID:', userId)

      // Load applications based on role
let applicationData = []
if (userRole === 'creator') {
  const { data, error } = await supabase
    .from('date_applications')
    .select(`
      *,
      profiles:supporter_id(display_name, photo_url)
    `)
    .eq('creator_id', userId)
    .order('submitted_at', { ascending: false })

  if (error) {
    console.error('Error loading creator applications:', error.message)
  } else {
    applicationData = data || []
  }
} else {
  const { data, error } = await supabase
    .from('date_applications')
    .select(`
      *,
      profiles:creator_id(display_name, photo_url)
    `)
    .eq('supporter_id', userId)
    .order('submitted_at', { ascending: false })

  if (error) {
    console.error('Error loading supporter applications:', error.message)
  } else {
    applicationData = data || []
  }
}
setApplications(applicationData)


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
    created_at,
    gifts(title),
    profiles:supporter_id(display_name, photo_url)
  `)
  .eq('creator_id', userId)
  .limit(10)


const { data: setUnlocks, error: unlocksError } = await supabase
  .from('photo_purchases')
  .select(`
    supporter_id,
    created_at,
    photo_sets:photo_set_id(title, price),
    profiles:supporter_id(display_name, photo_url)
  `)
  .eq('creator_id', userId)
  .order('created_at', { ascending: false })
  .limit(10)


if (unlocksError) {
  console.error('Error loading photo unlocks:', unlocksError.message)
}


  const { data: supportLog } = await supabase
  .from('support_log')
  .select(`
    supporter_id,
    amount,
    created_at,
    profiles:supporter_id(display_name, photo_url)
  `)
  .eq('creator_id', userId)
  .order('created_at', { ascending: false })
  .limit(10)

const recentSupporters = []  // move this line to here

// Now you're safe to populate it:

supportLog?.forEach((entry) => {
  recentSupporters.push({
    supporter_id: entry.supporter_id,
    display_name: entry.profiles?.display_name,
    photo_url: entry.profiles?.photo_url,
    type: 'Support',
    item: 'Monthly/One-time Support',
    amount: entry.amount,
    created_at: entry.created_at  // ✅ Add this
  })
})


giftBuyers?.forEach((g) => {
  recentSupporters.push({
    supporter_id: g.supporter_id,
    display_name: g.profiles?.display_name,
    photo_url: g.profiles?.photo_url,
    type: 'Gift Purchase',
    item: g.gifts?.title,
    amount: g.price,
    created_at: g.created_at  // ✅ Add this
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
    created_at: s.created_at  // ✅ Add this for sorting
  })
})


recentSupporters.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
setSupporters(recentSupporters)



    }

    loadData()
  }, [])

if (!userRole) return <p className="p-4">Loading dashboard...</p>


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
          <ul className="space-y-4">
  {applications.map((app) => (
    <li key={app.id} className="border p-4 rounded relative">
      <p className="text-sm text-gray-500 mb-1">
  {userRole === 'creator'
    ? `From: ${app.profiles?.display_name || 'Anonymous'}`
    : `To: ${app.profiles?.display_name || 'Unknown Creator'}`}
</p>


      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700">
          Status: {app.status}
        </span>
        {app.boosted && (
          <span className="text-xs px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full">🚀 Boosted</span>
        )}
      </div>

      <p><strong>Date:</strong> {app.proposed_date} at {app.proposed_time}</p>
      <p><strong>Location:</strong> {app.location}</p>
      <p><strong>Plan:</strong> {app.plan}</p>
      {app.gift_ideas && <p><strong>Gift Ideas:</strong> {app.gift_ideas}</p>}
      {app.why_yes && <p><strong>Why Say Yes:</strong> {app.why_yes}</p>}
      {app.creator_response && (
        <p className="mt-2 text-sm italic text-red-600">
          Response: {app.creator_response}
        </p>
      )}

      {userRole === 'creator' && app.status === 'pending' && (
  <div className="mt-4 space-y-2">
    <button
      className="bg-green-600 text-white px-3 py-1 rounded"
      onClick={async () => {
        await supabase
          .from('date_applications')
          .update({ status: 'accepted' })
          .eq('id', app.id)
        setApplications((prev) =>
          prev.map((a) => (a.id === app.id ? { ...a, status: 'accepted' } : a))
        )
      }}
    >
      ✅ Accept
    </button>

    <DeclineWithNote
      app={app}
      onUpdate={(updatedApp) => {
        setApplications((prev) =>
          prev.map((a) => (a.id === app.id ? updatedApp : a))
        )
      }}
    />
  </div>
)}


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
<div className="border p-4 rounded shadow">
  <h2 className="text-lg font-semibold mb-2">Recently Viewed Your Profile</h2>
  {recentViewers.length === 0 ? (
    <p className="text-sm text-gray-500">No recent viewers yet.</p>
  ) : (
    <ul className="space-y-2">
      {recentViewers.map((view, i) => (
        <li
          key={i}
          onClick={() => router.push(`/supporter/${view.viewer_id || view.profiles?.id}`)}
          className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <img
              src={view.profiles?.photo_url || '/default-avatar.png'}
              alt="Viewer"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="font-medium">{view.profiles?.display_name || 'Anonymous'}</p>
              <p className="text-sm text-gray-500">Viewed your profile</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">{new Date(view.viewed_at).toLocaleDateString()}</p>
        </li>
      ))}
    </ul>
  )}
</div>

</div>  // ✅ closes the main wrapper <div className="max-w-2xl mx-auto ...">
)       // ✅ closes the return statement
}       // ✅ closes the function


function DeclineWithNote({ app, onUpdate }) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState(null)

  const handleDecline = async () => {
    const { error } = await supabase
      .from('date_applications')
      .update({
        status: 'declined',
        creator_response: note || 'No reason provided.'
      })
      .eq('id', app.id)

    if (error) {
      setError(error.message)
    } else {
      onUpdate({ ...app, status: 'declined', creator_response: note })
      setOpen(false)
    }
  }

  if (!open) {
    return (
      <button
        className="bg-red-500 text-white px-3 py-1 rounded"
        onClick={() => setOpen(true)}
      >
        ❌ Decline
      </button>
    )
  }

  return (
    <div className="mt-2 space-y-2">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional: Suggest something else or explain why"
        className="w-full border p-2 rounded text-sm"
      />
      <button
        className="bg-red-600 text-white px-3 py-1 rounded"
        onClick={handleDecline}
      >
        Submit Decline
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        className="text-sm text-gray-500 underline"
        onClick={() => setOpen(false)}
      >
        Cancel
      </button>
    </div>
  )
}


