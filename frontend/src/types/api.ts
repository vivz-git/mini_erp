export interface DatabaseHealth {
  status: "connected" | "disconnected";
  latencyMs: number;
  error?: string;
}

export interface HealthResponse {
  status: "ok" | "degraded";
  uptimeSeconds: number;
  timestamp: string;
  database: DatabaseHealth;
  version: string;
}
