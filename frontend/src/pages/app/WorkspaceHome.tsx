import { useEffect, useState, FormEvent } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { useWorkspaceSocket } from '@/hooks/useWebSocket'
import type { Workspace, Project, DocumentListItem } from '@/types'
import { Plus, Kanban, FileText, ArrowRight, X, FolderOpen } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import ActivityFeed from '@/components/activity/ActivityFeed'

function NewProjectModal({ workspaceId, onClose }: { workspaceId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const create = useMutation({
    mutationFn: () =>
      api.post<Project>(`/workspaces/${workspaceId}/projects`, { name, description }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', workspaceId] })
      onClose()
    },
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (name.trim()) create.mutate()
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
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-md shadow-2xl pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-5 border-b border-neutral-800">
            <h2 className="font-semibold text-white">New project</h2>
            <button onClick={onClose} className="text-neutral-500 hover:text-neutral-200 transition-colors">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Project name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Website redesign"
                className="w-full bg-neutral-800 border border-neutral-700 text-sm text-neutral-100 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-neutral-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="What is this project about?"
                className="w-full bg-neutral-800 border border-neutral-700 text-sm text-neutral-100 rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-neutral-600 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200 rounded-lg hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || create.isPending}
                className="px-4 py-2 text-sm font-medium bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {create.isPending ? 'Creating...' : 'Create project'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  )
}

export default function WorkspaceHome() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [newProjectOpen, setNewProjectOpen] = useState(false)

  // Connect WebSocket for this workspace
  useWorkspaceSocket(workspaceId)

  // Fetch workspace info
  const { data: workspace } = useQuery<Workspace>({
    queryKey: ['workspace', workspaceId],
    queryFn: () => api.get<Workspace>(`/workspaces/${workspaceId}`).then((r) => r.data),
    enabled: !!workspaceId,
  })

  useEffect(() => {
    if (workspace) setCurrentWorkspace(workspace)
    return () => setCurrentWorkspace(null)
  }, [workspace, setCurrentWorkspace])

  // Fetch projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['projects', workspaceId],
    queryFn: () => api.get<Project[]>(`/workspaces/${workspaceId}/projects`).then((r) => r.data),
    enabled: !!workspaceId,
  })

  // Fetch docs
  const { data: docs = [], isLoading: docsLoading } = useQuery<DocumentListItem[]>({
    queryKey: ['docs', workspaceId],
    queryFn: () => api.get<DocumentListItem[]>(`/workspaces/${workspaceId}/docs`).then((r) => r.data),
    enabled: !!workspaceId,
  })

  const createDoc = useMutation({
    mutationFn: (body: { title: string; template?: string }) =>
      api
        .post<{ id: string }>(`/workspaces/${workspaceId}/docs`, body)
        .then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['docs', workspaceId] })
      navigate(`/app/workspace/${workspaceId}/docs/${data.id}`)
    },
  })

  const ws = workspace ?? currentWorkspace

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Workspace header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/20 flex items-center justify-center text-brand-400 font-bold">
            {ws?.name.slice(0, 2).toUpperCase() ?? '..'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{ws?.name ?? 'Loading...'}</h1>
            <p className="text-xs text-neutral-500">{ws?.slug}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-8">
          {/* Projects section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-neutral-200 flex items-center gap-2">
                <Kanban size={16} className="text-neutral-500" />
                Projects
              </h2>
              <button
                onClick={() => setNewProjectOpen(true)}
                className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus size={13} /> New project
              </button>
            </div>

            {projectsLoading && (
              <div className="grid sm:grid-cols-2 gap-3">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-neutral-900 rounded-xl h-28 animate-pulse" />
                ))}
              </div>
            )}

            {!projectsLoading && projects.length === 0 && (
              <div className="text-center py-10 border-2 border-dashed border-neutral-800 rounded-xl">
                <FolderOpen size={28} className="mx-auto text-neutral-700 mb-2" />
                <p className="text-sm text-neutral-500">No projects yet</p>
                <button
                  onClick={() => setNewProjectOpen(true)}
                  className="mt-3 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                >
                  Create your first project
                </button>
              </div>
            )}

            {!projectsLoading && projects.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-3">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="group bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl p-4 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <Kanban size={13} className="text-indigo-400" />
                      </div>
                    </div>
                    <h3 className="font-medium text-sm text-white mb-1">{project.name}</h3>
                    {project.description && (
                      <p className="text-xs text-neutral-500 mb-3 line-clamp-2">{project.description}</p>
                    )}
                    <Link
                      to={`/app/workspace/${workspaceId}/board/${project.id}`}
                      className="flex items-center gap-1 text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors"
                    >
                      Open board <ArrowRight size={11} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Documents section */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold text-neutral-200">
                <FileText size={16} className="text-neutral-500" />
                Documents
                {!docsLoading && (
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/45">
                    {docs.length}
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2">
                <Link
                  to={`/app/workspace/${workspaceId}/docs`}
                  className="text-xs text-white/45 transition hover:text-white"
                >
                  View all
                </Link>
                <button
                  onClick={() => createDoc.mutate({ title: 'Untitled document', template: 'blank' })}
                  disabled={createDoc.isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-neutral-800 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white disabled:opacity-50"
                >
                  <Plus size={13} /> New doc
                </button>
              </div>
            </div>

            {docsLoading && (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-neutral-900" />
                ))}
              </div>
            )}

            {!docsLoading && docs.length === 0 && (
              <div className="rounded-xl border-2 border-dashed border-neutral-800 px-4 py-10 text-center">
                <FileText size={28} className="mx-auto mb-2 text-neutral-700" />
                <p className="text-sm text-neutral-400">No documents yet</p>
                <p className="mt-1 text-xs text-neutral-600">
                  Capture meeting notes or a feature spec next to your boards.
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  <button
                    onClick={() => createDoc.mutate({ title: 'Meeting notes', template: 'meeting' })}
                    className="rounded-lg bg-teal-400 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-teal-300"
                  >
                    Meeting notes
                  </button>
                  <Link
                    to={`/app/workspace/${workspaceId}/docs`}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:bg-white/5"
                  >
                    Browse templates
                  </Link>
                </div>
              </div>
            )}

            {!docsLoading && docs.length > 0 && (
              <div className="space-y-2">
                {docs.slice(0, 5).map((doc) => (
                  <Link
                    key={doc.id}
                    to={`/app/workspace/${workspaceId}/docs/${doc.id}`}
                    className="group flex items-start justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 transition-all hover:border-neutral-700"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="shrink-0 text-teal-400/80" />
                        <span className="truncate text-sm font-medium text-neutral-200 group-hover:text-white">
                          {doc.title}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-neutral-500">
                        {doc.preview || 'Empty document'}
                      </p>
                    </div>
                    <div className="shrink-0 text-right text-[11px] text-neutral-600">
                      <div>{doc.word_count ?? 0} words</div>
                      <div>{format(parseISO(doc.updated_at), 'MMM d')}</div>
                    </div>
                  </Link>
                ))}
                {docs.length > 5 && (
                  <Link
                    to={`/app/workspace/${workspaceId}/docs`}
                    className="block text-center text-xs text-brand-400 hover:text-brand-300"
                  >
                    View {docs.length - 5} more
                  </Link>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Activity feed sidebar */}
        <div>
          <h2 className="font-semibold text-neutral-200 mb-4 text-sm flex items-center gap-2">
            Activity
          </h2>
          {workspaceId && <ActivityFeed workspaceId={workspaceId} />}
        </div>
      </div>

      <AnimatePresence>
        {newProjectOpen && workspaceId && (
          <NewProjectModal workspaceId={workspaceId} onClose={() => setNewProjectOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
