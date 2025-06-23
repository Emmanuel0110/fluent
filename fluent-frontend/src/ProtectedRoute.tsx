import { Navigate, Outlet } from "react-router";
import { useAuth } from "./contexts/AuthContext";
import { useLanguage } from "./contexts/LanguageContext";

interface ProtectedRouteProps {
  redirectPath: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ redirectPath }) => {
  const { isAuthenticated, loading } = useAuth();
  const { sourceLanguage, targetLanguage } = useLanguage();

  if (loading || isAuthenticated === null || !sourceLanguage || !targetLanguage) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated === false) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
