import { describe, it, expect } from "vitest";
import { searchUsersSchema } from "../friends.validation.js";

describe("searchUsersSchema", () => {
  it("rejects query shorter than 2 characters", () => {
    const result = searchUsersSchema.safeParse({ query: "a" });
    expect(result.success).toBe(false);
  });

  it("rejects query longer than 50 characters", () => {
    const result = searchUsersSchema.safeParse({
      query: "x".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid query between 2 and 50 characters", () => {
    const result = searchUsersSchema.safeParse({ query: "Alice" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query).toBe("Alice");
    }
  });

  it("trims whitespace from the query", () => {
    const result = searchUsersSchema.safeParse({ query: "  Bob  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query).toBe("Bob");
    }
  });

  it("rejects empty string after trimming", () => {
    const result = searchUsersSchema.safeParse({ query: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects missing query field", () => {
    const result = searchUsersSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects extra fields", () => {
    const result = searchUsersSchema.safeParse({
      query: "test",
      extra: true,
    });
    expect(result.success).toBe(false);
  });
});
