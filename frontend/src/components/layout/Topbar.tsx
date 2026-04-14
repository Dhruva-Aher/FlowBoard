import { useParams, useLocation, Link } from 'react-router-dom'
import { useWorkspaceStore } from '@/store/workspaceStore'
import AvatarStack from '@/components/presence/AvatarStack'
import { Bell, Search, ChevronRight } from 'lucide-react'

export default function Topbar() {
  const { workspaceId } = useParams()
  const location = useLocation()
  const { currentWorkspace } = useWorkspaceStore()

  // Build breadcrumb segments from pathname
  const segments = location.pathname.replace('/app', '').split('/').filter(Boolean)

  const getBreadcrumbs = () => {
    const crumbs: { label: string; href?: string }[] = [{ label: 'FlowBoard', href: '/app' }]

    if (currentWorkspace) {
      crumbs.push({
        label: currentWorkspace.name,
        href: `/app/workspace/${workspaceId}`,
      })
    }

    if (segments.includes('board')) {
      crumbs.push({ label: 'Board' })
    } else if (segments.includes('docs')) {
      crumbs.push({ label: 'Document' })
    } else if (segments.includes('members')) {
      crumbs.push({ label: 'Members' })
    } else if (segments.includes('settings')) {
      crumbs.push({ label: 'Settings' })
    }

    return crumbs
  }

  const crumbs = getBreadcrumbs()

  return (
    <header className="h-14 shrink-0 bg-neutral-900/50 border-b border-neutral-800 flex items-center justify-between px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={13} className="text-neutral-600" />}
            {crumb.href ? (
              <Link
                to={crumb.href}
                className="text-neutral-400 hover:text-neutral-100 transition-colors"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-neutral-200 font-medium">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <AvatarStack />

        <button
          title="Search"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
        >
          <Search size={16} />
        </button>

        <button
          title="Notifications"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors relative"
        >
          <Bell size={16} />
          {/* Notification dot placeholder */}
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand-500 rounded-full" />
        </button>
      </div>
    </header>
  )
}
