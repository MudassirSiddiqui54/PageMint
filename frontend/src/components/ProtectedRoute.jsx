import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="route-loading"><div className="loader"/><span>Loading your page…</span></div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
