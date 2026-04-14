import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useBoard } from '@/hooks/useBoard'
import { useWorkspaceSocket } from '@/hooks/useWebSocket'
import KanbanBoard from '@/components/board/KanbanBoard'
import AvatarStack from '@/components/presence/AvatarStack'
import type { Project } from '@/types'
import { Loader2 } from 'lucide-react'

export default function BoardView() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>()

  useWorkspaceSocket(workspaceId)

  const { data: project } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: () =>
      api.get(`/workspaces/${workspaceId}/projects`).then((r) => {
        const projects: Project[] = r.data
        return projects.find((p) => p.id === projectId) as Project
      }),
    enabled: !!projectId && !!workspaceId,
  })

  const { isLoading, isError } = useBoard(projectId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-neutral-500" size={28} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-500 text-sm">
        Failed to load board. Please refresh.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <h1 className="text-lg font-semibold text-neutral-100">
          {project?.name ?? 'Board'}
        </h1>
        <AvatarStack />
      </div>

      {/* Board */}
      <div className="flex-1 overflow-hidden">
        {projectId && <KanbanBoard projectId={projectId} />}
      </div>
    </div>
  )
}
