const SENSITIVE_KEYS = [
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "session",
  "oauth",
  "database_url",
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function redactValue(value: unknown, visited: Set<unknown>): unknown {
  if (isPlainObject(value)) {
    if (visited.has(value)) return "[CIRCULAR]";
    visited.add(value);
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      const lower = key.toLowerCase();
      const isSensitive = SENSITIVE_KEYS.some((sk) => lower.includes(sk));
      result[key] = isSensitive ? "[REDACTED]" : redactValue(value[key], visited);
    }
    return result;
  }
  if (Array.isArray(value)) {
    return value.map((v) => redactValue(v, visited));
  }
  return value;
}

export function redact(obj: Record<string, unknown>): Record<string, unknown> {
  return redactValue(obj, new Set()) as Record<string, unknown>;
}

const isDev = () => process.env.NODE_ENV !== "production";

export function safeError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  const safe: Record<string, unknown> = {};

  if (error instanceof Error) {
    safe.name = error.name;
    safe.message = error.message;
    if ("statusCode" in error) {
      safe.statusCode = (error as any).statusCode;
    }
    if (isDev()) {
      safe.stack = error.stack;
    }
  } else {
    safe.name = "UnknownValue";
    safe.message = String(error);
  }

  if (context) {
    safe.context = redact(context);
  }

  if (isDev()) {
    console.error("[ERROR]", JSON.stringify(safe, null, 2));
  } else {
    console.error("[ERROR]", JSON.stringify(safe));
  }
}
