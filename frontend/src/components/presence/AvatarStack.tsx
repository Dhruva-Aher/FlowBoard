import { usePresence } from '@/hooks/usePresence'

const COLORS = ['bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-sky-500']

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function AvatarStack() {
  const { onlineUsers } = usePresence()
  const visible = onlineUsers.slice(0, 4)
  const overflow = onlineUsers.length - 4

  if (onlineUsers.length === 0) return null

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((u, i) => (
        <div
          key={u.user_id}
          title={u.name}
          className={`w-7 h-7 rounded-full ${COLORS[i % COLORS.length]} flex items-center justify-center text-xs font-semibold text-white ring-2 ring-neutral-900`}
        >
          {getInitials(u.name)}
        </div>
      ))}
      {overflow > 0 && (
        <div className="w-7 h-7 rounded-full bg-neutral-700 flex items-center justify-center text-xs text-neutral-300 ring-2 ring-neutral-900">
          +{overflow}
        </div>
      )}
    </div>
  )
}
