import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Activity,
  LayoutDashboard,
  Boxes,
  Users,
  ShoppingCart,
  TrendingUp,
  ReceiptText,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  Loader2,
  AlertCircle,
  Layers,
} from "lucide-react";

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError(null);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Logout failed. Please retry.";
      setLogoutError(message);
    } finally {
      setLoggingOut(false);
    }
  };

  const getRoleBadgeClass = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return "role-badge admin";
      case "INVENTORY_MANAGER":
        return "role-badge inventory";
      case "SALES_REP":
        return "role-badge sales";
      case "ACCOUNTANT":
        return "role-badge accountant";
      default:
        return "role-badge";
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-badge">M</div>
          <div>
            <div className="brand-title">MiniERP</div>
            <div className="brand-subtitle">Enterprise Core</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Foundation</div>
          <NavLink
            to="/"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <Activity size={18} />
            <span>System Health</span>
          </NavLink>

          <div className="nav-section-title">Master Data</div>
          <NavLink
            to="/categories"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <Layers size={18} />
            <span>Categories</span>
          </NavLink>

          <div className="nav-section-title">ERP Roadmap Modules</div>

          <div className="nav-item placeholder" title="Will be unlocked in Milestone 8">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
            <span className="badge-tag">M8</span>
          </div>

          <div className="nav-item placeholder" title="Unlocked in Milestone 2 (Backend Active)">
            <ShieldCheck size={18} />
            <span>Auth & Roles</span>
            <span className="badge-tag" style={{ color: "var(--status-success)" }}>M2 Active</span>
          </div>

          <div className="nav-item placeholder" title="Will be unlocked in Milestone 3">
            <Users size={18} />
            <span>Partners & CRM</span>
            <span className="badge-tag">M3</span>
          </div>

          <div className="nav-item placeholder" title="Will be unlocked in Milestone 4">
            <Boxes size={18} />
            <span>Inventory Engine</span>
            <span className="badge-tag">M4</span>
          </div>

          <div className="nav-item placeholder" title="Will be unlocked in Milestone 5">
            <ShoppingCart size={18} />
            <span>Purchase Orders</span>
            <span className="badge-tag">M5</span>
          </div>

          <div className="nav-item placeholder" title="Will be unlocked in Milestone 6">
            <TrendingUp size={18} />
            <span>Sales Orders</span>
            <span className="badge-tag">M6</span>
          </div>

          <div className="nav-item placeholder" title="Will be unlocked in Milestone 7">
            <ReceiptText size={18} />
            <span>Invoices & Ledger</span>
            <span className="badge-tag">M7</span>
          </div>
        </nav>

        {/* User Identity and Session Footer */}
        <div className="sidebar-footer">
          {logoutError && (
            <div
              style={{
                fontSize: "0.72rem",
                color: "var(--status-error)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                marginBottom: "8px",
              }}
              role="alert"
            >
              <AlertCircle size={12} />
              <span>{logoutError}</span>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div className="user-snippet">
              <div className="user-avatar" title={user?.email}>
                <UserIcon size={16} />
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 600, whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                  {user?.name || "Active Session"}
                </div>
                <div style={{ marginTop: "2px" }}>
                  <span className={getRoleBadgeClass(user?.role)}>
                    {user?.role || "GUEST"}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="btn-logout"
              title="Sign out of MiniERP"
              aria-label="Sign out"
            >
              {loggingOut ? <Loader2 size={14} className="auth-spinner" /> : <LogOut size={14} />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main App Area */}
      <div className="main-wrapper">
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>Milestone 2:</span>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>
              Authentication & Role-Based Access Control
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Logged in as:</span>
              <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{user?.email}</span>
              <span className={getRoleBadgeClass(user?.role)}>{user?.role}</span>
            </div>

            <div className="status-pill online">
              <span className="pulse-dot"></span>
              Secure Session
            </div>
          </div>
        </header>

        <main className="content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
