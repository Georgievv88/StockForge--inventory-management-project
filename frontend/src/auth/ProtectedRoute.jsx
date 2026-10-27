import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./context";

export default function ProtectedRoute() {
  const { user, loading, error } = useAuth();
  const location = useLocation();
  if (loading)
    return <p className="p-8 text-ink">Checking your session...</p>;
  if (error)
    return (
      <p role="alert" className="p-8 text-danger">
        {error}
      </p>
    );
  if (!user)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
