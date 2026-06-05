import { describe, it, expect } from "vitest";
import { validate } from "../env.js";

const validDev = {
  NODE_ENV: "development",
  DATABASE_URL: "postgresql://user:pass@localhost:5432/gooutplanner",
  BETTER_AUTH_SECRET: "abcdefghijklmnopqrstuvwxyz0123456789",
  BETTER_AUTH_URL: "http://localhost:4000",
  GOOGLE_CLIENT_ID: "my-client-id",
  GOOGLE_CLIENT_SECRET: "my-client-secret",
  CORS_ORIGIN: "http://localhost:5173",
  TRUSTED_ORIGINS: "http://localhost:5173",
  PORT: "4000",
};

describe("env validation", () => {
  it("accepts a valid development config", () => {
    const result = validate(validDev);
    expect(result.NODE_ENV).toBe("development");
    expect(result.PORT).toBe(4000);
  });

  it("rejects missing DATABASE_URL", () => {
    const { DATABASE_URL: _, ...rest } = validDev;
    expect(() => validate(rest)).toThrow();
  });

  it("rejects missing BETTER_AUTH_SECRET", () => {
    const { BETTER_AUTH_SECRET: _, ...rest } = validDev;
    expect(() => validate(rest)).toThrow();
  });

  it("rejects short BETTER_AUTH_SECRET (less than 32 chars)", () => {
    expect(() =>
      validate({ ...validDev, BETTER_AUTH_SECRET: "short" })
    ).toThrow();
  });

  it("rejects missing GOOGLE_CLIENT_ID", () => {
    const { GOOGLE_CLIENT_ID: _, ...rest } = validDev;
    expect(() => validate(rest)).toThrow();
  });

  it("rejects missing GOOGLE_CLIENT_SECRET", () => {
    const { GOOGLE_CLIENT_SECRET: _, ...rest } = validDev;
    expect(() => validate(rest)).toThrow();
  });

  it("rejects missing CORS_ORIGIN", () => {
    const { CORS_ORIGIN: _, ...rest } = validDev;
    expect(() => validate(rest)).toThrow();
  });

  it("rejects missing TRUSTED_ORIGINS", () => {
    const { TRUSTED_ORIGINS: _, ...rest } = validDev;
    expect(() => validate(rest)).toThrow();
  });

  it("rejects missing BETTER_AUTH_URL", () => {
    const { BETTER_AUTH_URL: _, ...rest } = validDev;
    expect(() => validate(rest)).toThrow();
  });

  it("accepts missing PORT (has default 4000)", () => {
    const { PORT: _, ...rest } = validDev;
    const result = validate(rest);
    expect(result.PORT).toBe(4000);
  });

  it("accepts missing NODE_ENV (defaults to development)", () => {
    const { NODE_ENV: _, ...rest } = validDev;
    const result = validate(rest);
    expect(result.NODE_ENV).toBe("development");
  });
});

describe("production environment guard", () => {
  const validProd = {
    ...validDev,
    NODE_ENV: "production",
    BETTER_AUTH_URL: "https://api.myapp.com",
    CORS_ORIGIN: "https://myapp.com",
    TRUSTED_ORIGINS: "https://myapp.com",
  };

  it("accepts a valid production config", () => {
    const result = validate(validProd);
    expect(result.NODE_ENV).toBe("production");
  });

  it("rejects localhost BETTER_AUTH_URL in production", () => {
    expect(() =>
      validate({ ...validProd, BETTER_AUTH_URL: "http://localhost:4000" })
    ).toThrow(/BETTER_AUTH_URL/);
  });

  it("rejects localhost CORS_ORIGIN in production", () => {
    expect(() =>
      validate({ ...validProd, CORS_ORIGIN: "http://localhost:5173" })
    ).toThrow(/CORS_ORIGIN/);
  });

  it("rejects localhost TRUSTED_ORIGINS in production", () => {
    expect(() =>
      validate({ ...validProd, TRUSTED_ORIGINS: "http://localhost:5173" })
    ).toThrow(/TRUSTED_ORIGINS/);
  });
});

describe("origin list parsing", () => {
  const base = { ...validDev };

  it("parses comma-separated CORS_ORIGIN", () => {
    const result = validate({
      ...base,
      CORS_ORIGIN: "http://localhost:5173,https://myapp.com",
    });
    expect(result.corsOriginList).toEqual([
      "http://localhost:5173",
      "https://myapp.com",
    ]);
  });

  it("parses comma-separated TRUSTED_ORIGINS", () => {
    const result = validate({
      ...base,
      TRUSTED_ORIGINS: "http://a.com,https://b.com",
    });
    expect(result.trustedOriginList).toEqual([
      "http://a.com",
      "https://b.com",
    ]);
  });

  it("parses single origin", () => {
    const result = validate({
      ...base,
      CORS_ORIGIN: "https://example.com",
      TRUSTED_ORIGINS: "https://example.com",
    });
    expect(result.corsOriginList).toEqual(["https://example.com"]);
    expect(result.trustedOriginList).toEqual(["https://example.com"]);
  });

  it("trims whitespace from origins", () => {
    const result = validate({
      ...base,
      CORS_ORIGIN: "  http://a.com , https://b.com  ",
    });
    expect(result.corsOriginList).toEqual([
      "http://a.com",
      "https://b.com",
    ]);
  });

  it("rejects wildcard CORS origin", () => {
    expect(() =>
      validate({ ...base, CORS_ORIGIN: "*" })
    ).toThrow(/wildcard/i);
  });

  it("rejects wildcard in comma-separated origins", () => {
    expect(() =>
      validate({
        ...base,
        CORS_ORIGIN: "https://a.com,*",
      })
    ).toThrow(/wildcard/i);
  });

  it("rejects empty origin list", () => {
    expect(() =>
      validate({ ...base, CORS_ORIGIN: "" })
    ).toThrow();
  });

  it("rejects invalid URL origins", () => {
    expect(() =>
      validate({ ...base, CORS_ORIGIN: "not-a-url" })
    ).toThrow(/Invalid origin/);
  });

  it("rejects origin with only whitespace", () => {
    expect(() =>
      validate({ ...base, CORS_ORIGIN: "https://a.com, ,https://b.com" })
    ).toThrow(/Empty origin/);
  });
});

describe("PORT validation", () => {
  it("rejects non-numeric PORT", () => {
    expect(() =>
      validate({ ...validDev, PORT: "not-a-number" })
    ).toThrow();
  });

  it("rejects zero PORT", () => {
    expect(() => validate({ ...validDev, PORT: "0" })).toThrow();
  });

  it("rejects negative PORT", () => {
    expect(() => validate({ ...validDev, PORT: "-1" })).toThrow();
  });
});
