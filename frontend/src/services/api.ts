import type { HealthResponse } from "../types/api";

export async function fetchHealthStatus(): Promise<HealthResponse> {
  const response = await fetch("/api/health");
  const data = await response.json();
  if (!response.ok && data.status !== "degraded") {
    throw new Error(data?.database?.error || `HTTP error ${response.status}`);
  }
  return data as HealthResponse;
}
