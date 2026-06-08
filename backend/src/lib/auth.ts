import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username } from "better-auth/plugins";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { prisma } from "../shared/prisma.js";
import { env } from "../shared/env.js";
import { validatePasswordStrength } from "../features/auth/password-validation.js";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  trustedOrigins: env.trustedOriginList,
  plugins: [username()],
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  account: {
    // Required because OAuth is initiated from Vercel frontend
    // while Better Auth runs on Render backend.
    // DB state verification remains enabled; this only skips the
    // secondary signed state cookie check that fails cross-domain.
    skipStateCookieCheck: true,
  },
  advanced: {
    useSecureCookies: env.NODE_ENV === "production",
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") {
        return;
      }
      const error = validatePasswordStrength(ctx.body?.password);
      if (error) {
        throw new APIError("BAD_REQUEST", { message: error });
      }
    }),
  },
});
