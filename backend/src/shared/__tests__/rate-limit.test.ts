import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import {
  createGeneralLimiter,
  createAuthLimiter,
  GENERAL_MAX,
  AUTH_MAX,
} from "../rate-limit.js";

describe("rate limiting", () => {
  describe("general limiter", () => {
    it("returns 429 after exceeding the limit", async () => {
      const app = express();
      app.use(createGeneralLimiter({ windowMs: 60_000, limit: 3 }));
      app.get("/test", (_req, res) => res.json({ ok: true }));

      for (let i = 0; i < 3; i++) {
        const res = await request(app).get("/test");
        expect(res.status).toBe(200);
      }

      const res = await request(app).get("/test");
      expect(res.status).toBe(429);
      expect(res.body).toEqual({
        success: false,
        message: "Too many requests. Please try again later.",
      });
    });
  });

  describe("auth limiter", () => {
    it("returns 429 after fewer requests than general limiter", async () => {
      const app = express();
      app.use(
        "/api/auth",
        createAuthLimiter({ windowMs: 60_000, limit: 2 }),
      );
      app.get("/api/auth/login", (_req, res) => res.json({ ok: true }));

      for (let i = 0; i < 2; i++) {
        const res = await request(app).get("/api/auth/login");
        expect(res.status).toBe(200);
      }

      const res = await request(app).get("/api/auth/login");
      expect(res.status).toBe(429);
    });
  });

  describe("response format", () => {
    it("returns JSON matching the app's error style", async () => {
      const app = express();
      app.use(createGeneralLimiter({ windowMs: 60_000, limit: 0 }));
      app.get("/test", (_req, res) => res.json({ ok: true }));

      const res = await request(app).get("/test");
      expect(res.status).toBe(429);
      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body).toEqual({
        success: false,
        message: "Too many requests. Please try again later.",
      });
    });
  });

  describe("rate limit headers", () => {
    it("includes standard rate limit headers", async () => {
      const app = express();
      app.use(createGeneralLimiter({ windowMs: 60_000, limit: 100 }));
      app.get("/test", (_req, res) => res.json({ ok: true }));

      const res = await request(app).get("/test");
      expect(res.status).toBe(200);
      expect(res.headers["ratelimit-limit"]).toBeDefined();
      expect(res.headers["ratelimit-remaining"]).toBeDefined();
      expect(res.headers["ratelimit-reset"]).toBeDefined();
    });

    it("does not include legacy X-RateLimit headers", async () => {
      const app = express();
      app.use(createGeneralLimiter({ windowMs: 60_000, limit: 100 }));
      app.get("/test", (_req, res) => res.json({ ok: true }));

      const res = await request(app).get("/test");
      expect(res.headers["x-ratelimit-limit"]).toBeUndefined();
      expect(res.headers["x-ratelimit-remaining"]).toBeUndefined();
      expect(res.headers["x-ratelimit-reset"]).toBeUndefined();
    });
  });

  describe("default limits", () => {
    it("general limiter defaults to 300 per 15 minutes", () => {
      expect(GENERAL_MAX).toBe(300);
    });

    it("auth limiter defaults to 10 per 15 minutes", () => {
      expect(AUTH_MAX).toBe(10);
    });
  });
});
