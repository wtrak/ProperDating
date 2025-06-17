import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../supabaseClient'

export default function CreatorsPage() {
  const router = useRouter()
  const [creators, setCreators] = useState([])
  const [loading, setLoading] = useState(true)

  const [filters, setFilters] = useState({
    ageMin: '',
    ageMax: '',
    hairColor: '',
    eyeColor: '',
    shoeSize: '',
    height: '',
    ethnicity: '',
    location: '',
    braSize: '',
    languages: [],
    inPersonOnly: false,
  })

  const loadCreators = async () => {
    setLoading(true)

    let query = supabase.from('profiles').select('*').eq('role', 'creator')

    if (filters.ageMin) query = query.gte('age', Number(filters.ageMin))
    if (filters.ageMax) query = query.lte('age', Number(filters.ageMax))
    if (filters.hairColor) query = query.eq('hair_color', filters.hairColor)
    if (filters.eyeColor) query = query.eq('eye_color', filters.eyeColor)
    if (filters.shoeSize) query = query.eq('shoe_size', Number(filters.shoeSize))
    if (filters.height) query = query.eq('height_m', Number(filters.height))
    if (filters.ethnicity) query = query.eq('ethnicity', filters.ethnicity)
    if (filters.location) query = query.eq('location', filters.location)
    if (filters.braSize) query = query.eq('bra_size', filters.braSize)
    if (filters.languages.length > 0) query = query.overlaps('languages_spoken', filters.languages)
    if (filters.inPersonOnly) query = query.eq('in_person', true)

    const { data } = await query
    if (data) setCreators(data)
    setLoading(false)
  }

  useEffect(() => {
    loadCreators()
  }, [])

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Creators</h1>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <input
          type="number"
          placeholder="Min Age"
          value={filters.ageMin}
          onChange={e => setFilters({ ...filters, ageMin: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Max Age"
          value={filters.ageMax}
          onChange={e => setFilters({ ...filters, ageMax: e.target.value })}
          className="border p-2 rounded"
        />

        <select
          value={filters.hairColor}
          onChange={e => setFilters({ ...filters, hairColor: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="">Hair Color</option>
          {['Blonde', 'Brown', 'Black', 'Red', 'Auburn', 'Gray', 'Dyed', 'Bald/Shaved'].map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>

        <select
          value={filters.eyeColor}
          onChange={e => setFilters({ ...filters, eyeColor: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="">Eye Color</option>
          {['Blue', 'Brown', 'Green', 'Hazel', 'Gray', 'Other'].map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>

        <select
          value={filters.shoeSize}
          onChange={e => setFilters({ ...filters, shoeSize: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="">Shoe Size</option>
          {Array.from({ length: 33 }, (_, i) => (32 + i * 0.5).toFixed(1)).map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>

        <select
          value={filters.height}
          onChange={e => setFilters({ ...filters, height: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="">Height (m)</option>
          {Array.from({ length: 17 }, (_, i) => (1.30 + i * 0.05).toFixed(2)).map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>

        <select
          value={filters.ethnicity}
          onChange={e => setFilters({ ...filters, ethnicity: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="">Ethnicity</option>
          {['Caucasian', 'Black', 'Hispanic/Latina', 'Asian', 'Middle Eastern', 'Mixed', 'Other'].map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>

        <select
          value={filters.location}
          onChange={e => setFilters({ ...filters, location: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="">City</option>
          {['Warsaw', 'Kraków', 'Łódź', 'Wrocław', 'Poznań', 'Gdańsk', 'Szczecin', 'Lublin', 'Katowice', 'Other'].map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>

        <select
          value={filters.braSize}
          onChange={e => setFilters({ ...filters, braSize: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="">Bra Size</option>
          {['AA', 'A', 'B', 'C', 'D', 'DD', 'E', 'F', 'G', 'Other'].map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>

        <select
          multiple
          value={filters.languages}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, opt => opt.value)
            setFilters({ ...filters, languages: selected })
          }}
          className="border p-2 rounded h-40"
        >
          <option value="English">English</option>
          <option value="Polish">Polish</option>
          <option value="Spanish">Spanish</option>
          <option value="German">German</option>
          <option value="French">French</option>
          <option value="Ukrainian">Ukrainian</option>
          <option value="Russian">Russian</option>
          <option value="Italian">Italian</option>
          <option value="Other">Other</option>
        </select>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={filters.inPersonOnly}
            onChange={e => setFilters({ ...filters, inPersonOnly: e.target.checked })}
          />
          <span>In-Person Only</span>
        </label>

        <button
          onClick={loadCreators}
          className="bg-blue-600 text-white px-4 py-2 rounded col-span-full"
        >
          Apply Filters
        </button>
      </div>

      {/* Creator Cards */}
      {loading ? (
        <p className="p-4">Loading...</p>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((creator) => (
            <div
              key={creator.id}
              className="border rounded-xl p-4 shadow hover:shadow-lg transition cursor-pointer"
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
      )}
    </div>
  )
}
