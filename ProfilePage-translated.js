import { useTranslation } from 'next-i18next'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../supabaseClient'

export default function ProfilePage() {
  const router = useRouter()
  const { t } = useTranslation('common')

  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState({
    display_name: '',
    bio: '',
    location: '',
    in_person: false,
    photo_url: ''
  })

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">{t('edit_your_profile')}</h1>

      <p className="text-sm text-gray-700 mb-2">
        {t('current_token_balance')}: <span className="font-bold">{profile.tokens}</span>
      </p>

      <div className="flex flex-col items-center space-y-2 mb-4">
        {profile.photo_url ? (
          <>
            <img
              src={profile.photo_url}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover"
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
            <label
              htmlFor="profile-photo"
              className="bg-blue-600 text-white text-sm px-4 py-1 rounded cursor-pointer"
            >
              {t('add_photo')}
            </label>
          </>
        )}
      </div>

      <label className="block font-semibold mt-4">{t('city')}</label>
      <select
        name="location"
        value={profile.location}
        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
        className="w-full border p-2 rounded"
      >
        <option value="">{t('select_city')}</option>
        <option value="Warsaw">Warsaw</option>
        <option value="Kraków">Kraków</option>
        {/* ...other cities */}
      </select>

      <button onClick={() => {}} className="bg-green-600 text-white px-4 py-2 rounded">
        {t('save_profile')}
      </button>
    </div>
  )
}