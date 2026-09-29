import { useMemo, useState, FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import {
  ArrowLeft,
  Copy,
  FileText,
  Filter,
  Loader2,
  Plus,
  Search,
  Trash2,
  NotebookPen,
  ClipboardList,
  ListTodo,
  FilePlus2,
} from 'lucide-react'
import { clsx } from 'clsx'

import { api } from '@/lib/api'
import { apiErrorMessage } from '@/lib/errors'
import type { DocumentListItem } from '@/types'

const TEMPLATES = [
  {
    id: 'blank',
    title: 'Blank document',
    description: 'Start from an empty page.',
    icon: FilePlus2,
    defaultTitle: 'Untitled document',
  },
  {
    id: 'meeting',
    title: 'Meeting notes',
    description: 'Attendees, agenda, action items.',
    icon: NotebookPen,
    defaultTitle: 'Meeting notes',
  },
  {
    id: 'spec',
    title: 'Feature spec',
    description: 'Problem, goals, approach, risks.',
    icon: ClipboardList,
    defaultTitle: 'Feature spec',
  },
  {
    id: 'standup',
    title: 'Daily standup',
    description: 'Yesterday / today / blockers.',
    icon: ListTodo,
    defaultTitle: 'Daily standup',
  },
] as const

type SortKey = 'updated' | 'title' | 'words'

export default function DocsList() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('updated')
  const [error, setError] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const { data: docs = [], isLoading } = useQuery<DocumentListItem[]>({
    queryKey: ['docs', workspaceId],
    queryFn: () =>
      api.get<DocumentListItem[]>(`/workspaces/${workspaceId}/docs`).then((r) => r.data),
    enabled: !!workspaceId,
  })

  // Templates stay open when the workspace has no docs yet — empty list felt barren.
  const templatesOpen = showCreate || (!isLoading && docs.length === 0)

  const createDoc = useMutation({
    mutationFn: (body: { title: string; template?: string }) =>
      api
        .post<{ id: string }>(`/workspaces/${workspaceId}/docs`, body)
        .then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['docs', workspaceId] })
      navigate(`/app/workspace/${workspaceId}/docs/${data.id}`)
    },
    onError: (err) => setError(apiErrorMessage(err, 'Could not create document.')),
  })

  const deleteDoc = useMutation({
    mutationFn: (docId: string) => api.delete(`/docs/${docId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['docs', workspaceId] }),
    onError: (err) => setError(apiErrorMessage(err, 'Could not delete document.')),
  })

  const duplicateDoc = useMutation({
    mutationFn: (docId: string) =>
      api.post<{ id: string }>(`/docs/${docId}/duplicate`).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['docs', workspaceId] })
      navigate(`/app/workspace/${workspaceId}/docs/${data.id}`)
    },
    onError: (err) => setError(apiErrorMessage(err, 'Could not duplicate document.')),
  })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = docs
    if (q) {
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.preview || '').toLowerCase().includes(q)
      )
    }
    const sorted = [...list]
    sorted.sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title)
      if (sort === 'words') return (b.word_count || 0) - (a.word_count || 0)
      return parseISO(b.updated_at).getTime() - parseISO(a.updated_at).getTime()
    })
    return sorted
  }, [docs, query, sort])

  const totalWords = docs.reduce((sum, d) => sum + (d.word_count || 0), 0)

  const handleQuickCreate = (e: FormEvent) => {
    e.preventDefault()
    const title = newTitle.trim() || 'Untitled document'
    createDoc.mutate({ title, template: 'blank' })
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to={`/app/workspace/${workspaceId}`}
            className="mb-2 inline-flex items-center gap-1 text-xs text-white/50 hover:text-white"
          >
            <ArrowLeft size={12} /> Workspace
          </Link>
          <h1 className="font-display text-2xl font-bold text-white">Documents</h1>
          <p className="mt-1 text-sm text-white/60">
            Specs, notes, and standups for this workspace — autosaved TipTap docs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((s) => !s)}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-300"
        >
          <Plus size={15} /> {templatesOpen && docs.length > 0 ? 'Hide templates' : 'New document'}
        </button>
      </div>

      {docs.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[11px] uppercase tracking-wider text-white/40">Documents</p>
            <p className="mt-1 text-xl font-semibold text-white">{docs.length}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[11px] uppercase tracking-wider text-white/40">Total words</p>
            <p className="mt-1 text-xl font-semibold text-white">{totalWords}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[11px] uppercase tracking-wider text-white/40">Updated</p>
            <p className="mt-1 text-sm font-medium text-white/80">
              {formatDistanceToNow(parseISO(docs[0].updated_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {templatesOpen && (
        <div className="rounded-2xl border border-white/10 bg-[#0e1520] p-5">
          <h2 className="mb-1 text-sm font-semibold text-white">
            {docs.length === 0 ? 'Start with a template' : 'Start from a template'}
          </h2>
          <p className="mb-3 text-xs text-white/45">
            Structured starters for meetings, specs, and standups — editable TipTap docs with autosave.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                disabled={createDoc.isPending}
                onClick={() => createDoc.mutate({ title: t.defaultTitle, template: t.id })}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-teal-400/40 hover:bg-teal-400/5 disabled:opacity-50"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-400/15 text-teal-300">
                  <t.icon size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{t.title}</p>
                  <p className="mt-0.5 text-xs text-white/50">{t.description}</p>
                </div>
              </button>
            ))}
          </div>
          <form onSubmit={handleQuickCreate} className="mt-4 flex gap-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Or name a blank doc…"
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:ring-2 focus:ring-teal-500/40"
            />
            <button
              type="submit"
              disabled={createDoc.isPending}
              className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15 disabled:opacity-50"
            >
              Create blank
            </button>
          </form>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title or preview…"
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/35 focus:ring-2 focus:ring-teal-500/40"
          />
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
          <Filter size={13} className="text-white/40" />
          {(['updated', 'title', 'words'] as SortKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSort(key)}
              className={clsx(
                'rounded-md px-2 py-1 text-xs capitalize transition',
                sort === key ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white'
              )}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16 text-white/40">
          <Loader2 className="animate-spin" size={22} />
        </div>
      )}

      {!isLoading && filtered.length === 0 && docs.length > 0 && (
        <div className="rounded-2xl border border-dashed border-white/15 px-6 py-14 text-center">
          <FileText size={28} className="mx-auto mb-3 text-white/30" />
          <p className="text-sm font-medium text-white/80">No matches</p>
          <p className="mt-1 text-xs text-white/45">Try a different search.</p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="group flex items-stretch gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20 hover:bg-white/[0.05]"
            >
              <Link
                to={`/app/workspace/${workspaceId}/docs/${doc.id}`}
                className="min-w-0 flex-1"
              >
                <div className="flex items-center gap-2">
                  <FileText size={14} className="shrink-0 text-teal-300/80" />
                  <h3 className="truncate text-sm font-semibold text-white">{doc.title}</h3>
                </div>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/50">
                  {doc.preview || 'Empty document — open to start writing.'}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/40">
                  <span>{doc.word_count ?? 0} words</span>
                  <span>Updated {format(parseISO(doc.updated_at), 'MMM d, yyyy · HH:mm')}</span>
                  <span>
                    {formatDistanceToNow(parseISO(doc.updated_at), { addSuffix: true })}
                  </span>
                </div>
              </Link>
              <div className="flex flex-col gap-1 opacity-70 transition group-hover:opacity-100">
                <button
                  type="button"
                  title="Duplicate"
                  onClick={() => duplicateDoc.mutate(doc.id)}
                  className="rounded-md p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
                >
                  <Copy size={14} />
                </button>
                <button
                  type="button"
                  title="Delete"
                  onClick={() => {
                    if (confirm(`Delete “${doc.title}”?`)) deleteDoc.mutate(doc.id)
                  }}
                  className="rounded-md p-1.5 text-white/50 hover:bg-rose-500/15 hover:text-rose-300"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
