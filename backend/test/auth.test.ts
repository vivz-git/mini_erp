import assert from "node:assert";

const BASE_URL = "http://localhost:5000";

// Helper function to extract cookie from Set-Cookie header
function extractAuthCookie(setCookieHeader: string | null): string {
  if (!setCookieHeader) return "";
  const match = setCookieHeader.match(/minierp_token=([^;]+)/);
  return match ? `minierp_token=${match[1]}` : "";
}

async function runTests() {
  console.log("==================================================");
  console.log(" Running Milestone 2 Backend Authentication Tests ");
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

  // 1. Existing Health Endpoint Verification
  await test("1. Existing GET /api/health remains public and operational", async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, "ok");
    assert.strictEqual(data.database.status, "connected");
  });

  // 2. Invalid Credentials Check
  await test("2. Invalid login credentials return generic 401 error", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "http://localhost:5173",
      },
      body: JSON.stringify({
        email: "admin@minierp.local",
        password: "WrongPassword999!",
      }),
    });
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.error, "Invalid email or password");
  });

  // 3. Valid Login Success & Cookie Inspection
  let adminCookie = "";
  await test("3. Valid admin login succeeds, sets HttpOnly cookie, and omits passwordHash", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "http://localhost:5173",
      },
      body: JSON.stringify({
        email: "admin@minierp.local",
        password: "Admin123!",
      }),
    });
    assert.strictEqual(res.status, 200);
    const setCookie = res.headers.get("set-cookie");
    assert.ok(setCookie, "Set-Cookie header must be present");
    assert.ok(setCookie.includes("HttpOnly"), "Cookie must have HttpOnly flag");
    assert.ok(setCookie.includes("SameSite=Lax"), "Cookie must have SameSite=Lax flag");

    adminCookie = extractAuthCookie(setCookie);
    assert.ok(adminCookie.length > 0, "Token cookie string must be extracted");

    const data = await res.json();
    assert.strictEqual(data.user.email, "admin@minierp.local");
    assert.strictEqual(data.user.role, "ADMIN");
    assert.strictEqual(data.user.passwordHash, undefined, "passwordHash must NEVER be exposed");
  });

  // 4. Unauthenticated Access Rejection
  await test("4. Unauthenticated request to GET /api/auth/me returns 401", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`);
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.ok(data.error.includes("Unauthorized"));
  });

  // 5. Authenticated Session Retrieval
  await test("5. Authenticated GET /api/auth/me returns current user profile", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: adminCookie },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.user.email, "admin@minierp.local");
    assert.strictEqual(data.user.role, "ADMIN");
    assert.strictEqual(data.user.passwordHash, undefined);
  });

  // 6. Role-Based Access Control: Admin Allowed
  await test("6. Admin user receives 200 from GET /api/auth/admin-test", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/admin-test`, {
      headers: { Cookie: adminCookie },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.message.includes("Admin authorization verified"));
  });

  // 7. Role-Based Access Control: Sales Rep Forbidden
  let salesCookie = "";
  await test("7. Sales Rep login succeeds, but receives 403 Forbidden from admin-only endpoint", async () => {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "http://localhost:5173",
      },
      body: JSON.stringify({
        email: "sales@minierp.local",
        password: "Sales123!",
      }),
    });
    assert.strictEqual(loginRes.status, 200);
    salesCookie = extractAuthCookie(loginRes.headers.get("set-cookie"));

    // Attempt to access admin-only endpoint
    const forbiddenRes = await fetch(`${BASE_URL}/api/auth/admin-test`, {
      headers: { Cookie: salesCookie },
    });
    assert.strictEqual(forbiddenRes.status, 403, "Sales Rep must receive 403 Forbidden");
    const forbiddenData = await forbiddenRes.json();
    assert.ok(forbiddenData.error.includes("Insufficient permissions"));
  });

  // 8. Disabled User Account Rejection
  await test("8. Disabled user cannot login (generic 401)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "http://localhost:5173",
      },
      body: JSON.stringify({
        email: "disabled@minierp.local",
        password: "Disabled123!",
      }),
    });
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.error, "Invalid email or password");
  });

  // 9. CSRF Verification
  await test("9. Mutating request with mismatched untrusted origin returns 403 Forbidden", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "http://malicious-site.com",
      },
      body: JSON.stringify({
        email: "admin@minierp.local",
        password: "Admin123!",
      }),
    });
    assert.strictEqual(res.status, 403);
    const data = await res.json();
    assert.ok(data.error.includes("Forbidden: Cross-site request rejected"));
  });

  // 10. Logout Clears Cookie
  await test("10. Logout clears the auth cookie and invalidates session", async () => {
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        Cookie: adminCookie,
        Origin: "http://localhost:5173",
      },
    });
    assert.strictEqual(logoutRes.status, 200);
    const setCookie = logoutRes.headers.get("set-cookie");
    assert.ok(setCookie, "Set-Cookie header must be present on logout");
    assert.ok(
      setCookie.includes("minierp_token=;") || setCookie.includes("Expires="),
      "Cookie must be invalidated"
    );

    // After clearing the cookie, verify accessing /api/auth/me without valid cookie is rejected
    const unauthRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: "minierp_token=invalid_cleared_token" },
    });
    assert.strictEqual(unauthRes.status, 401);
  });

  console.log("==================================================");
  console.log(` Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Test runner failed:", e);
  process.exit(1);
});
