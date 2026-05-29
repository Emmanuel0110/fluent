import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

export default function AdminRoute({ redirectPath = "/login" }) {
  const { user } = useAuth();
  if (!user) return <Navigate to={redirectPath} replace />;
  if (!user.isAdmin) return <Navigate to="/suggestions" replace />;
  return <Outlet />;
}
