import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, Check, X } from 'lucide-react'

import { api } from '@/lib/api'
import { apiErrorMessage } from '@/lib/errors'
import { useAuthStore } from '@/store/authStore'
import type { User, Workspace } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShineBorder } from '@/components/ui/shine-border'

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 40)
}

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
            <Check size={11} className="shrink-0 text-emerald-400" />
          ) : (
            <X size={11} className="shrink-0 text-white/35" />
          )}
          <span className={c.ok ? 'text-white/70' : 'text-white/40'}>{c.label}</span>
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
  const formReady = name.trim().length > 0 && email.includes('@') && passwordValid

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!passwordValid) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (!name.trim()) {
      setError('Please enter your name.')
      return
    }

    setLoading(true)

    try {
      const tokenRes = await api.post<{ access_token: string }>('/auth/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      })
      setAccessToken(tokenRes.data.access_token)

      const userRes = await api.get<User>('/auth/me')
      setUser(userRes.data)

      // Bootstrap a starter workspace so signup doesn't dump into an empty shell.
      const baseSlug = slugify(name) || 'workspace'
      const stamp = Date.now().toString(36).slice(-4)
      try {
        await api.post<Workspace>('/workspaces', {
          name: `${name.trim().split(' ')[0]}'s workspace`,
          slug: `${baseSlug}-${stamp}`,
        })
      } catch {
        // Non-fatal: dashboard still lets them create manually.
      }

      navigate('/app')
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Registration failed. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dark relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070b12] px-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
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
          <h1 className="font-display text-xl font-bold text-white">Create account</h1>
          <p className="mb-6 text-sm text-white/65">
            Password needs 8+ characters. We&apos;ll open a starter workspace for you.
          </p>

          {error && (
            <div className="mb-4 rounded-lg border border-rose-400/30 bg-rose-500/15 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-white/80">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder="Ada Lovelace"
                className="border-white/15 bg-white/5 text-white placeholder:text-white/35"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-white/80">
                Email
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
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
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
              <PasswordStrength password={password} />
            </div>

            <Button
              type="submit"
              disabled={loading || !formReady}
              className="mt-2 w-full bg-teal-400 text-slate-950 hover:bg-teal-300 disabled:opacity-40"
            >
              {loading ? 'Creating your workspace...' : 'Create account'}
            </Button>
            {!formReady && (
              <p className="text-center text-[11px] text-white/45">
                Fill name, email, and an 8+ character password to continue.
              </p>
            )}
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-white/55">
          Already have an account?{' '}
          <Link to="/auth/login" className="font-medium text-teal-300 hover:text-teal-200">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
