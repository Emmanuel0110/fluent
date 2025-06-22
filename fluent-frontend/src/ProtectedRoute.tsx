import { Navigate, Outlet } from "react-router";
import { useAuth } from "./contexts/AuthContext";

interface ProtectedRouteProps {
  redirectPath: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ redirectPath }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading || isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated === false) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
