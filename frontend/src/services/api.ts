import type { HealthResponse, User, LoginCredentials, AuthResponse } from "../types/api";

const COMMON_HEADERS: HeadersInit = {
  "Content-Type": "application/json",
  "X-Requested-With": "XMLHttpRequest",
};

/**
 * Health check endpoint service
 */
export async function fetchHealthStatus(): Promise<HealthResponse> {
  const response = await fetch("/api/health");
  const data = await response.json();
  if (!response.ok && data.status !== "degraded") {
    throw new Error(data?.database?.error || `HTTP error ${response.status}`);
  }
  return data as HealthResponse;
}

/**
 * Authenticates user credentials with the backend API.
 * The backend sets an HttpOnly session cookie on success.
 */
export async function login(credentials: LoginCredentials): Promise<User> {
  let response: Response;
  try {
    response = await fetch("/api/auth/login", {
      method: "POST",
      headers: COMMON_HEADERS,
      credentials: "include",
      body: JSON.stringify(credentials),
    });
  } catch {
    throw new Error("Network error: Unable to reach authentication server. Please check your connection.");
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage = data?.error || (response.status === 401 ? "Invalid email or password" : "Login failed. Please try again.");
    throw new Error(errorMessage);
  }

  if (!data?.user) {
    throw new Error("Invalid response format received from authentication server.");
  }

  return data.user as User;
}

/**
 * Terminates the active session by clearing the HttpOnly cookie.
 */
export async function logout(): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: COMMON_HEADERS,
      credentials: "include",
    });
  } catch {
    throw new Error("Network error: Unable to reach logout service. Please try again.");
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || `Logout failed with status ${response.status}`);
  }
}

/**
 * Verifies if an authenticated session exists via the HttpOnly cookie.
 * Returns the active User if authenticated, null if unauthenticated (401),
 * or throws an Error if the server/network encounters an unexpected failure.
 */
export async function getCurrentUser(): Promise<User | null> {
  let response: Response;
  try {
    response = await fetch("/api/auth/me", {
      method: "GET",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
      credentials: "include",
    });
  } catch {
    throw new Error("Network error: Unable to verify session status. The server may be unreachable.");
  }

  // 401 means no active session exists (normal unauthenticated state)
  if (response.status === 401) {
    return null;
  }

  // Unexpected server error (e.g., 500 or 503) should NOT be treated as a clean logout
  if (!response.ok) {
    throw new Error(`Authentication server error (${response.status}). Please try again.`);
  }

  const data: AuthResponse = await response.json();
  return data.user;
}
