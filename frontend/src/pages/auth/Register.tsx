import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, Check, X } from 'lucide-react'

import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { User } from '@/types'
import { BlurFade } from '@/components/ui/blur-fade'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Particles } from '@/components/ui/particles'
import { ShineBorder } from '@/components/ui/shine-border'

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
            <Check size={11} className="shrink-0 text-emerald-500" />
          ) : (
            <X size={11} className="shrink-0 text-muted-foreground/50" />
          )}
          <span className={c.ok ? 'text-muted-foreground' : 'text-muted-foreground/50'}>
            {c.label}
          </span>
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
      setAccessToken(tokenRes.data.access_token)
      const userRes = await api.get<User>('/auth/me')
      setUser(userRes.data)
      navigate('/app')
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Registration failed. Please try again.'
      setError(typeof detail === 'string' ? detail : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dark relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <Particles className="absolute inset-0" quantity={50} ease={80} color="#5eead4" refresh />

      <BlurFade className="relative z-10 w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-xl bg-brand-600">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-display text-base font-extrabold tracking-tight">FlowBoard</span>
        </Link>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-card/80 p-7 shadow-xl backdrop-blur">
          <ShineBorder shineColor={['#5eead4', '#0d9488', '#99f6e4']} />
          <h1 className="font-display text-xl font-bold text-foreground">Create account</h1>
          <p className="mb-6 text-sm text-muted-foreground">Start a tenant-safe workspace</p>

          {error && (
            <div className="mb-4 rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder="Ada Lovelace"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            <Button type="submit" disabled={loading || !passwordValid} className="mt-2 w-full">
              {loading ? 'Creating...' : 'Create account'}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/auth/login" className="font-medium text-brand-400 hover:text-brand-300">
            Sign in
          </Link>
        </p>
      </BlurFade>
    </div>
  )
}
