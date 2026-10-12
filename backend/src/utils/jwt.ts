import jwt from "jsonwebtoken";
import { TokenPayload } from "../types/auth.types";

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("FATAL: JWT_SECRET must be configured with at least 16 characters in environment variables.");
  }
  return secret;
};

const TOKEN_EXPIRY = "1h";

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, getJwtSecret()) as TokenPayload;
}
