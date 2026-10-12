import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { App } from "../App";

describe("Categories Master Data Page Flow", () => {
  const seededCategories = [
    {
      id: "cat-1",
      code: "RAW-MAT",
      name: "Raw Materials",
      description: "Basic raw inputs",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "cat-2",
      code: "FINISHED",
      name: "Finished Goods",
      description: "Ready for shipment",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    window.history.pushState({}, "", "/categories");
  });

  it("1. Renders categories table with data for authenticated Inventory Manager", async () => {
    const inventoryUser = {
      id: "u-inv",
      email: "inventory@minierp.local",
      name: "Ian Inventory",
      role: "INVENTORY_MANAGER" as const,
    };

    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/auth/me")) {
        return new Response(JSON.stringify({ user: inventoryUser }), { status: 200 });
      }
      if (urlStr.includes("/api/categories")) {
        return new Response(
          JSON.stringify({
            categories: seededCategories,
            total: 2,
            page: 1,
            limit: 50,
            totalPages: 1,
          }),
          { status: 200 }
        );
      }
      return new Response("Not found", { status: 404 });
    });

    render(<App />);

    // Header and Action Button
    expect(await screen.findByRole("heading", { name: /Product Categories/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add Category/i })).toBeInTheDocument();

    // Table content
    expect(await screen.findByText("RAW-MAT")).toBeInTheDocument();
    expect(screen.getByText("Finished Goods")).toBeInTheDocument();
  });

  it("2. Hides 'Add Category' and action buttons for Sales Rep (Read-Only Mode)", async () => {
    const salesUser = {
      id: "u-sales",
      email: "sales@minierp.local",
      name: "Sally Sales",
      role: "SALES_REP" as const,
    };

    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/auth/me")) {
        return new Response(JSON.stringify({ user: salesUser }), { status: 200 });
      }
      if (urlStr.includes("/api/categories")) {
        return new Response(
          JSON.stringify({
            categories: seededCategories,
            total: 2,
            page: 1,
            limit: 50,
            totalPages: 1,
          }),
          { status: 200 }
        );
      }
      return new Response("Not found", { status: 404 });
    });

    render(<App />);

    expect(await screen.findByRole("heading", { name: /Product Categories/i })).toBeInTheDocument();
    // 'Add Category' button should not exist for Sales Rep
    expect(screen.queryByRole("button", { name: /Add Category/i })).not.toBeInTheDocument();
    // Read-only catalog is still viewable
    expect(await screen.findByText("RAW-MAT")).toBeInTheDocument();
  });

  it("3. Opens create modal and successfully creates a new category", async () => {
    const adminUser = {
      id: "u-admin",
      email: "admin@minierp.local",
      name: "Admin Alice",
      role: "ADMIN" as const,
    };

    const newCategory = {
      id: "cat-3",
      code: "METALS",
      name: "Precious Metals",
      description: "Industrial gold and copper",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/auth/me")) {
        return new Response(JSON.stringify({ user: adminUser }), { status: 200 });
      }
      if (urlStr.includes("/api/categories") && init?.method === "POST") {
        return new Response(JSON.stringify({ category: newCategory }), { status: 201 });
      }
      if (urlStr.includes("/api/categories")) {
        return new Response(
          JSON.stringify({
            categories: seededCategories,
            total: 2,
            page: 1,
            limit: 50,
            totalPages: 1,
          }),
          { status: 200 }
        );
      }
      return new Response("Not found", { status: 404 });
    });

    render(<App />);

    const addBtn = await screen.findByRole("button", { name: /Add Category/i });
    fireEvent.click(addBtn);

    // Modal should open
    expect(await screen.findByRole("heading", { name: /Create Product Category/i })).toBeInTheDocument();

    const codeInput = screen.getByLabelText(/Category Code/i);
    const nameInput = screen.getByLabelText(/Category Name/i);
    const descInput = screen.getByLabelText(/Description/i);
    const submitBtn = screen.getByRole("button", { name: /Create Category/i });

    fireEvent.change(codeInput, { target: { value: "METALS" } });
    fireEvent.change(nameInput, { target: { value: "Precious Metals" } });
    fireEvent.change(descInput, { target: { value: "Industrial gold and copper" } });
    fireEvent.click(submitBtn);

    // Modal should close and new category should appear in table
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: /Create Product Category/i })).not.toBeInTheDocument();
    });
    expect(screen.getByText("METALS")).toBeInTheDocument();
  });

  it("4. Displays conflict error alert when server returns duplicate category code error", async () => {
    const adminUser = {
      id: "u-admin",
      email: "admin@minierp.local",
      name: "Admin Alice",
      role: "ADMIN" as const,
    };

    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/auth/me")) {
        return new Response(JSON.stringify({ user: adminUser }), { status: 200 });
      }
      if (urlStr.includes("/api/categories") && init?.method === "POST") {
        return new Response(
          JSON.stringify({ error: "Category with code 'RAW-MAT' already exists." }),
          { status: 409 }
        );
      }
      if (urlStr.includes("/api/categories")) {
        return new Response(
          JSON.stringify({
            categories: seededCategories,
            total: 2,
            page: 1,
            limit: 50,
            totalPages: 1,
          }),
          { status: 200 }
        );
      }
      return new Response("Not found", { status: 404 });
    });

    render(<App />);

    const addBtn = await screen.findByRole("button", { name: /Add Category/i });
    fireEvent.click(addBtn);

    const codeInput = await screen.findByLabelText(/Category Code/i);
    const nameInput = screen.getByLabelText(/Category Name/i);
    const submitBtn = screen.getByRole("button", { name: /Create Category/i });

    fireEvent.change(codeInput, { target: { value: "RAW-MAT" } });
    fireEvent.change(nameInput, { target: { value: "Duplicate Raw Materials" } });
    fireEvent.click(submitBtn);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/already exists/i);
  });
});
