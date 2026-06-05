const COMMON_WEAK_PASSWORDS = [
  "password",
  "password123",
  "12345678",
  "qwerty123",
];

export function validatePasswordStrength(password: unknown): string | null {
  if (typeof password !== "string" || password.length === 0) {
    return "Password is required";
  }

  if (password.trim().length === 0) {
    return "Password cannot be only whitespace";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }

  if (password.length > 128) {
    return "Password must be at most 128 characters";
  }

  if (COMMON_WEAK_PASSWORDS.includes(password.toLowerCase())) {
    return "Password is too common. Choose a stronger password.";
  }

  return null;
}
