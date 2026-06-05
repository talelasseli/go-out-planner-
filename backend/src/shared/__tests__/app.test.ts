import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";

let app: any;

beforeAll(async () => {
  const mod = await import("../../app.js");
  app = mod.default;
});

describe("HTTP security headers", () => {
  it("sets X-Content-Type-Options: nosniff", async () => {
    const res = await request(app).get("/nonexistent-route");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("sets X-Frame-Options: DENY", async () => {
    const res = await request(app).get("/nonexistent-route");
    expect(res.headers["x-frame-options"]).toBe("DENY");
  });

  it("sets Referrer-Policy: strict-origin-when-cross-origin", async () => {
    const res = await request(app).get("/nonexistent-route");
    expect(res.headers["referrer-policy"]).toBe(
      "strict-origin-when-cross-origin",
    );
  });

  it("sets Content-Security-Policy with default-src 'none'", async () => {
    const res = await request(app).get("/nonexistent-route");
    const csp = res.headers["content-security-policy"];
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("base-uri 'none'");
    expect(csp).toContain("form-action 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it("does not set Strict-Transport-Security in development/test", async () => {
    const res = await request(app).get("/nonexistent-route");
    expect(res.headers["strict-transport-security"]).toBeUndefined();
  });
});
