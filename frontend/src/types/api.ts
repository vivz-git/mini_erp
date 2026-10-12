export type Role = "ADMIN" | "INVENTORY_MANAGER" | "SALES_REP" | "ACCOUNTANT";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
}

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
