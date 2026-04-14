import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import type { Task } from '@/types'
import { clsx } from 'clsx'
import { Calendar, User } from 'lucide-react'
import { format, isPast, parseISO } from 'date-fns'
import TaskDetailModal from './TaskDetailModal'

const PRIORITY_STYLES: Record<Task['priority'], string> = {
  urgent: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
  high: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  low: 'bg-green-500/20 text-green-400 border border-green-500/30',
}

interface TaskCardProps {
  task: Task
  isDragging?: boolean
}

export default function TaskCard({ task, isDragging = false }: TaskCardProps) {
  const [modalOpen, setModalOpen] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } =
    useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isOverdue = task.due_date && isPast(parseISO(task.due_date))

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => !isSortableDragging && setModalOpen(true)}
        className={clsx(
          'bg-neutral-800 rounded-lg p-3 cursor-pointer select-none group',
          'hover:bg-neutral-750 hover:ring-1 hover:ring-neutral-600 transition-all',
          (isDragging || isSortableDragging) && 'opacity-50 ring-2 ring-brand-500 rotate-1'
        )}
      >
        {/* Priority badge */}
        <div className="flex items-center justify-between mb-2">
          <span className={clsx('text-[10px] font-medium px-1.5 py-0.5 rounded capitalize', PRIORITY_STYLES[task.priority])}>
            {task.priority}
          </span>
        </div>

        {/* Title */}
        <p className="text-sm text-neutral-200 font-medium leading-snug mb-2 line-clamp-2">
          {task.title}
        </p>

        {/* Footer: due date + assignee */}
        <div className="flex items-center justify-between mt-2 gap-2">
          {task.due_date && (
            <span
              className={clsx(
                'flex items-center gap-1 text-[10px]',
                isOverdue ? 'text-rose-400' : 'text-neutral-500'
              )}
            >
              <Calendar size={10} />
              {format(parseISO(task.due_date), 'MMM d')}
            </span>
          )}
          {task.assignee_id && (
            <span className="flex items-center gap-1 text-[10px] text-neutral-500 ml-auto">
              <User size={10} />
              <span className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center text-[9px] font-bold text-white">
                A
              </span>
            </span>
          )}
        </div>
      </div>

      <TaskDetailModal task={task} open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
