import assert from "node:assert";

const BASE_URL = "http://localhost:5000";

function extractAuthCookie(setCookieHeader: string | null): string {
  if (!setCookieHeader) return "";
  const match = setCookieHeader.match(/minierp_token=([^;]+)/);
  return match ? `minierp_token=${match[1]}` : "";
}

async function loginUser(email: string, pass: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "http://localhost:5173",
      "X-Requested-With": "XMLHttpRequest",
    },
    body: JSON.stringify({ email, password: pass }),
  });
  assert.strictEqual(res.status, 200, `Failed to login as ${email}`);
  return extractAuthCookie(res.headers.get("set-cookie"));
}

async function runCategoryTests() {
  console.log("==================================================");
  console.log(" Running Milestone 3 Category API Tests          ");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`FAIL: ${name}`);
      console.error(err);
      failed++;
    }
  }

  const inventoryCookie = await loginUser("inventory@minierp.local", "Inv123!");
  const salesCookie = await loginUser("sales@minierp.local", "Sales123!");
  const adminCookie = await loginUser("admin@minierp.local", "Admin123!");

  // 1. Unauthenticated rejection
  await test("1. Unauthenticated request to GET /api/categories returns 401", async () => {
    const res = await fetch(`${BASE_URL}/api/categories`);
    assert.strictEqual(res.status, 401);
  });

  // 2. Sales rep read access
  await test("2. Sales Rep can view categories (receives seeded categories)", async () => {
    const res = await fetch(`${BASE_URL}/api/categories`, {
      headers: { Cookie: salesCookie },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.categories), "Expected categories array");
    assert.ok(data.total >= 4, "Expected at least 4 seeded categories");
  });

  // 3. Sales rep forbidden from mutating
  await test("3. Sales Rep receives 403 Forbidden when creating category", async () => {
    const res = await fetch(`${BASE_URL}/api/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": salesCookie,
        "Origin": "http://localhost:5173",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({
        code: "TEST-SALES",
        name: "Forbidden Category",
      }),
    });
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.ok(data.error.includes("Insufficient permissions"));
  });

  // 4. Inventory manager can create category
  let createdCategoryId = "";
  const testCode = `TEST-${Date.now().toString().slice(-4)}`;
  await test("4. Inventory Manager can create category", async () => {
    const res = await fetch(`${BASE_URL}/api/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": inventoryCookie,
        "Origin": "http://localhost:5173",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({
        code: testCode,
        name: "Test Packaging Consumables",
        description: "Temporary testing category",
        isActive: true,
      }),
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.strictEqual(data.category.code, testCode);
    assert.strictEqual(data.category.name, "Test Packaging Consumables");
    createdCategoryId = data.category.id;
  });

  // 5. Duplicate code conflict
  await test("5. Creating category with existing code returns 409 Conflict", async () => {
    const res = await fetch(`${BASE_URL}/api/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": inventoryCookie,
        "Origin": "http://localhost:5173",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({
        code: testCode,
        name: "Duplicate Attempt",
      }),
    });
    assert.strictEqual(res.status, 409);
    const data = await res.json();
    assert.ok(data.error.includes("already exists"));
  });

  // 6. Validation error for malformed input
  await test("6. Invalid code format returns 400 Bad Request with field error", async () => {
    const res = await fetch(`${BASE_URL}/api/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": inventoryCookie,
        "Origin": "http://localhost:5173",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({
        code: "X", // Too short (min 2)
        name: "",  // Empty
      }),
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.error, "Validation error");
    assert.ok(data.details.code, "Expected code validation detail");
  });

  // 7. Inventory Manager can update category
  await test("7. Inventory Manager can update category details", async () => {
    const res = await fetch(`${BASE_URL}/api/categories/${createdCategoryId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Cookie": inventoryCookie,
        "Origin": "http://localhost:5173",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({
        name: "Updated Packaging Consumables",
        description: "Updated description notes",
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.category.name, "Updated Packaging Consumables");
  });

  // 8. Soft-deactivation audit verification
  await test("8. Deleting category deactivates it (isActive=false) rather than hard-deleting", async () => {
    // Perform deactivation request
    const deleteRes = await fetch(`${BASE_URL}/api/categories/${createdCategoryId}`, {
      method: "DELETE",
      headers: {
        "Cookie": adminCookie,
        "Origin": "http://localhost:5173",
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    assert.strictEqual(deleteRes.status, 200);
    const deleteData = await deleteRes.json();
    assert.strictEqual(deleteData.category.isActive, false, "Category isActive must be false after deletion request");

    // A. Verify the category STILL exists in the database by ID (HTTP 200, not 404!)
    const getByIdRes = await fetch(`${BASE_URL}/api/categories/${createdCategoryId}`, {
      headers: { Cookie: adminCookie },
    });
    assert.strictEqual(getByIdRes.status, 200, "Record must still exist in PostgreSQL");
    const getByIdData = await getByIdRes.json();
    assert.strictEqual(getByIdData.category.id, createdCategoryId);
    assert.strictEqual(getByIdData.category.isActive, false);

    // B. Verify it is ABSENT from the active-only list (?status=active)
    const activeListRes = await fetch(`${BASE_URL}/api/categories?status=active`, {
      headers: { Cookie: adminCookie },
    });
    assert.strictEqual(activeListRes.status, 200);
    const activeListData = await activeListRes.json();
    const foundInActive = activeListData.categories.some((c: { id: string }) => c.id === createdCategoryId);
    assert.strictEqual(foundInActive, false, "Deactivated category must NOT appear in active-only list");

    // C. Verify it is PRESENT in the inactive list (?status=inactive)
    const inactiveListRes = await fetch(`${BASE_URL}/api/categories?status=inactive`, {
      headers: { Cookie: adminCookie },
    });
    assert.strictEqual(inactiveListRes.status, 200);
    const inactiveListData = await inactiveListRes.json();
    const foundInInactive = inactiveListData.categories.some((c: { id: string }) => c.id === createdCategoryId);
    assert.strictEqual(foundInInactive, true, "Deactivated category MUST appear in inactive list");

    // D. Verify it is PRESENT when requesting all categories (?status=all)
    const allListRes = await fetch(`${BASE_URL}/api/categories?status=all`, {
      headers: { Cookie: adminCookie },
    });
    assert.strictEqual(allListRes.status, 200);
    const allListData = await allListRes.json();
    const foundInAll = allListData.categories.find((c: { id: string }) => c.id === createdCategoryId);
    assert.ok(foundInAll, "Deactivated category MUST appear in all categories list");
    assert.strictEqual(foundInAll.isActive, false);
  });

  // 9. Existing Health Endpoint Check
  await test("9. Health check remains online and database connected", async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, "ok");
    assert.strictEqual(data.database.status, "connected");
  });

  console.log("==================================================");
  console.log(` Category Tests: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runCategoryTests().catch((e) => {
  console.error("Test runner failed:", e);
  process.exit(1);
});
