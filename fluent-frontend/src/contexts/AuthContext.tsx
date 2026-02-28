import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { loadUser } from "../auth/authActions";
import { setOnUnauthorized } from "../utils/http-helpers";
import { User } from "../types";

interface AuthContextType {
  isAuthenticated: boolean | null;
  user: User | null;
  setIsAuthenticated: (value: boolean | null) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem("token");
  }, []);

  // Global 401 handler: any API call that gets 401 will trigger logout
  useEffect(() => {
    setOnUnauthorized(logout);
    return () => setOnUnauthorized(null);
  }, [logout]);

  // Initialize auth state on mount
  useEffect(() => {
    if (isAuthenticated === null && !loading) {
      setLoading(true);
      loadUser(setUser, setIsAuthenticated, setLoading);
    }
  }, [isAuthenticated, loading]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        setIsAuthenticated,
        setUser,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
