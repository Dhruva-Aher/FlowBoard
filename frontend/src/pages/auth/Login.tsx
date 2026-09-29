import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff } from 'lucide-react'

import { api } from '@/lib/api'
import { apiErrorMessage } from '@/lib/errors'
import { useAuthStore } from '@/store/authStore'
import type { User } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShineBorder } from '@/components/ui/shine-border'

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
      const body = new URLSearchParams()
      body.append('username', email.trim().toLowerCase())
      body.append('password', password)

      const tokenRes = await api.post<{ access_token: string }>('/auth/login', body)
      setAccessToken(tokenRes.data.access_token)
      const userRes = await api.get<User>('/auth/me')
      setUser(userRes.data)
      navigate('/app')
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      setError(
        status === 401
          ? 'Invalid email or password.'
          : apiErrorMessage(err, 'Something went wrong. Please try again.')
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dark relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070b12] px-4">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, oklch(0.45 0.1 175 / 0.35), transparent 60%)',
        }}
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-xl bg-brand-600">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-display text-base font-extrabold tracking-tight text-white">
            FlowBoard
          </span>
        </Link>

        <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#0e1520]/95 p-7 shadow-2xl backdrop-blur-xl">
          <ShineBorder shineColor={['#5eead4', '#0d9488', '#99f6e4']} />
          <h1 className="font-display text-xl font-bold text-white">Welcome back</h1>
          <p className="mb-6 text-sm text-white/65">Sign in to your workspace</p>

          {error && (
            <div className="mb-4 rounded-lg border border-rose-400/30 bg-rose-500/15 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-white/80">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="border-white/15 bg-white/5 text-white placeholder:text-white/35"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-white/80">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="border-white/15 bg-white/5 pr-10 text-white placeholder:text-white/35"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 hover:text-white"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-teal-400 text-slate-950 hover:bg-teal-300"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-white/55">
          Don&apos;t have an account?{' '}
          <Link to="/auth/register" className="font-medium text-teal-300 hover:text-teal-200">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  )
}
