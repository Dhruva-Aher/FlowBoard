import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import TaskCard from './TaskCard'
import type { ColumnWithTasks } from '@/types'
import { useState } from 'react'
import { Plus, MoreHorizontal } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useBoardStore } from '@/store/boardStore'
import { clsx } from 'clsx'

export default function Column({ column, projectId: _projectId }: { column: ColumnWithTasks; projectId: string }) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const { addTask } = useBoardStore()

  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  const createTask = useMutation({
    mutationFn: (t: string) =>
      api.post(`/columns/${column.id}/tasks`, { title: t }).then((r) => r.data),
    onSuccess: (task) => {
      addTask(task)
      setTitle('')
      setAdding(false)
    },
  })

  const handleSubmit = () => {
    if (title.trim()) createTask.mutate(title.trim())
  }

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'flex flex-col bg-neutral-900 rounded-xl min-w-[280px] max-w-[280px] p-3 gap-2 transition-all duration-150',
        isOver ? 'ring-2 ring-brand-500 bg-neutral-800/80' : ''
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-1 mb-1">
        <h3 className="font-semibold text-sm text-neutral-200">{column.name}</h3>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-neutral-500 bg-neutral-800 rounded-full px-2 py-0.5">
            {column.tasks.length}
          </span>
          <button className="text-neutral-600 hover:text-neutral-300 transition-colors p-0.5 rounded">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* Tasks */}
      <SortableContext items={column.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 min-h-[40px]">
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>

      {/* Add task */}
      {adding ? (
        <div className="mt-1">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit()
              if (e.key === 'Escape') setAdding(false)
            }}
            className="w-full bg-neutral-800 text-sm text-neutral-100 rounded-lg px-3 py-2 outline-none ring-1 ring-neutral-700 focus:ring-brand-500"
            placeholder="Task title..."
            disabled={createTask.isPending}
          />
          <div className="flex gap-2 mt-1.5">
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || createTask.isPending}
              className="text-xs bg-brand-600 text-white px-3 py-1 rounded-md hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {createTask.isPending ? 'Adding...' : 'Add'}
            </button>
            <button
              onClick={() => { setAdding(false); setTitle('') }}
              className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300 mt-1 px-1 py-1 rounded hover:bg-neutral-800 transition-colors"
        >
          <Plus size={14} /> Add task
        </button>
      )}
    </div>
  )
}
