import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../supabaseClient'





function sanitizeFilename(name) {
  return name.replace(/[^a-z0-9.\-_]/gi, '-')
}
import { useTranslation } from 'next-i18next'
export default function ProfilePage() {
  const { t } = useTranslation('common')
  const router = useRouter()

  const [age, setAge] = useState('');
const [hairColor, setHairColor] = useState('');
const [eyeColor, setEyeColor] = useState('');
const [shoeSize, setShoeSize] = useState('');
const [weight, setWeight] = useState('');
const [height, setHeight] = useState('');
const [braSize, setBraSize] = useState('');
const [languages, setLanguages] = useState([]);
const [ethnicity, setEthnicity] = useState('');
const [monthlyGoal, setMonthlyGoal] = useState('');


  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)

  const [profile, setProfile] = useState({
    display_name: '',
    bio: '',
    role: 'supporter',
    monthly_goal: null,
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

  const [uploadingProfile, setUploadingProfile] = useState(false)
const [uploadingPreview, setUploadingPreview] = useState(false)
const [uploadingSetPhotos, setUploadingSetPhotos] = useState(false)

  const [extraPhotos, setExtraPhotos] = useState([])
  const [uploadingExtra, setUploadingExtra] = useState(false)
  const extraFileInputRef = useRef(null)


  useEffect(() => {
  const loadProfile = async () => {
    const { data: authUser } = await supabase.auth.getUser()
    if (!authUser?.user) return router.push('/auth')

    const user = authUser.user
    setUser(user)

    const userId = user.id

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*') // fetch full profile so we can use its fields
      .eq('id', userId)
      .single()

    if (!profileData) {
      setMessage('Profile not found')
      setLoading(false)
      return
    }

    setProfile({ ...profileData })
    setMonthlyGoal(profileData.monthly_goal?.toString() || '')
    setRole(profileData.role || 'supporter')
    setAge(profileData.age || '')
    setHairColor(profileData.hair_color || '')
    setEyeColor(profileData.eye_color || '')
    setShoeSize(profileData.shoe_size || '')
    setWeight(profileData.weight_kg || '')
    setHeight(profileData.height_m || '')
    setBraSize(profileData.bra_size || '')
    setLanguages(profileData.languages_spoken || [])
    setEthnicity(profileData.ethnicity || '')

    const { data: updatedGifts } = await supabase
      .from('gifts')
      .select('*')
      .eq('creator_id', userId)
    setGifts(updatedGifts || [])

    const { data: updatedSets } = await supabase
      .from('photo_sets')
      .select('*')
      .eq('creator_id', userId)
    setPhotoSets(updatedSets || [])

    const { data: extra } = await supabase
      .from('extra_profile_photos')
      .select('*')
      .eq('user_id', userId)
      .limit(5)
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
  setUploadingProfile(true)
  const safeName = sanitizeFilename(file.name)
  const filePath = `public/${user.id}-${Date.now()}-${safeName}`
  const { error: uploadError } = await supabase.storage.from('profile-photos').upload(filePath, file)
  if (!uploadError) {
    const url = supabase.storage.from('profile-photos').getPublicUrl(filePath).data.publicUrl
    setProfile({ ...profile, photo_url: url })
  }
  setUploadingProfile(false)
}


  const handleSave = async () => {
  setMessage('')

  const numericGoal = /^\d+(\.\d+)?$/.test(monthlyGoal) ? parseFloat(monthlyGoal) : null

  console.log('Saving with role:', role) // ✅ Debug log

const { error } = await supabase.from('profiles').upsert([
  {
    id: user.id,
    display_name: profile.display_name || '',
    bio: profile.bio || '',
    location: profile.location || '',
    in_person: profile.in_person || false,
    monthly_goal: numericGoal,
    photo_url: profile.photo_url || '',
    role: role || 'supporter', // ✅ This line is critical

    // Custom fields
    age: age === '' ? null : parseInt(age),
    hair_color: hairColor,
    eye_color: eyeColor,
    shoe_size: shoeSize === '' ? null : parseFloat(shoeSize),
    weight_kg: weight === '' ? null : parseFloat(weight),
    height_m: height === '' ? null : parseFloat(height),
    bra_size: braSize,
    languages_spoken: languages,
    ethnicity
  }
])



  if (error) {
    console.error('Profile save error:', error)
    setMessage('Error saving profile')
  } else {
    setMessage('Profile saved successfully!')
  }
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

  setUploadingPreview(true)
const { error: previewErr } = await supabase.storage.from('photo-sets').upload(previewPath, preview)
setUploadingPreview(false)


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

  setUploadingSetPhotos(true)

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

setUploadingSetPhotos(false)


  const { data: updatedSets } = await supabase
    .from('photo_sets')
    .select('*')
    .eq('creator_id', user.id)

  setPhotoSets(updatedSets || [])
  setNewPhotoSet({ title: '', price: '' })
  setPreview(null)
  setPhotos([])
}

const handleExtraPhotoUpload = async (e, slot) => {
  const file = e.target.files[0]
  if (!file || !user) return

  setUploadingExtra(true)

  const filePath = `extra/${user.id}-${slot}-${Date.now()}-${sanitizeFilename(file.name)}`
  const { error: uploadError } = await supabase.storage.from('profile-photos').upload(filePath, file)

  if (uploadError) {
    console.error('Upload failed:', uploadError)
    alert('Upload failed.')
    setUploadingExtra(false)
    return
  }

  const { data: publicData } = supabase.storage
    .from('profile-photos')
    .getPublicUrl(filePath)

  const publicUrl = publicData?.publicUrl

  if (!publicUrl) {
    console.error('No public URL returned.')
    setUploadingExtra(false)
    return
  }

  const { data: insertData, error: dbError } = await supabase
    .from('extra_profile_photos')
    .insert([{ user_id: user.id, photo_url: publicUrl }])

  if (dbError) {
    console.error('Insert failed:', dbError)
  } else {
    console.log('Insert successful:', insertData)
  }

  const { data: updated } = await supabase
    .from('extra_profile_photos')
    .select('*')
    .eq('user_id', user.id)
    .limit(5)

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


<div className="flex flex-col items-center space-y-2 mb-4">
  {profile.photo_url ? (
    <>
      <img
        src={profile.photo_url}
        alt="Profile"
        className="w-24 h-24 rounded-full object-cover"
      />
      <input
        type="file"
        id="profile-photo"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files[0]
          if (file) {
            document.getElementById('profile-photo-input').files = e.target.files
            handlePhotoUpload()
          }
        }}
      />
      <label
        htmlFor="profile-photo"
        className="bg-blue-600 text-white text-sm px-4 py-1 rounded cursor-pointer"
      >
        {t('change_photo')}
      </label>
    </>
  ) : (
    <>
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-sm text-gray-500">
        {t('no_photo')}
      </div>
      <input
        type="file"
        id="profile-photo"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files[0]
          if (file) {
            document.getElementById('profile-photo-input').files = e.target.files
            handlePhotoUpload()
          }
        }}
      />
      <label
        htmlFor="profile-photo"
        className="bg-blue-600 text-white text-sm px-4 py-1 rounded cursor-pointer"
      >
        {t('add_photo')}
      </label>
    </>
  )}
  <input type="file" id="profile-photo-input" className="hidden" />
  {uploadingProfile && <p className="text-sm text-yellow-600">{t('uploading_profile_photo')}</p>}
</div>

{/* Extra Photos */}
<div className="mt-6">
  <h2 className="text-lg font-semibold mb-2">{t('extra_profile_photos')}</h2>
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
    {uploadingExtra && <p className="text-sm text-yellow-600 mt-2">{t('uploading_extra_photo')}</p>}

    {[0, 1, 2, 3, 4].map((index) => {
      const photo = extraPhotos[index]
      return (
        <div key={index} className="flex flex-col items-center">
          {photo ? (
            <>
              <img
                src={photo.photo_url}
                alt="Extra"
                className="w-24 h-24 object-cover rounded mb-1"
              />
              <button
                onClick={() => handleDeleteExtraPhoto(photo.id)}
                className="bg-red-500 text-white text-sm px-2 py-1 rounded"
              >
                {t('delete')}
              </button>
            </>
          ) : (
            <>
              <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-500">
                {t('empty')}
              </div>
              <input
                type="file"
                accept="image/*"
                id={`extra-upload-${index}`}
                className="hidden"
                onChange={(e) => handleExtraPhotoUpload(e, index)}
              />
              <label
                htmlFor={`extra-upload-${index}`}
                className="bg-blue-600 text-white text-sm px-2 py-1 rounded cursor-pointer mt-1"
              >
                {t('add_photo')}
              </label>
            </>
          )}
        </div>
      )
    })}
  </div>
</div>



      <input name="display_name" value={profile.display_name} onChange={handleChange} className="w-full border p-2 rounded" placeholder="Display Name" />
      <textarea name="bio" value={profile.bio} onChange={handleChange} className="w-full border p-2 rounded" placeholder="Bio" />
      
      <label className="block font-semibold mt-4">City</label>
<select
  name="location"
  value={profile.location}
  onChange={handleChange}
  className="w-full border p-2 rounded"
>
  <option value="">Select City</option>
  {[
    'Warsaw',
    'Kraków',
    'Łódź',
    'Wrocław',
    'Poznań',
    'Gdańsk',
    'Szczecin',
    'Bydgoszcz',
    'Lublin',
    'Katowice',
    'Białystok',
    'Gdynia',
    'Częstochowa',
    'Radom',
    'Toruń',
    'Sosnowiec',
    'Kielce',
    'Gliwice',
    'Zabrze',
    'Olsztyn',
    'Rzeszów',
    'Bielsko-Biała',
    'Other'
  ].map(city => (
    <option key={city} value={city}>{city}</option>
  ))}
</select>

      {role === 'creator' && (
  <label className="block">
    <input
      type="checkbox"
      name="in_person"
      checked={profile.in_person}
      onChange={handleChange}
    /> Open to In-Person Support
  </label>
)}

      {/* --- New Creator Attributes --- */}

<label className="block font-semibold mt-4">Age</label>
<select value={age} onChange={e => setAge(e.target.value)} className="w-full border p-2 rounded">
  <option value="">Select Age</option>
  {Array.from({ length: 43 }, (_, i) => (
    <option key={i} value={i + 18}>{i + 18}</option>
  ))}
  <option value="60+">60+</option>
</select>

{role === 'creator' && (
  <>
    <label className="block font-semibold mt-4">Hair Color</label>
    <select value={hairColor} onChange={e => setHairColor(e.target.value)} className="w-full border p-2 rounded">
      <option value="">Select Hair Color</option>
      <option value="Blonde">Blonde</option>
      <option value="Brown">Brown</option>
      <option value="Black">Black</option>
      <option value="Red">Red</option>
      <option value="Auburn">Auburn</option>
      <option value="Gray">Gray</option>
      <option value="Dyed">Dyed</option>
      <option value="Bald/Shaved">Bald/Shaved</option>
    </select>

    <label className="block font-semibold mt-4">Eye Color</label>
    <select value={eyeColor} onChange={e => setEyeColor(e.target.value)} className="w-full border p-2 rounded">
      <option value="">Select Eye Color</option>
      <option value="Blue">Blue</option>
      <option value="Brown">Brown</option>
      <option value="Green">Green</option>
      <option value="Hazel">Hazel</option>
      <option value="Gray">Gray</option>
      <option value="Other">Other</option>
    </select>

    <label className="block font-semibold mt-4">Shoe Size (EU)</label>
    <select value={shoeSize} onChange={e => setShoeSize(e.target.value)} className="w-full border p-2 rounded">
      <option value="">Select Shoe Size</option>
      {Array.from({ length: 33 }, (_, i) => {
        const size = (32 + i * 0.5).toFixed(1);
        return <option key={size} value={size}>{size}</option>;
      })}
    </select>

    <label className="block font-semibold mt-4">Weight (kg)</label>
    <select value={weight} onChange={e => setWeight(e.target.value)} className="w-full border p-2 rounded">
      <option value="">Select Weight</option>
      {Array.from({ length: 13 }, (_, i) => {
        const w = 40 + i * 5;
        return <option key={w} value={w}>{w} kg</option>;
      })}
      <option value="100+">100+ kg</option>
    </select>

    <label className="block font-semibold mt-4">Height (m)</label>
    <select value={height} onChange={e => setHeight(e.target.value)} className="w-full border p-2 rounded">
      <option value="">Select Height</option>
      {Array.from({ length: 17 }, (_, i) => {
        const h = (1.30 + i * 0.05).toFixed(2);
        return <option key={h} value={h}>{h} m</option>;
      })}
    </select>

    <label className="block font-semibold mt-4">Bra Size</label>
    <select value={braSize} onChange={e => setBraSize(e.target.value)} className="w-full border p-2 rounded">
      <option value="">Select Bra Size</option>
      {['AA', 'A', 'B', 'C', 'D', 'DD', 'E', 'F', 'G', 'Other'].map(size => (
        <option key={size} value={size}>{size}</option>
      ))}
    </select>

    <label className="block font-semibold mt-4">Languages Spoken</label>
    <select
      multiple
      value={languages}
      onChange={(e) => {
        const selected = Array.from(e.target.selectedOptions, opt => opt.value)
        setLanguages(selected)
      }}
      className="w-full border p-2 rounded h-40"
    >
      {['English', 'Polish', 'Spanish', 'German', 'French', 'Ukrainian', 'Russian', 'Italian', 'Other'].map(lang => (
        <option key={lang} value={lang}>{lang}</option>
      ))}
    </select>

    <label className="block font-semibold mt-4">Ethnicity</label>
    <select value={ethnicity} onChange={e => setEthnicity(e.target.value)} className="w-full border p-2 rounded">
      <option value="">Select Ethnicity</option>
      <option value="Caucasian">Caucasian</option>
      <option value="Black">Black</option>
      <option value="Hispanic/Latina">Hispanic/Latina</option>
      <option value="Asian">Asian</option>
      <option value="Middle Eastern">Middle Eastern</option>
      <option value="Mixed">Mixed</option>
      <option value="Other">Other</option>
    </select>
  </>
)}


{role === 'creator' && (
  <>
    <label className="block font-semibold mt-4">Monthly Goal</label>
    <input
      type="number"
      placeholder="Monthly Goal"
      value={monthlyGoal}
      onChange={(e) => setMonthlyGoal(e.target.value)}
    />
  </>
)}



      <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded">Save Profile</button>
      {message && <p>{message}</p>}

      {role === 'creator' && (
  <>
    <hr className="my-6" />
    <h2 className="text-xl font-semibold">Gift Options</h2>
    {gifts.map(gift => (
      <div key={gift.id} className="border p-2 rounded mb-2 flex justify-between">
        <div>
          <strong>{gift.title}</strong> - ${gift.price}<br />
          <span className="text-sm">{gift.description}</span>
        </div>
        <button onClick={() => handleDeleteGift(gift.id)} className="bg-red-500 text-white px-2 py-1 rounded">
          Delete
        </button>
      </div>
    ))}
    <label className="block font-semibold mt-4">Gift Title</label>
<input
  name="title"
  value={newGift.title}
  onChange={handleGiftChange}
  className="w-full border p-2 rounded"
  placeholder=""
/>

<label className="block font-semibold mt-2">Gift Description</label>
<input
  name="description"
  value={newGift.description}
  onChange={handleGiftChange}
  className="w-full border p-2 rounded"
  placeholder=""
/>

<label className="block font-semibold mt-2">Gift Price</label>
<input
  name="price"
  value={newGift.price}
  onChange={handleGiftChange}
  type="number"
  className="w-full border p-2 rounded"
  placeholder=""
/>

<button
  onClick={handleAddGift}
  className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
>
  Add Gift
</button>

  </>
)}


      {role === 'creator' && (
  <>
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

    <label className="block font-semibold mt-4">Photo Set Title</label>
<input
  name="title"
  value={newPhotoSet.title}
  onChange={handleSetChange}
  className="w-full border p-2 rounded"
  placeholder=""
/>

<label className="block font-semibold mt-2">Price</label>
<input
  name="price"
  value={newPhotoSet.price}
  onChange={handleSetChange}
  type="number"
  className="w-full border p-2 rounded"
  placeholder=""
/>


    {/* Preview Image Upload */}
    <div className="mb-2">
      <input
        type="file"
        id="preview-upload"
        accept="image/*"
        className="hidden"
        onChange={(e) => setPreview(e.target.files[0])}
      />
      {uploadingPreview && <p className="text-sm text-yellow-600 mt-1">Uploading preview image...</p>}
      <label
        htmlFor="preview-upload"
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded cursor-pointer"
      >
        {preview ? 'Change Preview Image' : 'Upload Preview Image'}
      </label>
      {preview && (
        <span className="ml-2 text-sm text-gray-600">{preview.name}</span>
      )}
    </div>

    {/* Unlockable Photos Upload */}
    <div className="mb-4">
      <input
        type="file"
        id="set-upload"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => setPhotos(Array.from(e.target.files))}
      />
      <label
        htmlFor="set-upload"
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded cursor-pointer"
      >
        {photos.length > 0 ? 'Change Unlockable Photos' : 'Upload Unlockable Photos'}
      </label>
      {photos.length > 0 && (
        <span className="ml-2 text-sm text-gray-600">
          {photos.length} file{photos.length > 1 ? 's' : ''} selected
        </span>
      )}
      {uploadingSetPhotos && (
        <p className="text-sm text-yellow-600 mt-1">Uploading photo set content...</p>
      )}

      <button
        onClick={handleAddPhotoSet}
        className="bg-purple-600 text-white px-4 py-2 rounded mt-2"
      >
        Add Photo Set
      </button>
    </div>
  </>
)}
          </div>
  );
} // 👈 this closes the ProfilePage component

// 👇 Add this AFTER the component is fully closed
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}