import { usePresenceStore } from '@/store/presenceStore'
import { useAuthStore } from '@/store/authStore'

export function usePresence() {
  const { users } = usePresenceStore()
  const currentUser = useAuthStore((s) => s.user)
  const onlineUsers = Object.values(users).filter((u) => u.user_id !== currentUser?.id)
  return { onlineUsers, count: onlineUsers.length }
}
