import "dotenv/config";

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
};

export const config = {
  port: parseInt(process.env.PORT ?? "3001", 10),
  databaseUrl: required("DATABASE_URL"),
  betterAuthUrl: process.env.BETTER_AUTH_URL ?? "http://localhost:5173",
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
};
