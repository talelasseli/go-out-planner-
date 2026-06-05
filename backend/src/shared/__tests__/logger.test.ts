import { describe, it, expect } from "vitest";
import { safeError, redact } from "../logger.js";

describe("redact", () => {
  it("redacts keys containing 'password'", () => {
    const result = redact({ password: "secret123" });
    expect(result.password).toBe("[REDACTED]");
  });

  it("redacts keys containing 'token'", () => {
    const result = redact({ access_token: "abc" });
    expect(result.access_token).toBe("[REDACTED]");
  });

  it("redacts keys containing 'secret'", () => {
    const result = redact({ client_secret: "xyz" });
    expect(result.client_secret).toBe("[REDACTED]");
  });

  it("redacts keys containing 'authorization'", () => {
    const result = redact({ authorization: "Bearer xxx" });
    expect(result.authorization).toBe("[REDACTED]");
  });

  it("redacts keys containing 'session'", () => {
    const result = redact({ session_id: "sess_123" });
    expect(result.session_id).toBe("[REDACTED]");
  });

  it("redacts keys containing 'oauth'", () => {
    const result = redact({ oauth_token: "oauth_abc" });
    expect(result.oauth_token).toBe("[REDACTED]");
  });

  it("redacts keys containing 'database_url'", () => {
    const result = redact({ DATABASE_URL: "postgresql://user:pass@host/db" });
    expect(result.DATABASE_URL).toBe("[REDACTED]");
  });

  it("redacts keys containing 'cookie'", () => {
    const result = redact({ cookie: "connect.sid=s%3A..." });
    expect(result.cookie).toBe("[REDACTED]");
  });

  it("is case-insensitive", () => {
    const result = redact({ PASSWORD: "x", TOKEN: "y", Secret: "z" });
    expect(result.PASSWORD).toBe("[REDACTED]");
    expect(result.TOKEN).toBe("[REDACTED]");
    expect(result.Secret).toBe("[REDACTED]");
  });

  it("preserves non-sensitive keys", () => {
    const result = redact({ name: "Alice", username: "alice" });
    expect(result.name).toBe("Alice");
    expect(result.username).toBe("alice");
  });

  it("redacts nested sensitive keys", () => {
    const result = redact({
      user: { password: "secret", name: "Alice" },
    });
    expect((result.user as any).password).toBe("[REDACTED]");
    expect((result.user as any).name).toBe("Alice");
  });

  it("handles circular references without crashing", () => {
    const obj: Record<string, unknown> = { name: "test" };
    obj.self = obj;
    expect(() => redact(obj)).not.toThrow();
    expect((redact(obj) as any).self).toBe("[CIRCULAR]");
  });

  it("handles null and undefined values", () => {
    expect(() => redact({ a: null, b: undefined })).not.toThrow();
  });

  it("handles arrays of objects", () => {
    const result = redact({
      items: [{ password: "x", name: "A" }],
    });
    expect((result.items as any[])[0].password).toBe("[REDACTED]");
    expect((result.items as any[])[0].name).toBe("A");
  });
});

describe("safeError", () => {
  it("exists and does not crash", () => {
    expect(typeof safeError).toBe("function");
    expect(() => safeError(new Error("test"))).not.toThrow();
  });

  it("handles non-Error values (string)", () => {
    expect(() => safeError("some string error")).not.toThrow();
  });

  it("handles non-Error values (null)", () => {
    expect(() => safeError(null)).not.toThrow();
  });

  it("handles non-Error values (undefined)", () => {
    expect(() => safeError(undefined)).not.toThrow();
  });

  it("handles non-Error values (object)", () => {
    expect(() => safeError({ custom: "error" })).not.toThrow();
  });

  it("handles context with sensitive fields", () => {
    expect(() =>
      safeError(new Error("test"), {
        route: "/api/test",
        method: "POST",
        password: "secret123",
      }),
    ).not.toThrow();
  });
});
