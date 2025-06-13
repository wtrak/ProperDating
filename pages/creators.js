import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../supabaseClient'

export default function CreatorsPage() {
  const router = useRouter()
  const [creators, setCreators] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCreators = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'creator')

      if (data) {
        setCreators(data)
      }

      setLoading(false)
    }

    loadCreators()
  }, [])

  if (loading) return <p className="p-4">Loading...</p>

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Creators</h1>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {creators.map((creator) => (
          <div
            key={creator.id}
            className="border rounded-xl p-4 shadow hover:shadow-lg transition"
            onClick={() => router.push(`/creator/${creator.id}`)}
          >
            <img
              src={creator.photo_url || '/default-profile.png'}
              alt="Profile"
              className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
            />
            <h2 className="text-xl font-semibold text-center">{creator.display_name}</h2>
            <p className="text-center text-gray-600 mt-1">Monthly Goal: ${creator.monthly_goal}</p>
            {creator.location && (
              <p className="text-center text-sm text-gray-500 mt-1">Location: {creator.location}</p>
            )}
            <p className="text-center text-sm mt-2">
              {creator.in_person
                ? '✅ Open to In-Person Support'
                : '❌ Online Support Only'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
