import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useRouter } from 'next/router'

export default function AuthPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState('supporter')  // default to supporter


  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    let authResult

    if (isLogin) {
      authResult = await supabase.auth.signInWithPassword({ email, password })
    } else {
      authResult = await supabase.auth.signUp({ email, password })
      console.log('Signup result:', authResult)

      let user = null
      for (let i = 0; i < 10; i++) {
        const { data: sessionData } = await supabase.auth.getSession()
        user = sessionData?.session?.user
        if (user) break
        console.log(`Waiting for session... (${i})`)
        await new Promise((res) => setTimeout(res, 300))
      }

      if (user) {
        console.log('Creating default profile for user ID:', user.id)
        const { error: profileError } = await supabase.from('profiles').insert([
  {
    id: user.id,
    role: role,
    display_name: 'New User',
    bio: '',
    location: '',
    in_person: false,
    monthly_goal: 0,
    photo_url: '',
    created_at: new Date().toISOString()
  }
])

        if (profileError) console.error('PROFILE INSERT ERROR:', profileError.message)
      } else {
        console.warn('Session never became available — skipping profile creation.')
      }
    }

    if (authResult.error) {
      setError(authResult.error.message)
    } else {
      router.push('/home-dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="space-y-4 p-8 bg-white shadow rounded">
        <h2 className="text-xl font-bold">{isLogin ? 'Login' : 'Sign Up'}</h2>

        <input
          className="border p-2 w-full"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="relative">
          <input
            className="border p-2 w-full pr-16"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-blue-600"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        {error && <p className="text-red-500">{error}</p>}
{!isLogin && (
  <div className="space-y-2">
    <p className="font-medium">I am signing up as a:</p>
    <label className="block">
      <input
        type="radio"
        name="role"
        value="creator"
        checked={role === 'creator'}
        onChange={() => setRole('creator')}
        className="mr-2"
      />
      Creator
    </label>
    <label className="block">
      <input
        type="radio"
        name="role"
        value="supporter"
        checked={role === 'supporter'}
        onChange={() => setRole('supporter')}
        className="mr-2"
      />
      Supporter
    </label>
  </div>
)}


        <button className="bg-blue-500 text-white p-2 w-full rounded" type="submit">
          {isLogin ? 'Login' : 'Sign Up'}
        </button>

        <p className="text-sm">
          {isLogin ? 'Need an account?' : 'Already have one?'}{' '}
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="underline text-blue-600">
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </form>
    </div>
  )
}
