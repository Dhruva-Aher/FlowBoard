import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Zap, Eye, EyeOff } from 'lucide-react'
import { clsx } from 'clsx'
import type { User } from '@/types'

export default function Login() {
  const navigate = useNavigate()
  const { setUser, setAccessToken } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Backend uses OAuth2PasswordRequestForm: must be form-encoded with
      // field name `username` (not `email`).
      const body = new URLSearchParams()
      body.append('username', email)
      body.append('password', password)

      const tokenRes = await api.post<{ access_token: string }>('/auth/login', body)

      // Store token first — the interceptor reads it synchronously, so the
      // next call to /auth/me will already carry the Bearer header.
      setAccessToken(tokenRes.data.access_token)

      // Fetch user profile with the fresh token.
      const userRes = await api.get<User>('/auth/me')
      setUser(userRes.data)

      navigate('/app')
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(
        status === 401
          ? 'Invalid email or password.'
          : (detail ?? 'Something went wrong. Please try again.')
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-600/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold text-white text-base tracking-wide">FlowBoard</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-7 shadow-xl">
          <h1 className="text-xl font-semibold text-white mb-1">Welcome back</h1>
          <p className="text-sm text-neutral-500 mb-6">Sign in to your account</p>

          {error && (
            <div className="mb-4 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-sm text-rose-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full bg-neutral-800 border border-neutral-700 text-neutral-100 text-sm rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-neutral-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full bg-neutral-800 border border-neutral-700 text-neutral-100 text-sm rounded-lg px-3 py-2.5 pr-10 outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-neutral-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={clsx(
                'w-full py-2.5 text-sm font-medium rounded-lg transition-all mt-2',
                'bg-brand-600 hover:bg-brand-700 text-white',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                'hover:shadow-lg hover:shadow-brand-600/20'
              )}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-neutral-500 mt-5">
          Don&apos;t have an account?{' '}
          <Link to="/auth/register" className="text-brand-400 hover:text-brand-300 transition-colors font-medium">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  )
}
