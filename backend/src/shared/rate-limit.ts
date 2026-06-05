import rateLimit, { type Options } from "express-rate-limit";

export const GENERAL_WINDOW_MS = 15 * 60 * 1000;
export const GENERAL_MAX = 300;
export const AUTH_WINDOW_MS = 15 * 60 * 1000;
export const AUTH_MAX = 30;

const standardResponse = {
  success: false,
  message: "Too many requests. Please try again later.",
};

export function createGeneralLimiter(overrides?: Partial<Options>) {
  return rateLimit({
    windowMs: GENERAL_WINDOW_MS,
    limit: GENERAL_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: standardResponse,
    ...overrides,
  });
}

export function createAuthLimiter(overrides?: Partial<Options>) {
  return rateLimit({
    windowMs: AUTH_WINDOW_MS,
    limit: AUTH_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: standardResponse,
    ...overrides,
  });
}

export const generalLimiter = createGeneralLimiter();
export const authLimiter = createAuthLimiter();
