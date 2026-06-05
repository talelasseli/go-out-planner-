import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      NODE_ENV: "development",
      DATABASE_URL: "postgresql://user:pass@localhost:5432/test",
      BETTER_AUTH_SECRET: "abcdefghijklmnopqrstuvwxyz0123456789",
      BETTER_AUTH_URL: "http://localhost:4000",
      GOOGLE_CLIENT_ID: "test-client-id",
      GOOGLE_CLIENT_SECRET: "test-client-secret",
      CORS_ORIGIN: "http://localhost:5173",
      TRUSTED_ORIGINS: "http://localhost:5173",
      PORT: "4000",
    },
  },
});
