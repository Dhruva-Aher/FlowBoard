import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Zap, Eye, EyeOff, Check, X } from 'lucide-react'
import { clsx } from 'clsx'
import type { User } from '@/types'

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'Contains a number', ok: /\d/.test(password) },
    { label: 'Contains a letter', ok: /[a-zA-Z]/.test(password) },
  ]

  if (!password) return null

  return (
    <div className="mt-2 space-y-1">
      {checks.map((c) => (
        <div key={c.label} className="flex items-center gap-1.5 text-xs">
          {c.ok ? (
            <Check size={11} className="text-emerald-500 shrink-0" />
          ) : (
            <X size={11} className="text-neutral-600 shrink-0" />
          )}
          <span className={c.ok ? 'text-neutral-400' : 'text-neutral-600'}>{c.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function Register() {
  const navigate = useNavigate()
  const { setUser, setAccessToken } = useAuthStore()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const passwordValid = password.length >= 8

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!passwordValid) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    try {
      const tokenRes = await api.post<{ access_token: string }>('/auth/register', {
        name,
        email,
        password,
      })

      // Store token first so the subsequent /auth/me call is authenticated.
      setAccessToken(tokenRes.data.access_token)

      // Fetch user profile with the fresh token.
      const userRes = await api.get<User>('/auth/me')
      setUser(userRes.data)

      navigate('/app')
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Registration failed. Please try again.'
      setError(detail)
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
          <h1 className="text-xl font-semibold text-white mb-1">Create your account</h1>
          <p className="text-sm text-neutral-500 mb-6">Start shipping faster today</p>

          {error && (
            <div className="mb-4 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-sm text-rose-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder="Alex Johnson"
                className="w-full bg-neutral-800 border border-neutral-700 text-neutral-100 text-sm rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-neutral-600 transition-all"
              />
            </div>

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
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
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
              <PasswordStrength password={password} />
            </div>

            <button
              type="submit"
              disabled={loading || !passwordValid}
              className={clsx(
                'w-full py-2.5 text-sm font-medium rounded-lg transition-all mt-2',
                'bg-brand-600 hover:bg-brand-700 text-white',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                'hover:shadow-lg hover:shadow-brand-600/20'
              )}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-xs text-neutral-600 mt-4 text-center leading-relaxed">
            By creating an account you agree to our{' '}
            <span className="text-neutral-500 hover:text-neutral-300 cursor-pointer transition-colors">
              Terms of Service
            </span>
            .
          </p>
        </div>

        <p className="text-center text-sm text-neutral-500 mt-5">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-brand-400 hover:text-brand-300 transition-colors font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
