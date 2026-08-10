import { Navigate } from 'react-router-dom'
import { auth } from '../services/backendApi'

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!auth.isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export default RequireAuth
