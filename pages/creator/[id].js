import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { transferTokens } from '../../utils/tokenHelpers'
import { submitDateApplication } from '../../utils/tokenHelpers'


export default function CreatorProfile() {
  const router = useRouter()
  const { id } = router.query
  const [creator, setCreator] = useState(null)
  const [user, setUser] = useState(null)
  const [supportAmount, setSupportAmount] = useState('')
  const [message, setMessage] = useState('')
  const [progress, setProgress] = useState(0)
  const [unlocked, setUnlocked] = useState(false)
  const [gifts, setGifts] = useState([])
  const [photoSets, setPhotoSets] = useState([])
  const [extraPhotos, setExtraPhotos] = useState([])
  const [appForm, setAppForm] = useState({
  proposed_date: '',
  proposed_time: '',
  location: '',
  plan: '',
  gift_ideas: ''
})
const [appMessage, setAppMessage] = useState('')


  const calculateProgress = async (creatorId, goal) => {
    const { data } = await supabase
      .from('support_log')
      .select('amount')
      .eq('creator_id', creatorId)

    const total = (data || []).reduce((sum, x) => sum + Number(x.amount || 0), 0)
    setProgress(goal ? Math.min((total / goal) * 100, 100) : 0)
  }

  useEffect(() => {
    if (!id) return

    const loadPage = async () => {
      const { data: authUser } = await supabase.auth.getUser()
      if (authUser?.user) setUser(authUser.user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (profile) {
        setCreator(profile)
        await calculateProgress(profile.id, profile.monthly_goal)
        await loadGifts(profile.id)
        await loadPhotoSets(profile.id)
        await loadExtraPhotos(profile.id)
        if (authUser?.user) await checkMessagingAccess(profile.id, authUser.user.id)
      }
    // Log profile view if viewer is authenticated and not viewing own profile
if (authUser?.user && authUser.user.id !== id) {
  await supabase.from('profile_views').insert({
    viewer_id: authUser.user.id,
    viewed_id: id,
  })
}

    }

    const checkMessagingAccess = async (creatorId, supporterId) => {
  const { data, error } = await supabase
    .from('chat_access')
    .select('id') // Only select flat fields like id to avoid relation issues
    .eq('creator_id', creatorId)
    .eq('supporter_id', supporterId)
    .maybeSingle() // more tolerant than .single() for optional results

  if (error) {
    console.error('Messaging access error:', error.message)
  }

  setUnlocked(!!data)
}


    const loadGifts = async (creatorId) => {
      const { data } = await supabase
        .from('gifts')
        .select('*')
        .eq('creator_id', creatorId)

      setGifts(data || [])
    }

    const loadPhotoSets = async (creatorId) => {
      const { data } = await supabase
        .from('photo_sets')
        .select('*')
        .eq('creator_id', creatorId)

      setPhotoSets(data || [])
    }

    const loadExtraPhotos = async (creatorId) => {
      const { data } = await supabase
        .from('extra_profile_photos')
        .select('photo_url')
        .eq('user_id', creatorId)
        .limit(5)

      setExtraPhotos(data || [])
    }

    loadPage()
  }, [id])

  const handleSupport = async () => {
    if (!supportAmount) return
    if (!user) return router.push('/auth')

    const { error } = await supabase.from('support_log').insert([
      {
        supporter_id: user.id,
        creator_id: id,
        amount: Number(supportAmount)
      }
    ])

    if (!error) {
      setMessage('Thanks for your support!')
      setSupportAmount('')
      await calculateProgress(creator.id, creator.monthly_goal)
    } else {
      setMessage('Error: ' + error.message)
    }
  }

  const handleBuyGift = async (gift) => {
  if (!user) return router.push('/auth')

  const supporterId = user.id
  const creatorId = gift.creator_id || id
  const amount = parseInt(gift.price)

  const success = await transferTokens(supporterId, creatorId, amount)

  if (!success) {
    alert('Not enough tokens or transfer failed.')
    return
  }

  const { error } = await supabase.from('gift_purchases').insert({
    gift_id: gift.id,
    supporter_id: supporterId,
    creator_id: creatorId,
    price: amount,
  })

  if (error) {
    console.error('Error inserting gift purchase:', error.message)
    alert('Error sending gift: ' + error.message)
    return
  }

  alert('Gift sent successfully!')
}


const handleUnlockMessaging = async () => {
  if (!user) return router.push('/auth')

  // Step 1: Unlock access
  const { error: accessError } = await supabase.from('chat_access').insert([
    {
      supporter_id: user.id,
      creator_id: id
    }
  ])

  if (accessError) {
    alert('Error unlocking messaging: ' + accessError.message)
    return
  }

  // Step 2: Check if thread already exists
  let { data: existingThread } = await supabase
    .from('chat_threads')
    .select('*')
    .or(`creator_id.eq.${id},supporter_id.eq.${user.id}`)
    .limit(1)
    .maybeSingle()

  let threadId = existingThread?.id

  // Step 3: Create the thread if it doesn’t exist
  if (!threadId) {
    const { data: newThread, error: createError } = await supabase
      .from('chat_threads')
      .insert([{ creator_id: id, supporter_id: user.id }])
      .select()
      .single()

    if (createError) {
      alert('Failed to create chat thread: ' + createError.message)
      return
    }

    threadId = newThread.id
  }

  // ✅ Step 3b: Patch chat_access with this thread_id
  await supabase
    .from('chat_access')
    .update({ thread_id: threadId })
    .eq('creator_id', id)
    .eq('supporter_id', user.id)

  setUnlocked(true)
  router.push(`/chat/${threadId}`)
}






  const handleDateApplication = async () => {
  if (!user) return router.push('/auth')


  const boostCost = appForm.boosted ? 25 : 0
const tokenFee = 50 + boostCost

const result = await submitDateApplication({
  supporterId: user.id,
  creatorId: id,
  tokenFee,
  ...appForm,
  status: 'pending'
})


  if (result.success) {
    setAppMessage('Application submitted!')
    setAppForm({ proposed_date: '', proposed_time: '', location: '', plan: '', gift_ideas: '' })
  } else {
    setAppMessage(result.message || 'Submission failed.')
  }
}

  
if (!creator) return <p className="p-4">Loading...</p>
const handleUnlockSet = async (set) => {
  if (!user) return router.push('/auth')

  const supporterId = user.id
  const creatorId = set.creator_id || id
  const amount = parseInt(set.price)

  const success = await transferTokens(supporterId, creatorId, amount)

  if (!success) {
    alert('Not enough tokens or transfer failed.')
    return
  }

  const { error } = await supabase.from('photo_purchases').insert({
    photo_set_id: set.id,
    supporter_id: supporterId,
    creator_id: creatorId,
  })

  if (error) {
    console.error('Photo set unlock failed:', error.message)
    alert('Failed to unlock photo set: ' + error.message)
    return
  }

  alert('Photo set unlocked successfully!')
}

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      {creator.photo_url && (
        <img
          src={creator.photo_url}
          alt="Profile"
          className="w-32 h-32 rounded-full mx-auto object-cover"
        />
      )}

      {extraPhotos.length > 0 && (
        <div className="mt-4 grid grid-cols-5 gap-2">
          {extraPhotos.map((photo, index) => (
            <img
              key={index}
              src={photo.photo_url}
              alt={`Extra profile ${index + 1}`}
              className="w-full h-20 object-cover rounded-lg"
            />
          ))}
        </div>
      )}

      <h1 className="text-2xl font-bold text-center">{creator.display_name}</h1>
      <p className="text-center text-gray-600">{creator.location}</p>

      {creator.in_person ? (
        <p className="text-center text-sm text-green-700">Open to in-person support</p>
      ) : (
        <p className="text-center text-sm text-gray-700">Online support only</p>
      )}

      <p className="text-center">{creator.bio}</p>

      {user && !unlocked && (
  <div className="mt-4">
    <button
      onClick={handleUnlockMessaging}
      className="bg-purple-600 text-white px-4 py-2 rounded w-full"
    >
      Unlock Messaging
    </button>
  </div>
)}

{user && unlocked && (
  <div className="mt-4 text-center space-y-2">
    <p className="text-green-600 font-semibold">Messaging Unlocked ✅</p>
    <button
      onClick={async () => {
  if (!user || !creator) return

  const { data: existingThread, error: checkErr } = await supabase
    .from('chat_threads')
    .select('id')
      .or(`and(creator_id.eq.${creator.id},supporter_id.eq.${user.id}),and(creator_id.eq.${user.id},supporter_id.eq.${creator.id})`)
    .or(`creator_id.eq.${user.id},supporter_id.eq.${creator.id}`)
    .limit(1)
    .maybeSingle()

  let threadId = existingThread?.id

  if (!threadId) {
    const { data: newThread, error: createErr } = await supabase
      .from('chat_threads')
      .insert([{ creator_id: creator.id, supporter_id: user.id }])
      .select()
      .single()

    if (createErr) {
      console.error('Failed to create thread:', createErr.message)
      alert('Error creating message thread.')
      return
    }

    threadId = newThread.id
  }

  router.push(`/chat/${threadId}`)
}}

      className="bg-purple-700 text-white px-4 py-2 rounded"
    >
      Message
    </button>
  </div>
)}


      <div className="mt-6">
        <p className="font-semibold text-center mb-1">
          Monthly Goal: ${creator.monthly_goal}
        </p>
        <div className="w-full h-4 bg-gray-200 rounded">
          <div
            className="h-4 bg-green-500 rounded"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-2 mt-6">
        <input
          type="number"
          placeholder="Amount to support"
          value={supportAmount}
          onChange={(e) => setSupportAmount(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <button
          onClick={handleSupport}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          Support This Creator
        </button>
        {message && <p className="text-center text-green-600">{message}</p>}
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Gift Options</h2>
        <div className="space-y-3">
          {gifts.map((gift) => (
            <div key={gift.id} className="border p-3 rounded">
              <p className="font-bold">{gift.title} – {gift.price} tokens</p>
              <p className="text-sm text-gray-600 mb-2">{gift.description}</p>
              <button
                onClick={() => handleBuyGift(gift)}
                className="bg-pink-600 text-white px-4 py-1 rounded"
              >
                Buy Gift
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
  <h2 className="text-lg font-semibold mb-2">Photo Sets</h2>
  <div className="space-y-4">
    {photoSets.map((set) => {
      console.log('Preview URL:', set.preview_url)

      return (
        <div key={set.id} className="border rounded p-3">
          {set.preview_url ? (
            <img
              src={set.preview_url}
              alt="Preview"
              className="w-full h-48 object-cover rounded mb-2"
            />
          ) : (
            <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500 rounded mb-2">
              No preview image
            </div>
          )}
          <p className="font-semibold">{set.title}</p>
          <p>{set.price} tokens</p>
          <button
  className="mt-2 bg-purple-600 text-white px-4 py-1 rounded"
  onClick={() => handleUnlockSet(set)}
>
  Unlock Set
</button>
        </div>
      )
    })}
  </div>
</div>




      <div className="mt-6 border-t pt-6">
  <h2 className="text-lg font-semibold mb-2">Apply to Go on a Date</h2>
  <p className="text-sm text-gray-600 mb-4">Non-refundable application fee: 50 tokens</p>

  <input
    type="date"
    value={appForm.proposed_date}
    onChange={(e) => setAppForm({ ...appForm, proposed_date: e.target.value })}
    className="w-full border p-2 rounded mb-2"
    placeholder="Date"
  />
  <input
    type="time"
    value={appForm.proposed_time}
    onChange={(e) => setAppForm({ ...appForm, proposed_time: e.target.value })}
    className="w-full border p-2 rounded mb-2"
    placeholder="Time"
  />
  <input
    type="text"
    value={appForm.location}
    onChange={(e) => setAppForm({ ...appForm, location: e.target.value })}
    className="w-full border p-2 rounded mb-2"
    placeholder="Location or Venue"
  />
  <textarea
    value={appForm.plan}
    onChange={(e) => setAppForm({ ...appForm, plan: e.target.value })}
    className="w-full border p-2 rounded mb-2"
    placeholder="Describe your plan (restaurant, activity, etc.)"
  />
  <textarea
    value={appForm.gift_ideas}
    onChange={(e) => setAppForm({ ...appForm, gift_ideas: e.target.value })}
    className="w-full border p-2 rounded mb-2"
    placeholder="Optional: gift ideas"
  />
  <textarea
  value={appForm.why_yes || ''}
  onChange={(e) => setAppForm({ ...appForm, why_yes: e.target.value })}
  className="w-full border p-2 rounded mb-2"
  placeholder="Tell them why they should say yes..."
/>

<label className="flex items-center mb-4">
  <input
    type="checkbox"
    className="mr-2"
    checked={appForm.boosted || false}
    onChange={(e) => setAppForm({ ...appForm, boosted: e.target.checked })}
  />
  Boost my application for +25 tokens
</label>


  <button
    onClick={handleDateApplication}
    className="bg-red-600 text-white px-4 py-2 rounded w-full"
  >
    Submit Date Application
  </button>

  {appMessage && <p className="mt-2 text-center text-green-600">{appMessage}</p>}
</div>



    </div>
  )
}
