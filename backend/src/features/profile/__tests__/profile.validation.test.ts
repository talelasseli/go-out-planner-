import { describe, it, expect } from "vitest";
import {
  updateProfileSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from "../profile.validation.js";

describe("updateProfileSchema", () => {
  it("accepts empty body (all optional)", () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts valid name", () => {
    const result = updateProfileSchema.safeParse({ name: "Alice" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Alice");
    }
  });

  it("trims whitespace from name", () => {
    const result = updateProfileSchema.safeParse({ name: "  Bob  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Bob");
    }
  });

  it("rejects name longer than 100 characters", () => {
    const result = updateProfileSchema.safeParse({ name: "x".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("accepts valid username", () => {
    const result = updateProfileSchema.safeParse({ username: "testuser" });
    expect(result.success).toBe(true);
  });

  it("rejects username shorter than 2 characters", () => {
    const result = updateProfileSchema.safeParse({ username: "a" });
    expect(result.success).toBe(false);
  });

  it("rejects username longer than 30 characters", () => {
    const result = updateProfileSchema.safeParse({
      username: "x".repeat(31),
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid bio", () => {
    const result = updateProfileSchema.safeParse({ bio: "Hello, I'm Alice!" });
    expect(result.success).toBe(true);
  });

  it("rejects bio longer than 500 characters", () => {
    const result = updateProfileSchema.safeParse({ bio: "x".repeat(501) });
    expect(result.success).toBe(false);
  });

  it("accepts valid location", () => {
    const result = updateProfileSchema.safeParse({
      location: { latitude: 51.5074, longitude: -0.1278 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects latitude below -90", () => {
    const result = updateProfileSchema.safeParse({
      location: { latitude: -91, longitude: 0 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects latitude above 90", () => {
    const result = updateProfileSchema.safeParse({
      location: { latitude: 91, longitude: 0 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects longitude below -180", () => {
    const result = updateProfileSchema.safeParse({
      location: { latitude: 0, longitude: -181 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects longitude above 180", () => {
    const result = updateProfileSchema.safeParse({
      location: { latitude: 0, longitude: 181 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects extra fields", () => {
    const result = updateProfileSchema.safeParse({
      name: "Alice",
      extra: "should not be here",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-object location", () => {
    const result = updateProfileSchema.safeParse({ location: "not-an-object" });
    expect(result.success).toBe(false);
  });

  it("rejects location missing latitude", () => {
    const result = updateProfileSchema.safeParse({
      location: { longitude: 0 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects location missing longitude", () => {
    const result = updateProfileSchema.safeParse({
      location: { latitude: 0 },
    });
    expect(result.success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("accepts valid password change", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "old-password",
      newPassword: "new-password-123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty currentPassword", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "",
      newPassword: "new-password-123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects newPassword shorter than 8 characters", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "old",
      newPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects newPassword longer than 128 characters", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "old",
      newPassword: "x".repeat(129),
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing currentPassword", () => {
    const result = changePasswordSchema.safeParse({
      newPassword: "new-password-123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing newPassword", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "old",
    });
    expect(result.success).toBe(false);
  });

  it("rejects extra fields", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "old",
      newPassword: "new-password-123",
      extra: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("deleteAccountSchema", () => {
  it("accepts valid delete request", () => {
    const result = deleteAccountSchema.safeParse({ password: "my-password" });
    expect(result.success).toBe(true);
  });

  it("rejects empty password", () => {
    const result = deleteAccountSchema.safeParse({ password: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing password", () => {
    const result = deleteAccountSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects extra fields", () => {
    const result = deleteAccountSchema.safeParse({
      password: "my-password",
      extra: true,
    });
    expect(result.success).toBe(false);
  });
});
