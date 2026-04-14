import { create } from 'zustand'
import type { ColumnWithTasks, Task, WSEvent } from '@/types'

interface BoardState {
  columns: ColumnWithTasks[]
  setBoard: (columns: ColumnWithTasks[]) => void
  optimisticMoveTask: (taskId: string, fromColumnId: string, toColumnId: string, position: number) => void
  applyRemoteEvent: (event: WSEvent) => void
  updateTask: (taskId: string, changes: Partial<Task>) => void
  addTask: (task: Task) => void
  removeTask: (taskId: string) => void
}

export const useBoardStore = create<BoardState>((set, get) => ({
  columns: [],

  setBoard: (columns) => set({ columns }),

  optimisticMoveTask: (taskId, fromColumnId, toColumnId, position) => {
    const { columns } = get()
    let movedTask: Task | undefined

    const updated = columns.map((col) => {
      if (col.id === fromColumnId) {
        movedTask = col.tasks.find((t) => t.id === taskId)
        return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) }
      }
      return col
    })

    if (!movedTask) return

    const final = updated.map((col) => {
      if (col.id === toColumnId) {
        const tasks = [...col.tasks]
        tasks.splice(position, 0, { ...movedTask!, column_id: toColumnId })
        return { ...col, tasks }
      }
      return col
    })

    set({ columns: final })
  },

  applyRemoteEvent: (event) => {
    const { columns } = get()
    if (event.event === 'task.moved') {
      const p = event.payload as { task_id: string; to_column: string; from_column: string; position: number }
      get().optimisticMoveTask(p.task_id, p.from_column, p.to_column, p.position)
    } else if (event.event === 'task.created') {
      const task = event.payload as Task
      set({ columns: columns.map((c) => c.id === task.column_id ? { ...c, tasks: [...c.tasks, task] } : c) })
    } else if (event.event === 'task.deleted') {
      const { task_id } = event.payload as { task_id: string }
      set({ columns: columns.map((c) => ({ ...c, tasks: c.tasks.filter((t) => t.id !== task_id) })) })
    } else if (event.event === 'task.updated') {
      const { task_id, changes } = event.payload as { task_id: string; changes: Partial<Task> }
      get().updateTask(task_id, changes)
    }
  },

  updateTask: (taskId, changes) => {
    set({
      columns: get().columns.map((c) => ({
        ...c,
        tasks: c.tasks.map((t) => (t.id === taskId ? { ...t, ...changes } : t)),
      })),
    })
  },

  addTask: (task) => {
    set({
      columns: get().columns.map((c) =>
        c.id === task.column_id ? { ...c, tasks: [...c.tasks, task] } : c
      ),
    })
  },

  removeTask: (taskId) => {
    set({
      columns: get().columns.map((c) => ({ ...c, tasks: c.tasks.filter((t) => t.id !== taskId) })),
    })
  },
}))
