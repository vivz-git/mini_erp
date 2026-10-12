import { Request, Response } from "express";
import { prisma } from "../config/db";

export async function getHealthStatus(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  let dbStatus = "connected";
  let dbLatencyMs = 0;
  let dbError: string | null = null;

  try {
    // Perform an actual query against PostgreSQL to guarantee active database connectivity
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - startTime;
  } catch (error) {
    dbStatus = "disconnected";
    dbError = error instanceof Error ? error.message : "Unknown database error";
  }

  const isHealthy = dbStatus === "connected";

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "ok" : "degraded",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
      ...(dbError && { error: dbError }),
    },
    version: "1.0.0-milestone1",
  });
}
