import React, { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Lock, Mail, Loader2, AlertCircle, Shield, Building2 } from "lucide-react";

export const LoginPage: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already authenticated, redirect to destination or home
  const destination = (location.state as { from?: { pathname?: string } })?.from?.pathname || "/";
  if (user) {
    return <Navigate to={destination} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || submitting) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await login({ email: email.trim(), password });
      navigate(destination, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed. Please verify your credentials.";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        <div className="login-header">
          <div className="brand-badge-large">M</div>
          <h1>MiniERP Sign In</h1>
          <p>Enterprise Resource Planning Core System</p>
        </div>

        {errorMessage && (
          <div className="auth-alert" role="alert">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@minierp.local"
                required
                disabled={submitting}
                className="form-input"
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                disabled={submitting}
                className="form-input"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary login-submit-btn"
            disabled={submitting || !email || !password}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="auth-spinner" />
                Signing in...
              </>
            ) : (
              <>
                <Lock size={16} />
                Sign In to MiniERP
              </>
            )}
          </button>
        </form>

        {/* Development-Only Demo Accounts (Strictly excluded in production) */}
        {import.meta.env.DEV && (
          <div className="demo-accounts-section">
            <div className="demo-title">
              <Shield size={14} />
              <span>Development Demo Accounts (1-Click Fill)</span>
            </div>
            <div className="demo-grid">
              <button
                type="button"
                className="demo-btn admin"
                onClick={() => handleFillDemo("admin@minierp.local", "Admin123!")}
                disabled={submitting}
              >
                <span className="demo-role">ADMIN</span>
                <span className="demo-email">admin@minierp.local</span>
              </button>

              <button
                type="button"
                className="demo-btn inventory"
                onClick={() => handleFillDemo("inventory@minierp.local", "Inv123!")}
                disabled={submitting}
              >
                <span className="demo-role">INVENTORY</span>
                <span className="demo-email">inventory@minierp.local</span>
              </button>

              <button
                type="button"
                className="demo-btn sales"
                onClick={() => handleFillDemo("sales@minierp.local", "Sales123!")}
                disabled={submitting}
              >
                <span className="demo-role">SALES</span>
                <span className="demo-email">sales@minierp.local</span>
              </button>

              <button
                type="button"
                className="demo-btn acct"
                onClick={() => handleFillDemo("accountant@minierp.local", "Acct123!")}
                disabled={submitting}
              >
                <span className="demo-role">ACCOUNTANT</span>
                <span className="demo-email">accountant@minierp.local</span>
              </button>
            </div>
          </div>
        )}

        <div className="login-footer">
          <Building2 size={14} />
          <span>MiniERP Demo Enterprise &bull; Strict Role Authorization</span>
        </div>
      </div>
    </div>
  );
};
