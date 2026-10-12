import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../config/db";
import { signToken } from "../utils/jwt";
import { setAuthCookie, clearAuthCookie } from "../utils/cookie";

const loginSchema = z.object({
  email: z.string().email("Invalid email address format"),
  password: z.string().min(1, "Password is required"),
});

export async function login(req: Request, res: Response): Promise<void> {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: "Validation error",
      details: parseResult.error.flatten().fieldErrors,
    });
    return;
  }

  const { email, password } = parseResult.data;

  // Search user in database
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Check if account exists and is active.
  // Use a generic error message to prevent user enumeration attacks.
  if (!user || !user.isActive) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  // Compare submitted plaintext password with stored bcrypt hash
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  // Generate short-lived signed JWT
  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // Issue HttpOnly session cookie
  setAuthCookie(res, token);

  // Return sanitized user profile (passwordHash is strictly excluded)
  res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  clearAuthCookie(res);
  res.status(200).json({ message: "Logged out successfully" });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  // req.user is guaranteed by authenticate middleware
  res.status(200).json({ user: req.user });
}

export async function adminTest(req: Request, res: Response): Promise<void> {
  // Disallow this diagnostic endpoint in production
  if (process.env.NODE_ENV === "production") {
    res.status(404).json({ error: "Route not found" });
    return;
  }

  res.status(200).json({
    message: "Admin authorization verified successfully",
    user: req.user,
  });
}
