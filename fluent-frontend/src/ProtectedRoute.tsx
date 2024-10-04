import { Navigate, Outlet } from "react-router";
import { loadUser } from "./auth/authActions";
import { Dispatch, SetStateAction, useState } from "react";
import { User } from "./types";

interface ProtectedRouteProps {
  redirectPath: string;
  isAuthenticated: Boolean | null;
  setIsAuthenticated: Dispatch<React.SetStateAction<boolean | null>>;
  setUser: Dispatch<SetStateAction<User | null>>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  isAuthenticated,
  setIsAuthenticated,
  setUser,
  redirectPath,
}) => {
  const [userIsLoading, setUserIsLoading] = useState(false);
  
  if (isAuthenticated === true) {
    return <Outlet />;
  } else if (isAuthenticated === false) {
    return <Navigate to={redirectPath} replace />;
  } else {
    if (!userIsLoading) {
      loadUser(setUser, setIsAuthenticated, setUserIsLoading);
      setUserIsLoading(true);
    }
    return <div>Loading...</div>;
  }
};

export default ProtectedRoute;
