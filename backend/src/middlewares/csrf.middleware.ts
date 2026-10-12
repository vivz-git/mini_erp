import { Request, Response, NextFunction } from "express";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * CSRF Protection Middleware for cookie-based authentication.
 * Verifies that state-changing requests originate from the trusted frontend application.
 */
export function verifyCsrfOrigin(req: Request, res: Response, next: NextFunction): void {
  // Safe HTTP methods (GET, HEAD, OPTIONS) do not alter server state
  if (!MUTATING_METHODS.has(req.method)) {
    return next();
  }

  const allowedOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  // If origin header is present, verify against allowedOrigin
  if (origin) {
    if (origin !== allowedOrigin) {
      res.status(403).json({ error: "Forbidden: Cross-site request rejected (Origin mismatch)" });
      return;
    }
    return next();
  }

  // If origin is not present, check referer header
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (refererOrigin !== allowedOrigin) {
        res.status(403).json({ error: "Forbidden: Cross-site request rejected (Referer mismatch)" });
        return;
      }
      return next();
    } catch {
      res.status(403).json({ error: "Forbidden: Invalid referer header" });
      return;
    }
  }

  // If neither origin nor referer is provided (e.g., automated API test tools),
  // require a custom application header which browsers never send cross-origin without CORS preflight
  const customHeader = req.headers["x-requested-with"] || req.headers["x-minierp-request"];
  if (customHeader) {
    return next();
  }

  // If neither origin, referer, nor custom header is present on a mutating endpoint:
  // In development, allow if test environment; otherwise reject for safety
  if (process.env.NODE_ENV === "test" || !process.env.NODE_ENV) {
    return next();
  }

  res.status(403).json({ error: "Forbidden: Missing CSRF verification headers" });
}
