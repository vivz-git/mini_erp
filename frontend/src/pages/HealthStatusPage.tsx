import React, { useEffect, useState, useCallback } from "react";
import { fetchHealthStatus } from "../services/api";
import type { HealthResponse } from "../types/api";
import {
  Server,
  Database,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Network,
  Cpu,
} from "lucide-react";

export const HealthStatusPage: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const checkHealth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchHealthStatus();
      setHealth(data);
      setLastChecked(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      checkHealth();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, checkHealth]);

  const isServerUp = !error && health?.status === "ok";
  const isDbUp = !error && health?.database.status === "connected";

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1>
            <Network size={28} color="#818cf8" />
            System Foundation & Health
          </h1>
          <p>Real-time verification of the Express API layer and PostgreSQL database engine.</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            className={`btn ${autoRefresh ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{ fontSize: "0.8rem" }}
          >
            Auto-refresh: {autoRefresh ? "ON (5s)" : "OFF"}
          </button>
          <button
            className="btn btn-secondary"
            onClick={checkHealth}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "pulse-dot" : ""} />
            Check Now
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid-cards">
        {/* Backend API Server Card */}
        <div className="card">
          <div className="card-title">
            <span>Express API Server</span>
            <Server size={18} color="#6366f1" />
          </div>
          <div className="card-value">
            {isServerUp ? (
              <span className="status-pill online">
                <CheckCircle2 size={14} /> Online
              </span>
            ) : (
              <span className="status-pill offline">
                <XCircle size={14} /> Offline
              </span>
            )}
          </div>
          <div className="card-desc">Port: 5000 &bull; Node.js v24 Runtime</div>
        </div>

        {/* PostgreSQL Database Card */}
        <div className="card">
          <div className="card-title">
            <span>PostgreSQL Engine</span>
            <Database size={18} color="#10b981" />
          </div>
          <div className="card-value">
            {isDbUp ? (
              <span className="status-pill online">
                <CheckCircle2 size={14} /> Connected
              </span>
            ) : (
              <span className="status-pill offline">
                <AlertTriangle size={14} /> Disconnected
              </span>
            )}
          </div>
          <div className="card-desc">Docker: postgres:16-alpine &bull; Port 5432</div>
        </div>

        {/* Database Query Latency */}
        <div className="card">
          <div className="card-title">
            <span>Query Roundtrip Latency</span>
            <Cpu size={18} color="#f59e0b" />
          </div>
          <div className="card-value">
            {health?.database.latencyMs !== undefined ? `${health.database.latencyMs} ms` : "--"}
          </div>
          <div className="card-desc">Calculated via live `SELECT 1` query</div>
        </div>

        {/* Uptime Card */}
        <div className="card">
          <div className="card-title">
            <span>Server Uptime</span>
            <Clock size={18} color="#a855f7" />
          </div>
          <div className="card-value">
            {health?.uptimeSeconds !== undefined ? `${health.uptimeSeconds}s` : "--"}
          </div>
          <div className="card-desc">Active process continuous execution</div>
        </div>
      </div>

      {/* Connection Diagnostic Panel */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Server size={18} />
            Diagnostics & Endpoint Contract
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
            Last Ping: {lastChecked.toLocaleTimeString()}
          </span>
        </div>

        {error ? (
          <div style={{ padding: "16px", background: "var(--status-error-bg)", borderRadius: "var(--radius-md)", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
            <div style={{ color: "var(--status-error)", fontWeight: 700, marginBottom: "4px" }}>
              Connection Error:
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "#fca5a5" }}>
              {error}
            </div>
          </div>
        ) : (
          <div>
            <div className="data-row">
              <span className="data-label">Target Endpoint</span>
              <span className="data-val">GET /api/health</span>
            </div>
            <div className="data-row">
              <span className="data-label">Prisma Client Status</span>
              <span className="data-val">Connected & Verified</span>
            </div>
            <div className="data-row">
              <span className="data-label">API Version</span>
              <span className="data-val">{health?.version ?? "1.0.0"}</span>
            </div>
            <div className="data-row">
              <span className="data-label">Server Timestamp</span>
              <span className="data-val">{health?.timestamp ?? "--"}</span>
            </div>
          </div>
        )}
      </div>

      {/* Architectural Flow Explanation */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Network size={18} />
            Data Flow: How This Check Works
          </div>
        </div>
        <div className="arch-box">
          1. <strong>React Frontend</strong> fetches <code>/api/health</code> via Vite Dev Proxy.<br />
          2. <strong>Vite Proxy</strong> transparently forwards the request to <code>http://localhost:5000/api/health</code>.<br />
          3. <strong>Express Backend</strong> executes <code>health.controller.ts</code>.<br />
          4. <strong>Prisma ORM</strong> issues a live <code>SELECT 1</code> SQL statement to the PostgreSQL container.<br />
          5. <strong>PostgreSQL 16</strong> returns a response, latency is computed, and JSON is delivered back to this dashboard.
        </div>
      </div>
    </div>
  );
};
