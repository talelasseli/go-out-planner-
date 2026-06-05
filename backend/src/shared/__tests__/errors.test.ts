import { describe, it, expect, vi } from "vitest";
import { errorHandler, AppError } from "../errors.js";
import { ZodError } from "zod";
import type { Request, Response, NextFunction } from "express";

function mockReq(overrides: Partial<Request> = {}): Request {
  return { originalUrl: "/test", method: "GET", ...overrides } as Request;
}

function mockRes(): Response {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe("errorHandler", () => {
  it("returns 500 with generic message for unknown errors", () => {
    const req = mockReq();
    const res = mockRes();
    const err = new Error("something broke");

    errorHandler(err, req, res, vi.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Internal server error",
    });
  });

  it("does not expose stack trace in response for unknown errors", () => {
    const req = mockReq();
    const res = mockRes();
    const err = new Error("something broke");
    err.stack = "Error: something broke\n    at Object.<anonymous> (/app/src/test.ts:1:1)";

    errorHandler(err, req, res, vi.fn() as NextFunction);

    const call = (res.json as any).mock.calls[0][0];
    expect(call).not.toHaveProperty("stack");
    expect(call.message).toBe("Internal server error");
  });

  it("preserves AppError status code and message", () => {
    const req = mockReq();
    const res = mockRes();
    const err = new AppError(404, "Plan not found");

    errorHandler(err, req, res, vi.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Plan not found",
    });
  });

  it("returns 400 with validation errors for ZodError", () => {
    const req = mockReq();
    const res = mockRes();

    const zod = new ZodError([
      { code: "invalid_format", validation: "email", path: ["email"], message: "Invalid email" },
    ] as any);
    errorHandler(zod, req, res, vi.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Validation failed",
      errors: [{ field: "email", message: "Invalid email" }],
    });
  });

  it("includes route and method context when logging unknown errors", () => {
    const req = mockReq({ originalUrl: "/api/plans/99", method: "DELETE" });
    const res = mockRes();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = new Error("db failure");

    errorHandler(err, req, res, vi.fn() as NextFunction);

    const logged = JSON.stringify(consoleSpy.mock.calls);
    expect(logged).toContain("/api/plans/99");
    expect(logged).toContain("DELETE");
    consoleSpy.mockRestore();
  });
});
