import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User, LoginCredentials } from "../types/api";
import { getCurrentUser, login as apiLogin, logout as apiLogout } from "../services/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  initialError: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  retryBootstrap: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialError, setInitialError] = useState<string | null>(null);

  const bootstrapSession = useCallback(async () => {
    setLoading(true);
    setInitialError(null);
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      // Server error or network disruption (NOT 401 unauthenticated)
      const message = err instanceof Error ? err.message : "Failed to verify session status.";
      setInitialError(message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrapSession();
  }, [bootstrapSession]);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    const authenticatedUser = await apiLogin(credentials);
    setUser(authenticatedUser);
    setInitialError(null);
  };

  const logout = async (): Promise<void> => {
    await apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        initialError,
        login,
        logout,
        retryBootstrap: bootstrapSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
