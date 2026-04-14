import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { WorkspaceMember } from '@/types'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

type State = 'idle' | 'accepting' | 'success' | 'error'

export default function InviteAccept() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [state, setState] = useState<State>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const accept = useMutation({
    mutationFn: () =>
      api.post<WorkspaceMember>(`/invitations/${token}/accept`).then((r) => r.data),
    onMutate: () => setState('accepting'),
    onSuccess: (member) => {
      setState('success')
      setTimeout(() => {
        navigate(`/app/workspace/${member.workspace_id}`)
      }, 1500)
    },
    onError: (err: any) => {
      setState('error')
      setErrorMessage(
        err.response?.data?.detail ?? 'This invitation is invalid or has expired.',
      )
    },
  })

  // Auto-accept once logged in
  useEffect(() => {
    if (user && token && state === 'idle') {
      accept.mutate()
    }
  }, [user, token]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center">
        {/* Logo */}
        <div className="w-10 h-10 bg-brand-600 rounded-xl mx-auto mb-6 flex items-center justify-center">
          <span className="text-white font-bold text-lg">F</span>
        </div>

        {!user ? (
          <>
            <h1 className="text-xl font-bold text-neutral-100 mb-2">You've been invited</h1>
            <p className="text-sm text-neutral-400 mb-6">
              Sign in or create an account to accept this workspace invitation.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                to={`/auth/login?redirect=/invite/${token}`}
                className="w-full py-2.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors block"
              >
                Sign in
              </Link>
              <Link
                to={`/auth/register?redirect=/invite/${token}`}
                className="w-full py-2.5 bg-neutral-800 text-neutral-200 text-sm font-medium rounded-lg hover:bg-neutral-700 transition-colors block"
              >
                Create account
              </Link>
            </div>
          </>
        ) : state === 'accepting' ? (
          <>
            <Loader2 className="animate-spin text-brand-500 mx-auto mb-4" size={32} />
            <h1 className="text-lg font-semibold text-neutral-100">Accepting invitation…</h1>
          </>
        ) : state === 'success' ? (
          <>
            <CheckCircle className="text-emerald-500 mx-auto mb-4" size={32} />
            <h1 className="text-lg font-semibold text-neutral-100">You're in!</h1>
            <p className="text-sm text-neutral-400 mt-1">Redirecting to workspace…</p>
          </>
        ) : state === 'error' ? (
          <>
            <XCircle className="text-rose-500 mx-auto mb-4" size={32} />
            <h1 className="text-lg font-semibold text-neutral-100">Invitation failed</h1>
            <p className="text-sm text-neutral-400 mt-1 mb-5">{errorMessage}</p>
            <Link
              to="/app"
              className="inline-block px-5 py-2 bg-neutral-800 text-neutral-200 text-sm rounded-lg hover:bg-neutral-700 transition-colors"
            >
              Go to dashboard
            </Link>
          </>
        ) : null}
      </div>
    </div>
  )
}
