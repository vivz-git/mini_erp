import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  Activity,
  LayoutDashboard,
  Boxes,
  Users,
  ShoppingCart,
  TrendingUp,
  ReceiptText,
  ShieldCheck,
  Building2,
} from "lucide-react";

export const DashboardLayout: React.FC = () => {
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

          <div className="nav-section-title">ERP Roadmap Modules</div>

          <div className="nav-item placeholder" title="Will be unlocked in Milestone 8">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
            <span className="badge-tag">M8</span>
          </div>

          <div className="nav-item placeholder" title="Will be unlocked in Milestone 2">
            <ShieldCheck size={18} />
            <span>Auth & Roles</span>
            <span className="badge-tag">M2</span>
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

        <div className="sidebar-footer">
          <div className="user-snippet">
            <div className="user-avatar">
              <Building2 size={16} />
            </div>
            <div>
              <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>MiniERP Demo Corp</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>Dev Environment</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main App Area */}
      <div className="main-wrapper">
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>Milestone 1:</span>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>
              Foundation & Tooling Setup
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="status-pill online">
              <span className="pulse-dot"></span>
              Environment Active
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
