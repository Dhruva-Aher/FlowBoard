import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useBoardStore } from '@/store/boardStore'
import type { BoardData } from '@/types'
import { useEffect } from 'react'

export function useBoard(projectId: string | undefined) {
  const { setBoard } = useBoardStore()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['board', projectId],
    queryFn: () => api.get<BoardData>(`/projects/${projectId}/board`).then((r) => r.data),
    enabled: !!projectId,
  })

  useEffect(() => {
    if (query.data) setBoard(query.data.columns)
  }, [query.data, setBoard])

  const moveTask = useMutation({
    mutationFn: ({ taskId, columnId, position }: { taskId: string; columnId: string; position: number }) =>
      api.patch(`/tasks/${taskId}/move`, { column_id: columnId, position }),
    onError: () => {
      // Rollback: refetch board on error
      qc.invalidateQueries({ queryKey: ['board', projectId] })
    },
  })

  return { ...query, moveTask }
}
