import { Router } from "express";
import rateLimit from "express-rate-limit";
import { Role } from "@prisma/client";
import { login, logout, getMe, adminTest } from "../controllers/auth.controller";
import { authenticate, requireRole } from "../middlewares/auth.middleware";
import { verifyCsrfOrigin } from "../middlewares/csrf.middleware";

const router = Router();

// Rate limiting to mitigate brute-force password guessing
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again after 15 minutes." },
});

// Authentication endpoints
router.post("/login", verifyCsrfOrigin, loginRateLimiter, login);
router.post("/logout", verifyCsrfOrigin, logout);
router.get("/me", authenticate, getMe);

// Diagnostic RBAC test endpoint (development/test only)
router.get("/admin-test", authenticate, requireRole(Role.ADMIN), adminTest);

export default router;
