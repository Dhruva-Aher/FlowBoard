import { useState, useEffect, FormEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { Workspace } from '@/types'
import {
  Plus,
  ArrowRight,
  Layers,
  X,
  LayoutGrid,
  ChevronRight,
  Sparkles,
  Users,
  Calendar,
} from 'lucide-react'
import { clsx } from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function greeting(name: string) {
  const hour = new Date().getHours()
  const part = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const first = name.split(' ')[0]
  return `Good ${part}, ${first}`
}

/** Deterministic gradient slot from a workspace id. */
const GRADIENTS = [
  'from-violet-600/30 to-indigo-600/30',
  'from-indigo-600/30 to-sky-600/30',
  'from-sky-600/30 to-cyan-600/30',
  'from-emerald-600/30 to-teal-600/30',
  'from-amber-600/30 to-orange-600/30',
  'from-rose-600/30 to-pink-600/30',
  'from-fuchsia-600/30 to-violet-600/30',
]
const BORDER_COLORS = [
  'border-violet-500/20',
  'border-indigo-500/20',
  'border-sky-500/20',
  'border-emerald-500/20',
  'border-amber-500/20',
  'border-rose-500/20',
  'border-fuchsia-500/20',
]
const ICON_COLORS = [
  'text-violet-400',
  'text-indigo-400',
  'text-sky-400',
  'text-emerald-400',
  'text-amber-400',
  'text-rose-400',
  'text-fuchsia-400',
]

function hashIndex(str: string, len: number) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h) % len
}

// ─── Create Workspace Modal ───────────────────────────────────────────────────

function CreateWorkspaceModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const { setWorkspaces } = useWorkspaceStore()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [error, setError] = useState<string | null>(null)

  const slugify = (s: string) =>
    s
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 50)

  const handleNameChange = (v: string) => {
    setName(v)
    setSlug(slugify(v))
  }

  const create = useMutation({
    mutationFn: (body: { name: string; slug: string }) =>
      api.post<Workspace>('/workspaces', body).then((r) => r.data),
    onSuccess: async () => {
      const updated = await api.get<Workspace[]>('/workspaces').then((r) => r.data)
      setWorkspaces(updated)
      qc.setQueryData(['workspaces'], updated)
      onClose()
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Failed to create workspace.'
      setError(msg)
    },
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim() || !slug.trim()) return
    create.mutate({ name: name.trim(), slug: slug.trim() })
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="bg-neutral-900 border border-neutral-700/80 rounded-2xl w-full max-w-md shadow-2xl shadow-black/50 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-brand-600/20 flex items-center justify-center">
                <Layers size={13} className="text-brand-400" />
              </div>
              <h2 className="font-semibold text-white text-sm">New workspace</h2>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-500 hover:text-neutral-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {error && (
              <div className="px-3.5 py-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Workspace name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                autoFocus
                placeholder="Acme Corp"
                className="w-full bg-neutral-800 border border-neutral-700 text-sm text-neutral-100 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-neutral-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                URL slug
              </label>
              <div className="flex items-center">
                <span className="text-xs text-neutral-600 bg-neutral-800/80 border border-r-0 border-neutral-700 px-3 py-2.5 rounded-l-lg select-none">
                  app/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  required
                  placeholder="acme-corp"
                  className="flex-1 bg-neutral-800 border border-neutral-700 text-sm text-neutral-100 rounded-r-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-neutral-600 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200 rounded-lg hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || !slug.trim() || create.isPending}
                className="px-4 py-2 text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {create.isPending ? 'Creating…' : 'Create workspace'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  )
}

// ─── Workspace Card ───────────────────────────────────────────────────────────

function WorkspaceCard({ ws, index }: { ws: Workspace; index: number }) {
  const gi = hashIndex(ws.id, GRADIENTS.length)
  const initials = ws.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      className="group relative bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-black/30 flex flex-col overflow-hidden"
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-600/0 to-violet-600/0 group-hover:from-brand-600/[0.025] group-hover:to-violet-600/[0.04] transition-all duration-300 pointer-events-none" />

      {/* Top: avatar + plan badge */}
      <div className="flex items-start justify-between mb-4">
        <div
          className={clsx(
            'w-11 h-11 rounded-xl bg-gradient-to-br border flex items-center justify-center font-bold text-sm shrink-0',
            GRADIENTS[gi],
            BORDER_COLORS[gi],
            ICON_COLORS[gi]
          )}
        >
          {initials}
        </div>
        <span
          className={clsx(
            'text-[10px] font-semibold px-2 py-0.5 rounded-full border tracking-wide uppercase',
            ws.plan === 'pro' || ws.plan === 'business'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-neutral-800 text-neutral-500 border-neutral-700/80'
          )}
        >
          {ws.plan}
        </span>
      </div>

      {/* Name + slug */}
      <h3 className="font-semibold text-white text-sm mb-0.5 truncate">{ws.name}</h3>
      <p className="text-xs text-neutral-500 mb-4 truncate">/{ws.slug}</p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-neutral-800/80">
        <div className="flex items-center gap-1 text-[11px] text-neutral-600">
          <Calendar size={10} />
          <span>{format(parseISO(ws.created_at), 'MMM d, yyyy')}</span>
        </div>
        <Link
          to={`/app/workspace/${ws.id}`}
          className="flex items-center gap-1 text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors"
        >
          Open
          <ArrowRight
            size={12}
            className="group-hover:translate-x-0.5 transition-transform duration-150"
          />
        </Link>
      </div>
    </motion.div>
  )
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="w-11 h-11 rounded-xl bg-neutral-800" />
        <div className="w-10 h-4 rounded-full bg-neutral-800" />
      </div>
      <div className="space-y-1.5 pt-1">
        <div className="h-3.5 w-28 bg-neutral-800 rounded" />
        <div className="h-3 w-20 bg-neutral-800/60 rounded" />
      </div>
      <div className="h-px bg-neutral-800 my-2" />
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 bg-neutral-800/60 rounded" />
        <div className="h-3 w-10 bg-neutral-800 rounded" />
      </div>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="col-span-full text-center py-20 border-2 border-dashed border-neutral-800 rounded-2xl"
    >
      <div className="w-16 h-16 rounded-2xl bg-brand-600/10 border border-brand-500/10 flex items-center justify-center mx-auto mb-4">
        <Layers size={28} className="text-brand-500/60" />
      </div>
      <h3 className="font-semibold text-neutral-200 mb-1.5">No workspaces yet</h3>
      <p className="text-sm text-neutral-500 max-w-xs mx-auto mb-6 leading-relaxed">
        Create your first workspace to start organising projects, collaborating, and shipping faster.
      </p>
      <button
        onClick={onNew}
        className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-brand-600/20"
      >
        <Plus size={15} />
        Create your first workspace
      </button>
    </motion.div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [modalOpen, setModalOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const { setWorkspaces } = useWorkspaceStore()
  const qc = useQueryClient()

  const { data: workspaces = [], isLoading } = useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: () => api.get<Workspace[]>('/workspaces').then((r) => r.data),
  })

  // onSuccess was removed in TanStack Query v5 — sync via useEffect instead.
  useEffect(() => {
    if (workspaces.length > 0) setWorkspaces(workspaces)
  }, [workspaces, setWorkspaces])

  const today = new Date()
  const dateLabel = format(today, 'EEEE, MMMM d')

  return (
    <div className="max-w-5xl mx-auto px-1">

      {/* ── Greeting banner ─────────────────────────────────────── */}
      <div className="relative mb-8 rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-brand-600/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-violet-600/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex items-center justify-between px-7 py-6">
          <div>
            <p className="text-xs font-medium text-neutral-500 mb-1 tracking-wide">{dateLabel}</p>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {user ? greeting(user.name) : 'Welcome back'} 👋
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              {isLoading
                ? 'Loading your workspaces…'
                : workspaces.length === 0
                  ? "Let's get you set up — create your first workspace."
                  : workspaces.length === 1
                    ? 'You have 1 workspace.'
                    : `You have ${workspaces.length} workspaces.`}
            </p>
          </div>

          {user && (
            <div className="hidden sm:flex items-center gap-3 bg-neutral-800/60 border border-neutral-700/60 rounded-xl px-4 py-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-600/30 border border-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-xs">
                {user.name
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="text-left">
                <p className="text-xs font-medium text-neutral-200 leading-none mb-0.5">
                  {user.name}
                </p>
                <p className="text-[11px] text-neutral-500 leading-none">{user.email}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick action bar ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-8 flex-wrap">
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shadow-lg shadow-brand-600/15"
        >
          <Plus size={15} />
          New workspace
        </button>

        <div className="flex items-center gap-1.5 text-xs text-neutral-500 bg-neutral-900 border border-neutral-800 px-3.5 py-2 rounded-xl">
          <LayoutGrid size={13} className="text-neutral-600" />
          <span>
            {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-neutral-500 bg-neutral-900 border border-neutral-800 px-3.5 py-2 rounded-xl">
          <Users size={13} className="text-neutral-600" />
          <span>My workspaces</span>
        </div>
      </div>

      {/* ── Section header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">
          Workspaces
        </h2>
        {!isLoading && workspaces.length > 0 && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            <Plus size={11} />
            New
          </button>
        )}
      </div>

      {/* ── Grid ─────────────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}

        {!isLoading && workspaces.length === 0 && (
          <EmptyState onNew={() => setModalOpen(true)} />
        )}

        {!isLoading &&
          workspaces.map((ws, i) => <WorkspaceCard key={ws.id} ws={ws} index={i} />)}
      </div>

      {/* ── Getting-started nudge ─────────────────────────────────── */}
      {!isLoading && workspaces.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-10 rounded-2xl bg-gradient-to-br from-brand-600/5 to-violet-600/5 border border-brand-500/10 p-5 flex items-center gap-4"
        >
          <div className="w-9 h-9 rounded-xl bg-brand-600/15 border border-brand-500/15 flex items-center justify-center shrink-0">
            <Sparkles size={16} className="text-brand-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-200 mb-0.5">
              Open a workspace to get started
            </p>
            <p className="text-xs text-neutral-500">
              Create projects, manage tasks on Kanban boards, and collaborate in real time.
            </p>
          </div>
          <Link
            to={`/app/workspace/${workspaces[0].id}`}
            className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors"
          >
            Open workspace
            <ChevronRight size={13} />
          </Link>
        </motion.div>
      )}

      <AnimatePresence>
        {modalOpen && <CreateWorkspaceModal onClose={() => setModalOpen(false)} />}
      </AnimatePresence>
    </div>
  )
}
