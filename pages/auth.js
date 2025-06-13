import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useRouter } from 'next/router'

export default function AuthPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    let authResult

    if (isLogin) {
      authResult = await supabase.auth.signInWithPassword({ email, password })
    } else {
      authResult = await supabase.auth.signUp({ email, password })
      console.log('Signup result:', authResult)

      // Try to retrieve the session after sign-up
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
            role: 'supporter',
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
      router.push('/dashboard')
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
        <input
          className="border p-2 w-full"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-500">{error}</p>}
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
