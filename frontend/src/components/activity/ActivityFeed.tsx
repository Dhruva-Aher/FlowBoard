import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ActivityLog } from '@/types'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { Activity } from 'lucide-react'

const ACTION_LABELS: Record<string, string> = {
  created: 'created',
  updated: 'updated',
  deleted: 'deleted',
  moved: 'moved',
  invited: 'invited',
  joined: 'joined',
  left: 'left',
}

interface Props {
  workspaceId: string
}

export default function ActivityFeed({ workspaceId }: Props) {
  const { data: logs = [], isLoading } = useQuery<ActivityLog[]>({
    queryKey: ['activity', workspaceId],
    queryFn: () =>
      api
        .get<ActivityLog[]>(`/workspaces/${workspaceId}/activity`, { params: { limit: 20 } })
        .then((r) => r.data),
    refetchInterval: 30_000,
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-7 h-7 rounded-full bg-neutral-800 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-neutral-800 rounded w-3/4" />
              <div className="h-2.5 bg-neutral-800 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-neutral-600">
        <Activity size={28} className="mb-2" />
        <p className="text-sm">No activity yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-1 overflow-y-auto max-h-96">
      {logs.map((log) => (
        <div key={log.id} className="flex gap-3 px-1 py-2 rounded-lg hover:bg-neutral-800/50 transition-colors">
          {/* Actor avatar */}
          <div className="w-7 h-7 rounded-full bg-brand-600/30 border border-brand-500/30 flex items-center justify-center text-[10px] font-semibold text-brand-400 shrink-0">
            {log.actor_id.slice(0, 2).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-neutral-300 leading-snug">
              <span className="font-medium text-neutral-100">
                {(log.meta?.actor_name as string) ?? log.actor_id.slice(0, 8)}
              </span>{' '}
              <span className="text-neutral-400">
                {ACTION_LABELS[log.action] ?? log.action}
              </span>{' '}
              <span className="text-neutral-300 capitalize">
                {log.entity_type}
              </span>
              {log.meta?.entity_name && (
                <span className="text-neutral-400">
                  {' '}
                  &ldquo;
                  <span className="text-neutral-200">{log.meta.entity_name as string}</span>
                  &rdquo;
                </span>
              )}
            </p>
            <p className="text-[10px] text-neutral-600 mt-0.5">
              {formatDistanceToNow(parseISO(log.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
