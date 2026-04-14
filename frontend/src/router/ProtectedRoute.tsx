import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/auth/login" replace />
  return <>{children}</>
}
