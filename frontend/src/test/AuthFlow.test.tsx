import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { App } from "../App";

describe("Frontend Authentication Flow", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.history.pushState({}, "", "/");
  });

  it("1. Renders the accessible login form when unauthenticated", async () => {
    // Mock GET /api/auth/me to return 401 (unauthenticated)
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/auth/me")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
      }
      return new Response("Not found", { status: 404 });
    });

    render(<App />);

    // Should redirect from / to /login and render accessible inputs
    expect(await screen.findByRole("heading", { name: /MiniERP Sign In/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign In to MiniERP/i })).toBeInTheDocument();
  });

  it("2. Shows loading state during initial session verification", () => {
    // Mock fetch that hangs to inspect loading state
    vi.spyOn(globalThis, "fetch").mockImplementation(() => new Promise(() => {}));

    render(<App />);

    expect(screen.getByText(/Verifying active session.../i)).toBeInTheDocument();
  });

  it("3. Displays recoverable error when session bootstrap encounters a server failure", async () => {
    // Mock GET /api/auth/me to return 500 Internal Server Error
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/auth/me")) {
        return new Response(JSON.stringify({ error: "Server down" }), { status: 500 });
      }
      return new Response("Not found", { status: 404 });
    });

    render(<App />);

    expect(await screen.findByRole("heading", { name: /Connection Issue/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Retry Connection/i })).toBeInTheDocument();
  });

  it("4. Displays generic error banner on invalid login credentials", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/auth/me")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
      }
      if (urlStr.includes("/api/auth/login") && init?.method === "POST") {
        return new Response(JSON.stringify({ error: "Invalid email or password" }), { status: 401 });
      }
      return new Response("Not found", { status: 404 });
    });

    render(<App />);

    const emailInput = await screen.findByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitBtn = screen.getByRole("button", { name: /Sign In to MiniERP/i });

    fireEvent.change(emailInput, { target: { value: "admin@minierp.local" } });
    fireEvent.change(passwordInput, { target: { value: "WrongPassword!" } });
    fireEvent.click(submitBtn);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/Invalid email or password/i);
    // Form remains enabled for another attempt
    expect(emailInput).not.toBeDisabled();
  });

  it("5. Successfully logs in, redirects to dashboard, and renders user profile & role", async () => {
    const mockUser = {
      id: "u-1",
      email: "admin@minierp.local",
      name: "Admin Alice",
      role: "ADMIN" as const,
    };

    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/auth/me")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
      }
      if (urlStr.includes("/api/auth/login") && init?.method === "POST") {
        return new Response(JSON.stringify({ user: mockUser }), { status: 200 });
      }
      if (urlStr.includes("/api/health")) {
        return new Response(
          JSON.stringify({
            status: "ok",
            uptimeSeconds: 10,
            timestamp: new Date().toISOString(),
            database: { status: "connected", latencyMs: 5 },
            version: "1.0.0",
          }),
          { status: 200 }
        );
      }
      return new Response("Not found", { status: 404 });
    });

    render(<App />);

    const emailInput = await screen.findByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitBtn = screen.getByRole("button", { name: /Sign In to MiniERP/i });

    fireEvent.change(emailInput, { target: { value: "admin@minierp.local" } });
    fireEvent.change(passwordInput, { target: { value: "Admin123!" } });
    fireEvent.click(submitBtn);

    // Dashboard should now render
    expect(await screen.findByText("Admin Alice")).toBeInTheDocument();
    expect(screen.getAllByText("ADMIN").length).toBeGreaterThan(0);
    expect(screen.getByText("System Health")).toBeInTheDocument();
  });

  it("6. Successfully logs out, clears user state, and redirects to /login", async () => {
    const mockUser = {
      id: "u-1",
      email: "sales@minierp.local",
      name: "Sally Sales",
      role: "SALES_REP" as const,
    };

    let sessionActive = true;

    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/auth/me")) {
        if (sessionActive) {
          return new Response(JSON.stringify({ user: mockUser }), { status: 200 });
        }
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
      }
      if (urlStr.includes("/api/auth/logout") && init?.method === "POST") {
        sessionActive = false;
        return new Response(JSON.stringify({ message: "Logged out successfully" }), { status: 200 });
      }
      if (urlStr.includes("/api/health")) {
        return new Response(
          JSON.stringify({
            status: "ok",
            uptimeSeconds: 10,
            timestamp: new Date().toISOString(),
            database: { status: "connected", latencyMs: 5 },
            version: "1.0.0",
          }),
          { status: 200 }
        );
      }
      return new Response("Not found", { status: 404 });
    });

    render(<App />);

    // Renders authenticated dashboard initially
    expect(await screen.findByText("Sally Sales")).toBeInTheDocument();

    const logoutBtn = screen.getByRole("button", { name: /Sign out/i });
    fireEvent.click(logoutBtn);

    // After logout, redirects back to /login
    expect(await screen.findByRole("heading", { name: /MiniERP Sign In/i })).toBeInTheDocument();
  });

  it("7. Handles logout failure gracefully without claiming session ended", async () => {
    const mockUser = {
      id: "u-1",
      email: "admin@minierp.local",
      name: "Admin Alice",
      role: "ADMIN" as const,
    };

    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/auth/me")) {
        return new Response(JSON.stringify({ user: mockUser }), { status: 200 });
      }
      if (urlStr.includes("/api/auth/logout") && init?.method === "POST") {
        return new Response(JSON.stringify({ error: "Server error during logout" }), { status: 500 });
      }
      if (urlStr.includes("/api/health")) {
        return new Response(
          JSON.stringify({
            status: "ok",
            uptimeSeconds: 10,
            timestamp: new Date().toISOString(),
            database: { status: "connected", latencyMs: 5 },
            version: "1.0.0",
          }),
          { status: 200 }
        );
      }
      return new Response("Not found", { status: 404 });
    });

    render(<App />);

    expect(await screen.findByText("Admin Alice")).toBeInTheDocument();

    const logoutBtn = screen.getByRole("button", { name: /Sign out/i });
    fireEvent.click(logoutBtn);

    // Should display error and remain on the dashboard
    expect(await screen.findByRole("alert")).toHaveTextContent(/Server error during logout/i);
    expect(screen.getByText("Admin Alice")).toBeInTheDocument();
  });
});
