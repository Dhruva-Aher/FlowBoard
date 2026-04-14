import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { Workspace, WorkspaceMember } from '@/types'
import { Loader2, AlertTriangle } from 'lucide-react'

const PLAN_STYLES: Record<string, string> = {
  free: 'bg-neutral-500/20 text-neutral-400 border border-neutral-600/30',
  pro:  'bg-brand-500/20 text-brand-300 border border-brand-500/30',
}

export default function Settings() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const { setCurrentWorkspace } = useWorkspaceStore()
  const qc = useQueryClient()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [confirmDelete, setConfirmDelete] = useState('')
  const [showDanger, setShowDanger] = useState(false)
  const [saved, setSaved] = useState(false)

  const { data: workspace, isLoading } = useQuery<Workspace>({
    queryKey: ['workspace', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}`).then((r) => r.data),
    enabled: !!workspaceId,
  })

  const { data: members = [] } = useQuery<WorkspaceMember[]>({
    queryKey: ['members', workspaceId],
    queryFn: () => api.get(`/workspaces/${workspaceId}/members`).then((r) => r.data),
    enabled: !!workspaceId,
  })

  const currentMember = members.find((m) => m.user_id === currentUser?.id)
  const isOwner = currentMember?.role === 'owner'

  useEffect(() => {
    if (workspace) {
      setName(workspace.name)
      setSlug(workspace.slug)
    }
  }, [workspace])

  const update = useMutation({
    mutationFn: () => api.patch(`/workspaces/${workspaceId}`, { name, slug }).then((r) => r.data),
    onSuccess: (updated: Workspace) => {
      qc.setQueryData(['workspace', workspaceId], updated)
      setCurrentWorkspace(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const deleteWorkspace = useMutation({
    mutationFn: () => api.delete(`/workspaces/${workspaceId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspaces'] })
      navigate('/app')
    },
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-neutral-500" size={24} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold text-neutral-100">Workspace Settings</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Manage your workspace configuration</p>
      </div>

      {/* Plan badge */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-neutral-400">Current plan:</span>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${PLAN_STYLES[workspace?.plan ?? 'free'] ?? PLAN_STYLES.free}`}>
          {workspace?.plan?.toUpperCase()}
        </span>
      </div>

      {/* General settings */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-neutral-200 mb-4">General</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-neutral-500 mb-1.5 block">Workspace name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isOwner && currentMember?.role !== 'admin'}
              className="w-full bg-neutral-800 text-sm rounded-lg px-3 py-2 outline-none ring-1 ring-neutral-700 focus:ring-brand-500 text-neutral-100 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-1.5 block">Slug (URL identifier)</label>
            <div className="flex items-center">
              <span className="text-sm text-neutral-500 bg-neutral-800 px-3 py-2 rounded-l-lg border-r border-neutral-700 ring-1 ring-neutral-700">
                flowboard.dev/
              </span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                disabled={!isOwner}
                className="flex-1 bg-neutral-800 text-sm rounded-r-lg px-3 py-2 outline-none ring-1 ring-neutral-700 focus:ring-brand-500 text-neutral-100 disabled:opacity-50"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={() => update.mutate()}
            disabled={update.isPending || (!name.trim() || !slug.trim())}
            className="px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {update.isPending && <Loader2 size={13} className="animate-spin" />}
            Save changes
          </button>
          {saved && <span className="text-xs text-emerald-400">Saved!</span>}
          {update.isError && (
            <span className="text-xs text-rose-400">
              {(update.error as any)?.response?.data?.detail ?? 'Save failed'}
            </span>
          )}
        </div>
      </section>

      {/* Danger zone */}
      {isOwner && (
        <section className="bg-neutral-900 border border-rose-900/50 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={15} className="text-rose-500" />
            <h2 className="text-sm font-semibold text-rose-400">Danger Zone</h2>
          </div>
          <p className="text-xs text-neutral-500 mb-4">
            Permanently delete this workspace and all its data. This cannot be undone.
          </p>

          {!showDanger ? (
            <button
              onClick={() => setShowDanger(true)}
              className="px-4 py-2 border border-rose-700 text-rose-400 text-sm rounded-lg hover:bg-rose-950/50 transition-colors"
            >
              Delete workspace
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-neutral-400">
                Type <span className="font-mono text-rose-400">{workspace?.name}</span> to confirm deletion:
              </p>
              <input
                value={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.value)}
                placeholder={workspace?.name}
                className="bg-neutral-800 text-sm rounded-lg px-3 py-2 outline-none ring-1 ring-rose-900 focus:ring-rose-600 text-neutral-100 max-w-xs"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => deleteWorkspace.mutate()}
                  disabled={confirmDelete !== workspace?.name || deleteWorkspace.isPending}
                  className="px-4 py-2 bg-rose-700 text-white text-sm rounded-lg hover:bg-rose-600 disabled:opacity-40 transition-colors flex items-center gap-2"
                >
                  {deleteWorkspace.isPending && <Loader2 size={13} className="animate-spin" />}
                  Permanently delete
                </button>
                <button
                  onClick={() => { setShowDanger(false); setConfirmDelete('') }}
                  className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
