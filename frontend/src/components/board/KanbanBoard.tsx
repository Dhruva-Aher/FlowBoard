import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { useBoardStore } from '@/store/boardStore'
import Column from './Column'
import TaskCard from './TaskCard'
import { useState } from 'react'
import type { Task } from '@/types'
import { useBoard } from '@/hooks/useBoard'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Plus } from 'lucide-react'

export default function KanbanBoard({ projectId }: { projectId: string }) {
  const columns = useBoardStore((s) => s.columns)
  const { optimisticMoveTask } = useBoardStore()
  const { moveTask } = useBoard(projectId)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [addingColumn, setAddingColumn] = useState(false)
  const [newColName, setNewColName] = useState('')
  const qc = useQueryClient()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const task = columns.flatMap((c) => c.tasks).find((t) => t.id === event.active.id)
    setActiveTask(task ?? null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    if (!over || active.id === over.id) return

    const taskId = active.id as string
    const toColumnId = over.id as string

    // Only process if dropping onto a column (not another task)
    const isColumn = columns.some((c) => c.id === toColumnId)
    if (!isColumn) return

    const fromColumn = columns.find((c) => c.tasks.some((t) => t.id === taskId))
    if (!fromColumn) return

    const newPosition = columns.find((c) => c.id === toColumnId)?.tasks.length ?? 0

    optimisticMoveTask(taskId, fromColumn.id, toColumnId, newPosition)
    moveTask.mutate({ taskId, columnId: toColumnId, position: newPosition })
  }

  const createColumn = useMutation({
    mutationFn: (name: string) =>
      api.post(`/projects/${projectId}/columns`, { name }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['board', projectId] })
      setNewColName('')
      setAddingColumn(false)
    },
  })

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-full items-start">
        <SortableContext
          items={columns.map((c) => c.id)}
          strategy={horizontalListSortingStrategy}
        >
          {columns.map((col) => (
            <Column key={col.id} column={col} projectId={projectId} />
          ))}
        </SortableContext>

        {/* Add column */}
        {addingColumn ? (
          <div className="min-w-[280px] max-w-[280px] bg-neutral-900 rounded-xl p-3">
            <input
              autoFocus
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newColName.trim()) createColumn.mutate(newColName.trim())
                if (e.key === 'Escape') setAddingColumn(false)
              }}
              className="w-full bg-neutral-800 text-sm text-neutral-100 rounded-lg px-3 py-2 outline-none ring-1 ring-neutral-700 focus:ring-brand-500"
              placeholder="Column name..."
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => newColName.trim() && createColumn.mutate(newColName.trim())}
                disabled={!newColName.trim() || createColumn.isPending}
                className="text-xs bg-brand-600 text-white px-3 py-1 rounded-md hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                Add column
              </button>
              <button
                onClick={() => { setAddingColumn(false); setNewColName('') }}
                className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingColumn(true)}
            className="min-w-[200px] flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-neutral-800 text-sm text-neutral-500 hover:text-neutral-300 hover:border-neutral-700 transition-all"
          >
            <Plus size={16} />
            Add column
          </button>
        )}
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  )
}
