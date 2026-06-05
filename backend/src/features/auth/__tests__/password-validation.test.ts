import { describe, it, expect } from "vitest";
import { validatePasswordStrength } from "../password-validation.js";

describe("validatePasswordStrength", () => {
  it("rejects short password", () => {
    expect(validatePasswordStrength("abc")).toBe(
      "Password must be at least 8 characters",
    );
  });

  it("rejects empty password", () => {
    expect(validatePasswordStrength("")).toBe("Password is required");
  });

  it("rejects whitespace-only password", () => {
    const eightSpaces = "        ";
    expect(validatePasswordStrength(eightSpaces)).toBe(
      "Password cannot be only whitespace",
    );
  });

  it.each(["password", "PASSWORD"])(
    "rejects common weak password: '%s'",
    (pw) => {
      expect(validatePasswordStrength(pw)).toBe(
        "Password is too common. Choose a stronger password.",
      );
    },
  );

  it.each(["password123", "Password123"])(
    "rejects common weak password: '%s'",
    (pw) => {
      expect(validatePasswordStrength(pw)).toBe(
        "Password is too common. Choose a stronger password.",
      );
    },
  );

  it("rejects '12345678'", () => {
    expect(validatePasswordStrength("12345678")).toBe(
      "Password is too common. Choose a stronger password.",
    );
  });

  it("rejects 'qwerty123'", () => {
    expect(validatePasswordStrength("qwerty123")).toBe(
      "Password is too common. Choose a stronger password.",
    );
  });

  it("accepts a strong password", () => {
    expect(
      validatePasswordStrength("CorrectHorseBatteryStaple!42"),
    ).toBeNull();
  });

  it("rejects non-string input (undefined)", () => {
    expect(validatePasswordStrength(undefined)).toBe("Password is required");
  });

  it("rejects non-string input (null)", () => {
    expect(validatePasswordStrength(null)).toBe("Password is required");
  });
});
