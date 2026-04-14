import { create } from 'zustand'
import type { Workspace, WorkspaceMember } from '@/types'

interface WorkspaceState {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  members: WorkspaceMember[]
  setWorkspaces: (ws: Workspace[]) => void
  setCurrentWorkspace: (ws: Workspace | null) => void
  setMembers: (members: WorkspaceMember[]) => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  currentWorkspace: null,
  members: [],
  setWorkspaces: (workspaces) => set({ workspaces }),
  setCurrentWorkspace: (currentWorkspace) => set({ currentWorkspace }),
  setMembers: (members) => set({ members }),
}))
