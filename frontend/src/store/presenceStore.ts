import { create } from 'zustand'
import type { PresenceUser } from '@/types'

interface PresenceState {
  users: Record<string, PresenceUser>
  setPresence: (userId: string, data: PresenceUser) => void
  removePresence: (userId: string) => void
  clearPresence: () => void
}

export const usePresenceStore = create<PresenceState>((set) => ({
  users: {},
  setPresence: (userId, data) => set((s) => ({ users: { ...s.users, [userId]: data } })),
  removePresence: (userId) => set((s) => {
    const users = { ...s.users }
    delete users[userId]
    return { users }
  }),
  clearPresence: () => set({ users: {} }),
}))
