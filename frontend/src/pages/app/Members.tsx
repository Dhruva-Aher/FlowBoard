import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { WorkspaceMember } from '@/types'
import { UserPlus, Trash2, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const ROLE_STYLES: Record<string, string> = {
  owner:  'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  admin:  'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  member: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  viewer: 'bg-neutral-500/20 text-neutral-400 border border-neutral-500/30',
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-emerald-500', 'bg-rose-500',
  'bg-amber-500', 'bg-sky-500', 'bg-violet-500',
]

function InviteModal({ workspaceId, onClose }: { workspaceId: string; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [error, setError] = useState('')
  const qc = useQueryClient()

  const invite = useMutation({
    mutationFn: () =>
      api.post(`/workspaces/${workspaceId}/invitations`, { email, role }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members', workspaceId] })
      onClose()
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail ?? 'Failed to send invitation')
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Invite member</h2>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">Email address</label>
            <input
              autoFocus
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="w-full bg-neutral-800 text-sm rounded-lg px-3 py-2 outline-none ring-1 ring-neutral-700 focus:ring-brand-500 text-neutral-100"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1 block">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-neutral-800 text-sm rounded-lg px-3 py-2 outline-none ring-1 ring-neutral-700 focus:ring-brand-500 text-neutral-100"
            >
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          {error && <p className="text-xs text-rose-400">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => email.trim() && invite.mutate()}
            disabled={!email.trim() || invite.isPending}
            className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {invite.isPending && <Loader2 size={13} className="animate-spin" />}
            Send invite
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Members() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const currentUser = useAuthStore((s) => s.user)
  const [showInvite, setShowInvite] = useState(false)
  const qc = useQueryClient()

  const { data: members = [], isLoading } = useQuery<WorkspaceMember[]>({
    queryKey: ['members', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/members`).then((r) => r.data),
    enabled: !!workspaceId,
  })

  const currentMember = members.find((m) => m.user_id === currentUser?.id)
  const canManage = currentMember && ['owner', 'admin'].includes(currentMember.role)

  const removeMember = useMutation({
    mutationFn: (userId: string) =>
      api.delete(`/workspaces/${workspaceId}/members/${userId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', workspaceId] }),
  })

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-neutral-100">Members</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 transition-colors"
          >
            <UserPlus size={15} />
            Invite
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-neutral-500" size={24} />
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
          {members.map((member, i) => (
            <div
              key={member.id}
              className={`flex items-center gap-4 px-5 py-4 ${
                i < members.length - 1 ? 'border-b border-neutral-800' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-xs font-semibold text-white flex-shrink-0`}
              >
                {getInitials(member.user.name)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-neutral-100 truncate">
                    {member.user.name}
                  </span>
                  {member.user_id === currentUser?.id && (
                    <span className="text-xs text-neutral-500">(you)</span>
                  )}
                </div>
                <span className="text-xs text-neutral-500 truncate">{member.user.email}</span>
              </div>

              {/* Role badge */}
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_STYLES[member.role] ?? ROLE_STYLES.viewer}`}>
                {member.role}
              </span>

              {/* Joined */}
              <span className="text-xs text-neutral-600 hidden sm:block w-28 text-right flex-shrink-0">
                {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
              </span>

              {/* Remove */}
              {canManage && member.role !== 'owner' && member.user_id !== currentUser?.id && (
                <button
                  onClick={() => removeMember.mutate(member.user_id)}
                  disabled={removeMember.isPending}
                  className="text-neutral-600 hover:text-rose-400 transition-colors disabled:opacity-50 flex-shrink-0"
                  title="Remove member"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showInvite && workspaceId && (
        <InviteModal workspaceId={workspaceId} onClose={() => setShowInvite(false)} />
      )}
    </div>
  )
}
