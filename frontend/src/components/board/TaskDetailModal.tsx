import { AnimatePresence, motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import type { Task } from '@/types'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useBoardStore } from '@/store/boardStore'
import { useParams } from 'react-router-dom'
import { X, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'
import type { WorkspaceMember } from '@/types'

interface Props {
  task: Task
  open: boolean
  onClose: () => void
}

const PRIORITY_OPTIONS: Task['priority'][] = ['low', 'medium', 'high', 'urgent']

const PRIORITY_COLORS: Record<Task['priority'], string> = {
  urgent: 'text-rose-400',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-green-400',
}

export default function TaskDetailModal({ task, open, onClose }: Props) {
  const { workspaceId, projectId } = useParams()
  const qc = useQueryClient()
  const { updateTask, removeTask } = useBoardStore()

  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [priority, setPriority] = useState<Task['priority']>(task.priority)
  const [dueDate, setDueDate] = useState(task.due_date ?? '')
  const [assigneeId, setAssigneeId] = useState(task.assignee_id ?? '')

  // Reset form when task changes
  useEffect(() => {
    setTitle(task.title)
    setDescription(task.description ?? '')
    setPriority(task.priority)
    setDueDate(task.due_date ?? '')
    setAssigneeId(task.assignee_id ?? '')
  }, [task])

  const { data: members = [] } = useQuery<WorkspaceMember[]>({
    queryKey: ['members', workspaceId],
    queryFn: () => api.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`).then((r) => r.data),
    enabled: !!workspaceId && open,
  })

  const updateMutation = useMutation({
    mutationFn: (changes: Partial<Task>) => api.patch(`/tasks/${task.id}`, changes).then((r) => r.data),
    onSuccess: (updated: Task) => {
      updateTask(task.id, updated)
      qc.invalidateQueries({ queryKey: ['board', projectId] })
      onClose()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/tasks/${task.id}`),
    onSuccess: () => {
      removeTask(task.id)
      qc.invalidateQueries({ queryKey: ['board', projectId] })
      onClose()
    },
  })

  const handleSave = () => {
    updateMutation.mutate({
      title: title.trim() || task.title,
      description: description || null,
      priority,
      due_date: dueDate || null,
      assignee_id: assigneeId || null,
    })
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 inset-0 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-lg shadow-2xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between p-5 border-b border-neutral-800">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="flex-1 text-base font-semibold text-neutral-100 bg-transparent outline-none focus:ring-1 focus:ring-brand-500 rounded px-1 -ml-1"
                  placeholder="Task title"
                />
                <button
                  onClick={onClose}
                  className="ml-3 text-neutral-500 hover:text-neutral-200 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Add a description..."
                    className="w-full bg-neutral-800 border border-neutral-700 text-sm text-neutral-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-brand-500 resize-none placeholder:text-neutral-600"
                  />
                </div>

                {/* Priority + Due Date row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as Task['priority'])}
                      className="w-full bg-neutral-800 border border-neutral-700 text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-brand-500 text-neutral-200"
                    >
                      {PRIORITY_OPTIONS.map((p) => (
                        <option key={p} value={p} className={PRIORITY_COLORS[p]}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-neutral-800 border border-neutral-700 text-sm text-neutral-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-brand-500 [color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* Assignee */}
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Assignee
                  </label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 text-sm text-neutral-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-5 border-t border-neutral-800">
                <button
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={13} />
                  Delete task
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200 transition-colors rounded-lg hover:bg-neutral-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className={clsx(
                      'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                      'bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50'
                    )}
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
