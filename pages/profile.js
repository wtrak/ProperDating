import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../supabaseClient'




function sanitizeFilename(name) {
  return name.replace(/[^a-z0-9.\-_]/gi, '-')
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState({
    display_name: '',
    bio: '',
    role: 'supporter',
    monthly_goal: '',
    location: '',
    in_person: false,
    photo_url: ''
  })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [gifts, setGifts] = useState([])
  const [newGift, setNewGift] = useState({ title: '', description: '', price: '' })
  const [photoSets, setPhotoSets] = useState([])
  const [newPhotoSet, setNewPhotoSet] = useState({ title: '', price: '' })
  const [photos, setPhotos] = useState([])
  const [preview, setPreview] = useState(null)

  const [extraPhotos, setExtraPhotos] = useState([])
  const [uploadingExtra, setUploadingExtra] = useState(false)
  const extraFileInputRef = useRef(null)


  useEffect(() => {
    const loadProfile = async () => {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData?.user) return router.push('/auth')
      const user = authData.user
      setUser(user)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Profile fetch error:', error)
        setMessage(`Error fetching profile: ${error.message}`)
        setLoading(false)
        return
      }

      if (data) {
        setProfile({ ...data })
      }

      const { data: updatedGifts } = await supabase.from('gifts').select('*').eq('creator_id', user.id)
      setGifts(updatedGifts || [])

      const { data: updatedSets } = await supabase.from('photo_sets').select('*').eq('creator_id', user.id)
      setPhotoSets(updatedSets || [])

      const { data: extra } = await supabase.from('extra_profile_photos').select('*').eq('user_id', user.id).limit(5)
      setExtraPhotos(extra || [])

      setLoading(false)
    }

    loadProfile()
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setProfile({ ...profile, [name]: type === 'checkbox' ? checked : value })
  }

  const handlePhotoUpload = async () => {
    const file = document.getElementById('profile-photo-input').files[0]
    if (!file || !user) return
    const safeName = sanitizeFilename(file.name)
    const filePath = `public/${user.id}-${Date.now()}-${safeName}`
    const { error: uploadError } = await supabase.storage.from('profile-photos').upload(filePath, file)
    if (!uploadError) {
      const url = supabase.storage.from('profile-photos').getPublicUrl(filePath).data.publicUrl
      setProfile({ ...profile, photo_url: url })
    }
  }

  const handleSave = async () => {
    setMessage('')
    const numericGoal = profile.monthly_goal === '' ? null : parseFloat(profile.monthly_goal)

    const { error } = await supabase.from('profiles').upsert([
      {
        id: user.id,
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        role: profile.role || 'supporter',
        location: profile.location || '',
        in_person: profile.in_person || false,
        monthly_goal: numericGoal,
        photo_url: profile.photo_url || ''
      }
    ])

    setMessage(error ? `Error: ${error.message}` : 'Profile saved successfully!')
  }

  const handleGiftChange = (e) => {
    setNewGift({ ...newGift, [e.target.name]: e.target.value })
  }

  const handleAddGift = async () => {
    if (!newGift.title || !newGift.price) return
    await supabase.from('gifts').insert([{ creator_id: user.id, ...newGift }])
    setNewGift({ title: '', description: '', price: '' })
    const { data: updatedGifts } = await supabase.from('gifts').select('*').eq('creator_id', user.id)
    setGifts(updatedGifts || [])
  }

  const handleDeleteGift = async (id) => {
    await supabase.from('gifts').delete().eq('id', id)
    const { data: updatedGifts } = await supabase.from('gifts').select('*').eq('creator_id', user.id)
    setGifts(updatedGifts || [])
  }

  const handleDeletePhotoSet = async (id) => {
  if (!confirm('Are you sure you want to delete this photo set and all its files?')) return

  // Step 1: Get all photo URLs from DB
  const { data: photos, error: photoLoadErr } = await supabase
    .from('photos')
    .select('url')
    .eq('set_id', id)

  if (photoLoadErr) {
    alert('Failed to load photos: ' + photoLoadErr.message)
    return
  }

  // Step 2: Get the preview URL for this set
  const { data: setData, error: setErr } = await supabase
    .from('photo_sets')
    .select('preview_url')
    .eq('id', id)
    .single()

  if (setErr) {
    alert('Failed to get photo set preview: ' + setErr.message)
    return
  }

  // Step 3: Extract file paths from URLs
  const extractPath = (url) => {
    const parts = url.split('/object/public/photo-sets/')
    return parts[1] || ''
  }

  const filePaths = photos.map(p => extractPath(p.url))
  if (setData?.preview_url) {
    filePaths.push(extractPath(setData.preview_url))
  }

  // Step 4: Delete files from Supabase Storage
  const { error: storageErr } = await supabase
    .storage
    .from('photo-sets')
    .remove(filePaths)

  if (storageErr) {
    alert('Failed to delete image files: ' + storageErr.message)
    return
  }

  // Step 5: Delete photos from DB
  const { error: photoDeleteErr } = await supabase
    .from('photos')
    .delete()
    .eq('set_id', id)

  if (photoDeleteErr) {
    alert('Failed to delete photo records: ' + photoDeleteErr.message)
    return
  }

  // Step 6: Delete the photo set
  const { error: setDeleteErr } = await supabase
    .from('photo_sets')
    .delete()
    .eq('id', id)

  if (setDeleteErr) {
    alert('Failed to delete photo set: ' + setDeleteErr.message)
    return
  }

  // Step 7: Refresh the list
  const { data: updatedSets } = await supabase
    .from('photo_sets')
    .select('*')
    .eq('creator_id', user.id)

  setPhotoSets(updatedSets || [])
}






  const handleSetChange = (e) => {
    setNewPhotoSet({ ...newPhotoSet, [e.target.name]: e.target.value })
  }

  const handleAddPhotoSet = async () => {
  if (!newPhotoSet.title || !newPhotoSet.price || !preview || photos.length === 0) return

  const cleanName = sanitizeFilename(preview.name)
  const previewPath = `${user.id}/previews/${user.id}-preview-${Date.now()}-${cleanName}`

  const { error: previewErr } = await supabase.storage
    .from('photo-sets')
    .upload(previewPath, preview)

  if (previewErr) return alert('Preview upload failed.')

  const { data: publicData } = supabase.storage
    .from('photo-sets')
    .getPublicUrl(previewPath)

  const previewUrl = publicData?.publicUrl

  const { data: newSet, error } = await supabase
    .from('photo_sets')
    .insert([{
      creator_id: user.id,
      title: newPhotoSet.title,
      price: Number(newPhotoSet.price),
      preview_url: previewUrl
    }])
    .select()
    .single()

  if (!newSet || error) return alert('Photo set creation failed.')

  // Save the preview image to the 'photos' table (optional)
  await supabase.from('photos').insert({ set_id: newSet.id, url: previewUrl })

  // Upload and store each additional photo
  for (const photo of photos) {
    const photoName = sanitizeFilename(photo.name)
    const photoPath = `${user.id}/sets/${newSet.id}-${Date.now()}-${photoName}`

    const { error: upErr } = await supabase.storage
      .from('photo-sets')
      .upload(photoPath, photo)

    if (upErr) {
      console.error('Photo upload failed:', upErr.message)
      continue
    }

    const { data: photoUrlData } = supabase.storage
      .from('photo-sets')
      .getPublicUrl(photoPath)

    const photoUrl = photoUrlData?.publicUrl

    await supabase.from('photos').insert({ set_id: newSet.id, url: photoUrl })
  }

  const { data: updatedSets } = await supabase
    .from('photo_sets')
    .select('*')
    .eq('creator_id', user.id)

  setPhotoSets(updatedSets || [])
  setNewPhotoSet({ title: '', price: '' })
  setPreview(null)
  setPhotos([])
}


  const handleExtraPhotoUpload = async (files) => {
  if (!files || uploadingExtra || !user) return
  const uploadable = Math.min(5 - extraPhotos.length, files.length)
  setUploadingExtra(true)

  for (let i = 0; i < uploadable; i++) {
    const file = files[i]
    const fileName = `extra_${user.id}_${Date.now()}_${sanitizeFilename(file.name)}`
    const filePath = `extra_photos/${fileName}`

    console.log('Uploading to:', filePath)

    const { error: uploadError } = await supabase.storage.from('profile-photos').upload(filePath, file)
    if (uploadError) {
      console.error('Upload failed:', uploadError)
      alert('Upload failed.')
      break
    }

    const { data: publicData } = supabase.storage
  .from('profile-photos')
  .getPublicUrl(filePath)

const publicUrl = publicData?.publicUrl

console.log('Generated public URL:', publicUrl)

if (!publicUrl) {
  console.error('No public URL returned.')
  continue
}

const { data: insertData, error: dbError } = await supabase
  .from('extra_profile_photos')
  .insert([{ user_id: user.id, photo_url: publicUrl }])

if (dbError) {
  console.error('Insert failed:', dbError)
} else {
  console.log('Insert successful:', insertData)
}

  }

  const { data: updated } = await supabase.from('extra_profile_photos').select('*').eq('user_id', user.id).limit(5)
  setExtraPhotos(updated || [])
  setUploadingExtra(false)
}



  const handleDeleteExtraPhoto = async (photoId) => {
    if (!confirm('Delete this photo?')) return
    await supabase.from('extra_profile_photos').delete().eq('id', photoId)
    setExtraPhotos(extraPhotos.filter((p) => p.id !== photoId))
  }

  if (loading) return <p className="p-4">Loading...</p>

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Edit Your Profile</h1>

      <p className="text-sm text-gray-700 mb-2">
  Current Token Balance: <span className="font-bold">{profile.tokens}</span>
</p>


      {profile.photo_url && (
        <img src={profile.photo_url} alt="Preview" className="w-24 h-24 rounded-full object-cover" />
      )}

      <input type="file" id="profile-photo-input" />
      <button onClick={handlePhotoUpload} className="bg-blue-600 text-white px-4 py-1 rounded">Upload Photo</button>

      {/* Extra Photos */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Extra Profile Photos</h2>
        <div className="grid grid-cols-5 gap-2 mb-2">
          {extraPhotos.map((photo) => (
            <div key={photo.id} className="relative group">
              <img src={photo.photo_url} alt="Extra" className="w-full h-20 object-cover rounded" />
              <button
                onClick={() => handleDeleteExtraPhoto(photo.id)}
                className="absolute top-0 right-0 bg-red-600 text-white text-xs px-1 rounded opacity-0 group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        {extraPhotos.length < 5 && (
  <div className="mt-2">
    <input
      type="file"
      accept="image/*"
      multiple
      ref={extraFileInputRef}
      onChange={(e) => handleExtraPhotoUpload(e.target.files)}
      className="hidden"
    />
    <button
      type="button"
      onClick={() => extraFileInputRef.current?.click()}
      className="bg-blue-600 text-white px-4 py-2 rounded"
      disabled={uploadingExtra}
    >
      Upload Extra Photo{extraPhotos.length >= 4 ? '' : 's'}
    </button>
  </div>
)}


      </div>

      <input name="display_name" value={profile.display_name} onChange={handleChange} className="w-full border p-2 rounded" placeholder="Display Name" />
      <textarea name="bio" value={profile.bio} onChange={handleChange} className="w-full border p-2 rounded" placeholder="Bio" />
      <select name="role" value={profile.role} onChange={handleChange} className="w-full border p-2 rounded">
        <option value="supporter">Supporter</option>
        <option value="creator">Creator</option>
      </select>
      <input name="location" value={profile.location} onChange={handleChange} className="w-full border p-2 rounded" placeholder="Location" />
      <label className="block"><input type="checkbox" name="in_person" checked={profile.in_person} onChange={handleChange} /> Open to In-Person Support</label>
      <input type="number" name="monthly_goal" value={profile.monthly_goal} onChange={handleChange} className="w-full border p-2 rounded" placeholder="Monthly Goal" />

      <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded">Save Profile</button>
      {message && <p>{message}</p>}

      <hr className="my-6" />
      <h2 className="text-xl font-semibold">Gift Options</h2>
      {gifts.map(gift => (
        <div key={gift.id} className="border p-2 rounded mb-2 flex justify-between">
          <div><strong>{gift.title}</strong> - ${gift.price}<br /><span className="text-sm">{gift.description}</span></div>
          <button onClick={() => handleDeleteGift(gift.id)} className="bg-red-500 text-white px-2 py-1 rounded">Delete</button>
        </div>
      ))}
      <input name="title" value={newGift.title} onChange={handleGiftChange} className="w-full border p-2 rounded" placeholder="Gift Title" />
      <input name="description" value={newGift.description} onChange={handleGiftChange} className="w-full border p-2 rounded" placeholder="Gift Description" />
      <input name="price" value={newGift.price} onChange={handleGiftChange} type="number" className="w-full border p-2 rounded" placeholder="Gift Price" />
      <button onClick={handleAddGift} className="bg-blue-600 text-white px-4 py-2 rounded">Add Gift</button>

      <hr className="my-6" />
     <h2 className="text-xl font-semibold">Photo Sets</h2>
{photoSets.map(set => (
  <div key={set.id} className="border p-2 rounded mb-2">
    {set.preview_url ? (
      <img src={set.preview_url} alt="Preview" className="w-full h-48 object-cover rounded mb-1" />
    ) : (
      <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-500 rounded mb-1">
        No preview image
      </div>
    )}
    <div><strong>{set.title}</strong> – ${set.price}</div>

    <button
      onClick={() => handleDeletePhotoSet(set.id)}
      className="mt-2 bg-red-600 text-white px-4 py-1 rounded"
    >
      Delete Photo Set
    </button>
  </div>
))}


      <input name="title" value={newPhotoSet.title} onChange={handleSetChange} className="w-full border p-2 rounded" placeholder="Photo Set Title" />
      <input name="price" value={newPhotoSet.price} onChange={handleSetChange} type="number" className="w-full border p-2 rounded" placeholder="Price" />
      <label className="block">Preview Image: <input type="file" onChange={(e) => setPreview(e.target.files[0])} /></label>
      <label className="block">Upload Photos: <input type="file" multiple onChange={(e) => setPhotos(Array.from(e.target.files))} /></label>
      <button onClick={handleAddPhotoSet} className="bg-purple-600 text-white px-4 py-2 rounded mt-2">Add Photo Set</button>
    </div>
  )
}
