import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";

export const ProtectedRoute: React.FC = () => {
  const { user, loading, initialError, retryBootstrap } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-loading-screen" role="status" aria-live="polite">
        <Loader2 size={36} className="auth-spinner" />
        <p>Verifying active session...</p>
      </div>
    );
  }

  // If a server or network error occurred during session check (not a clean 401)
  if (initialError) {
    return (
      <div className="auth-error-screen" role="alert">
        <div className="auth-error-card">
          <AlertTriangle size={36} color="var(--status-error)" />
          <h2>Connection Issue</h2>
          <p>{initialError}</p>
          <button className="btn btn-primary" onClick={retryBootstrap}>
            <RefreshCw size={16} />
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
