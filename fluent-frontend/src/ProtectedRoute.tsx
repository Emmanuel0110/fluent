import { Navigate, Outlet } from "react-router";
import { useAuth } from "./contexts/AuthContext";
import { useLanguage } from "./contexts/LanguageContext";

interface ProtectedRouteProps {
  redirectPath: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ redirectPath }) => {
  const { isAuthenticated, loading } = useAuth();
  const { languages, sourceLanguage, targetLanguage } = useLanguage();

  if (loading || isAuthenticated === null) {
    return <div>Loading auth...</div>;
  }

  if (isAuthenticated === false) {
    return <Navigate to={redirectPath} replace />;
  }

  if (isAuthenticated === true && (!sourceLanguage || !targetLanguage || languages.length === 0)) {
    return <div>Loading language...</div>;
  }

  return <Outlet />;
};

export default ProtectedRoute;
