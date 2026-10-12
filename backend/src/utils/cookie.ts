import { Response } from "express";

export const AUTH_COOKIE_NAME = "minierp_token";
const ONE_HOUR_MS = 60 * 60 * 1000;

export function setAuthCookie(res: Response, token: string): void {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: ONE_HOUR_MS,
    path: "/",
  });
}

export function clearAuthCookie(res: Response): void {
  const isProduction = process.env.NODE_ENV === "production";

  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });
}
