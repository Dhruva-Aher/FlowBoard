import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/router/ProtectedRoute'
import Landing from '@/pages/Landing'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import Dashboard from '@/pages/app/Dashboard'
import WorkspaceHome from '@/pages/app/WorkspaceHome'
import BoardView from '@/pages/app/BoardView'
import DocEditor from '@/pages/app/DocEditor'
import Members from '@/pages/app/Members'
import Settings from '@/pages/app/Settings'
import InviteAccept from '@/pages/InviteAccept'
import AppShell from '@/components/layout/AppShell'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/invite/:token" element={<InviteAccept />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="workspace/:workspaceId" element={<WorkspaceHome />} />
          <Route path="workspace/:workspaceId/board/:projectId" element={<BoardView />} />
          <Route path="workspace/:workspaceId/docs/:docId" element={<DocEditor />} />
          <Route path="workspace/:workspaceId/members" element={<Members />} />
          <Route path="workspace/:workspaceId/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
