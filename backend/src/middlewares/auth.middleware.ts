import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { AUTH_COOKIE_NAME } from "../utils/cookie";
import { verifyToken } from "../utils/jwt";
import { prisma } from "../config/db";

/**
 * Authentication Middleware:
 * Validates the HttpOnly session cookie, verifies the JWT signature,
 * queries the database for the active user, and attaches the user to req.user.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.[AUTH_COOKIE_NAME];

  if (!token) {
    res.status(401).json({ error: "Unauthorized: Please log in" });
    return;
  }

  try {
    const payload = verifyToken(token);

    // Fetch fresh user from PostgreSQL to verify existence, active status, and real-time role
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: "Unauthorized: User account no longer exists" });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: "Forbidden: Account has been disabled" });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Unauthorized: Invalid or expired session token" });
  }
}

/**
 * Role-Based Access Control Middleware:
 * Ensures the authenticated user possesses one of the authorized roles.
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized: Authentication required" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden: Insufficient permissions. Required one of: [${roles.join(", ")}], but your role is '${req.user.role}'`,
      });
      return;
    }

    next();
  };
}
