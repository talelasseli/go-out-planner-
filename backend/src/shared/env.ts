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
  STORAGE_ENDPOINT: z.string().url().optional(),
  STORAGE_REGION: z.string().default("auto"),
  STORAGE_BUCKET: z.string().min(1).optional(),
  STORAGE_ACCESS_KEY_ID: z.string().min(1).optional(),
  STORAGE_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  STORAGE_PUBLIC_URL: z.string().url().optional(),
  STORAGE_UPLOAD_URL_EXPIRY: z.coerce.number().int().positive().default(300),
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
      origins.push(new URL(trimmed).origin);
    } catch {
      throw new Error(`Invalid origin URL: "${trimmed}"`);
    }
  }

  if (origins.length === 0) {
    throw new Error("At least one origin is required");
  }

  return origins;
}

export function validate(input: Record<string, string | undefined>) {
  const normalized: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(input)) {
    normalized[k] = v === "" ? undefined : v;
  }
  const raw = envSchema.parse(normalized);

  const corsOriginList = parseOriginList(raw.CORS_ORIGIN);
  const trustedOriginList = parseOriginList(raw.TRUSTED_ORIGINS);

  if (raw.STORAGE_ENDPOINT && !raw.STORAGE_BUCKET) {
    throw new Error("STORAGE_BUCKET is required when STORAGE_ENDPOINT is set");
  }

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

    if (!raw.BETTER_AUTH_URL.startsWith("https://")) {
      throw new Error("BETTER_AUTH_URL must use HTTPS in production");
    }
    for (const origin of corsOriginList) {
      if (!origin.startsWith("https://")) {
        throw new Error("CORS_ORIGIN values must use HTTPS in production");
      }
    }
    for (const origin of trustedOriginList) {
      if (!origin.startsWith("https://")) {
        throw new Error("TRUSTED_ORIGINS values must use HTTPS in production");
      }
    }
  }

  return { ...raw, corsOriginList, trustedOriginList };
}

const _env = validate(process.env);

export const env = _env;
