export interface User {
  id: string
  email: string
  name: string
  avatar_url: string | null
  is_active: boolean
}

export interface Workspace {
  id: string
  name: string
  slug: string
  owner_id: string
  plan: string
  created_at: string
}

export interface WorkspaceMember {
  id: string
  user_id: string
  workspace_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  joined_at: string
  user: Pick<User, 'id' | 'name' | 'email' | 'avatar_url'>
}

export interface Project {
  id: string
  workspace_id: string
  name: string
  description: string | null
  created_by: string
  created_at: string
}

export interface Column {
  id: string
  project_id: string
  name: string
  position: number
}

export interface Task {
  id: string
  column_id: string
  project_id: string
  title: string
  description: string | null
  assignee_id: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date: string | null
  position: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface ColumnWithTasks extends Column {
  tasks: Task[]
}

export interface BoardData {
  project_id: string
  columns: ColumnWithTasks[]
}

export interface Document {
  id: string
  workspace_id: string
  title: string
  content: Record<string, unknown>
  created_by: string
  last_edited_by: string | null
  created_at: string
  updated_at: string
}

export interface DocumentListItem {
  id: string
  title: string
  created_by: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  workspace_id: string
  actor_id: string
  entity_type: string
  entity_id: string
  action: string
  meta: Record<string, unknown>
  created_at: string
}

export type Role = 'owner' | 'admin' | 'member' | 'viewer'

export interface WSEvent {
  event: string
  actor: { id: string; name: string }
  payload: Record<string, unknown>
  workspace_id: string
  ts: string
}

export interface PresenceUser {
  user_id: string
  name: string
  avatar_url?: string
  active: boolean
}
