import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { Workspace } from '@/types'
import {
  LayoutDashboard,
  Kanban,
  FileText,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  Zap,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { clsx } from 'clsx'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function Sidebar() {
  const { workspaceId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { setWorkspaces } = useWorkspaceStore()
  const [workspacesOpen, setWorkspacesOpen] = useState(true)

  const { data: workspaces = [] } = useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: () => api.get<Workspace[]>('/workspaces').then((r) => r.data),
  })

  // TanStack Query v5 removed onSuccess — sync to Zustand store via useEffect
  useEffect(() => {
    if (workspaces.length > 0) setWorkspaces(workspaces)
  }, [workspaces, setWorkspaces])

  const handleLogout = () => {
    logout()
    navigate('/auth/login')
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <aside className="w-60 shrink-0 bg-neutral-900 border-r border-neutral-800 flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-neutral-800">
        <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
          <Zap size={14} className="text-white" />
        </div>
        <span className="font-bold text-white text-sm tracking-wide">FlowBoard</span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        <Link
          to="/app"
          className={clsx(
            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
            isActive('/app')
              ? 'bg-neutral-800 text-white'
              : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800'
          )}
        >
          <LayoutDashboard size={16} />
          Dashboard
        </Link>

        {/* Workspaces section */}
        <div className="pt-3">
          <button
            onClick={() => setWorkspacesOpen((o) => !o)}
            className="flex items-center justify-between w-full px-3 py-1 text-xs text-neutral-500 uppercase tracking-wider hover:text-neutral-300 transition-colors"
          >
            <span>Workspaces</span>
            <ChevronDown
              size={12}
              className={clsx('transition-transform', workspacesOpen ? '' : '-rotate-90')}
            />
          </button>

          {workspacesOpen && (
            <div className="mt-1 space-y-0.5">
              {workspaces.map((ws) => (
                <div key={ws.id}>
                  <Link
                    to={`/app/workspace/${ws.id}`}
                    className={clsx(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                      workspaceId === ws.id
                        ? 'bg-brand-600/20 text-brand-400'
                        : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800'
                    )}
                  >
                    <div className="w-5 h-5 rounded bg-neutral-700 flex items-center justify-center text-[10px] font-bold text-neutral-300 shrink-0">
                      {getInitials(ws.name)}
                    </div>
                    <span className="truncate">{ws.name}</span>
                  </Link>

                  {/* Sub-nav for current workspace */}
                  {workspaceId === ws.id && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l border-neutral-800 pl-3">
                      <Link
                        to={`/app/workspace/${ws.id}`}
                        className={clsx(
                          'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors',
                          isActive(`/app/workspace/${ws.id}`)
                            ? 'text-white bg-neutral-800'
                            : 'text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800'
                        )}
                      >
                        <Kanban size={13} /> Boards & Docs
                      </Link>
                      <Link
                        to={`/app/workspace/${ws.id}/members`}
                        className={clsx(
                          'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors',
                          isActive(`/app/workspace/${ws.id}/members`)
                            ? 'text-white bg-neutral-800'
                            : 'text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800'
                        )}
                      >
                        <Users size={13} /> Members
                      </Link>
                      <Link
                        to={`/app/workspace/${ws.id}/settings`}
                        className={clsx(
                          'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors',
                          isActive(`/app/workspace/${ws.id}/settings`)
                            ? 'text-white bg-neutral-800'
                            : 'text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800'
                        )}
                      >
                        <Settings size={13} /> Settings
                      </Link>
                      <Link
                        to={`/app/workspace/${ws.id}/docs/new`}
                        className={clsx(
                          'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors',
                          'text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800'
                        )}
                      >
                        <FileText size={13} /> Documents
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* User footer */}
      {user && (
        <div className="border-t border-neutral-800 px-3 py-3 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-xs font-semibold text-white shrink-0">
            {getInitials(user.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-neutral-200 truncate">{user.name}</p>
            <p className="text-[10px] text-neutral-500 truncate">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="text-neutral-500 hover:text-neutral-200 transition-colors p-1 rounded hover:bg-neutral-800"
          >
            <LogOut size={14} />
          </button>
        </div>
      )}
    </aside>
  )
}
