import "dotenv/config";
import { z } from "zod";

const urlWith = (...schemes: string[]) => {
  const pattern = new RegExp(
    `^(${schemes.map((s) => s.replace(":", "")).join("|")})$`,
  );
  return z.string().url({ protocol: pattern });
};

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: urlWith("postgresql:", "postgres:", "http:", "https:"),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: urlWith("http:", "https:"),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  CORS_ORIGIN: z.string().min(1),
  TRUSTED_ORIGINS: z.string().min(1),
});

function parseOriginList(value: string): string[] {
  const parts = value.split(",");
  const origins: string[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.length === 0) {
      throw new Error("Empty origin entry is not allowed");
    }
    if (trimmed === "*") {
      throw new Error(
        'Wildcard origin "*" is not allowed when credentials are enabled'
      );
    }
    try {
      new URL(trimmed);
    } catch {
      throw new Error(`Invalid origin URL: "${trimmed}"`);
    }
    origins.push(trimmed);
  }

  if (origins.length === 0) {
    throw new Error("At least one origin is required");
  }

  return origins;
}

export function validate(input: Record<string, string | undefined>) {
  const raw = envSchema.parse(input);

  if (raw.NODE_ENV === "production") {
    const localhost = /localhost/i;
    if (localhost.test(raw.BETTER_AUTH_URL)) {
      throw new Error("BETTER_AUTH_URL must not use localhost in production");
    }
    if (localhost.test(raw.CORS_ORIGIN)) {
      throw new Error("CORS_ORIGIN must not use localhost in production");
    }
    if (localhost.test(raw.TRUSTED_ORIGINS)) {
      throw new Error("TRUSTED_ORIGINS must not use localhost in production");
    }
  }

  const corsOriginList = parseOriginList(raw.CORS_ORIGIN);
  const trustedOriginList = parseOriginList(raw.TRUSTED_ORIGINS);

  return { ...raw, corsOriginList, trustedOriginList };
}

const _env = validate(process.env);

export const env = _env;
