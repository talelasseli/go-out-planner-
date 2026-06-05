import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import { requireSafeOrigin } from "../middleware/origin-check.js";

const allowedOrigin = "http://localhost:5173";
const disallowedOrigin = "https://evil.com";

describe("requireSafeOrigin", () => {
  describe("unsafe methods (POST, PATCH, PUT, DELETE)", () => {
    it("allows POST with allowed origin", async () => {
      const app = express();
      app.use(requireSafeOrigin);
      app.post("/test", (_req, res) => res.json({ ok: true }));

      const res = await request(app)
        .post("/test")
        .set("Origin", allowedOrigin);
      expect(res.status).toBe(200);
    });

    it("blocks POST with disallowed origin", async () => {
      const app = express();
      app.use(requireSafeOrigin);
      app.post("/test", (_req, res) => res.json({ ok: true }));

      const res = await request(app)
        .post("/test")
        .set("Origin", disallowedOrigin);
      expect(res.status).toBe(403);
      expect(res.body).toEqual({
        success: false,
        message: "Forbidden origin",
      });
    });

    it("blocks PATCH with disallowed origin", async () => {
      const app = express();
      app.use(requireSafeOrigin);
      app.patch("/test", (_req, res) => res.json({ ok: true }));

      const res = await request(app)
        .patch("/test")
        .set("Origin", disallowedOrigin);
      expect(res.status).toBe(403);
    });

    it("blocks DELETE with disallowed origin", async () => {
      const app = express();
      app.use(requireSafeOrigin);
      app.delete("/test", (_req, res) => res.json({ ok: true }));

      const res = await request(app)
        .delete("/test")
        .set("Origin", disallowedOrigin);
      expect(res.status).toBe(403);
    });

    it("allows POST without origin in development/test", async () => {
      const app = express();
      app.use(requireSafeOrigin);
      app.post("/test", (_req, res) => res.json({ ok: true }));

      const res = await request(app).post("/test");
      expect(res.status).toBe(200);
    });

    it("rejects origin 'null'", async () => {
      const app = express();
      app.use(requireSafeOrigin);
      app.post("/test", (_req, res) => res.json({ ok: true }));

      const res = await request(app)
        .post("/test")
        .set("Origin", "null");
      expect(res.status).toBe(403);
    });
  });

  describe("safe methods (GET, HEAD, OPTIONS)", () => {
    it("allows GET with disallowed origin", async () => {
      const app = express();
      app.use(requireSafeOrigin);
      app.get("/test", (_req, res) => res.json({ ok: true }));

      const res = await request(app)
        .get("/test")
        .set("Origin", disallowedOrigin);
      expect(res.status).toBe(200);
    });

    it("allows OPTIONS with disallowed origin", async () => {
      const app = express();
      app.use(requireSafeOrigin);
      app.options("/test", (_req, res) => res.json({ ok: true }));

      const res = await request(app)
        .options("/test")
        .set("Origin", disallowedOrigin);
      expect(res.status).toBe(200);
    });

    it("allows HEAD with disallowed origin", async () => {
      const app = express();
      app.use(requireSafeOrigin);
      app.head("/test", (_req, res) => res.status(200).end());

      const res = await request(app)
        .head("/test")
        .set("Origin", disallowedOrigin);
      expect(res.status).toBe(200);
    });
  });
});

describe("requireSafeOrigin — app integration", () => {
  it("loads the full app without errors", async () => {
    const { default: app } = await import("../../app.js");
    expect(app).toBeDefined();
  });

  it("blocks POST to API routes with disallowed origin before auth check", async () => {
    const { default: app } = await import("../../app.js");
    const res = await request(app)
      .post("/api/friend-requests")
      .set("Origin", disallowedOrigin);
    expect(res.status).toBe(403);
  });

  it("allows POST to API routes with allowed origin in dev", async () => {
    const { default: app } = await import("../../app.js");
    const res = await request(app)
      .post("/api/friend-requests")
      .set("Origin", allowedOrigin);
    expect(res.status).not.toBe(403);
  });
});
