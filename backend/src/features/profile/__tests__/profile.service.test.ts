import { vi, describe, it, expect, beforeEach } from "vitest";
import { prisma } from "../../../shared/prisma.js";
import { auth } from "../../../lib/auth.js";
import {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
} from "../profile.service.js";
import { AppError } from "../../../shared/errors.js";

vi.mock("../../../shared/prisma.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("../../../lib/auth.js", () => ({
  auth: {
    api: {
      changePassword: vi.fn(),
      deleteUser: vi.fn(),
    },
  },
}));

const mockProfile = {
  id: "u1",
  name: "Test User",
  email: "test@example.com",
  emailVerified: true,
  image: null,
  username: "testuser",
  displayUsername: null,
  bio: null,
  location: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getProfile", () => {
  it("returns profile for existing user", async () => {
    (prisma.user.findUnique as any).mockResolvedValue(mockProfile);

    const result = await getProfile("u1");

    expect(result.id).toBe("u1");
    expect(result.name).toBe("Test User");
    expect(result.email).toBe("test@example.com");
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "u1" },
      select: expect.objectContaining({
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        bio: true,
        location: true,
      }),
    });
  });

  it("does not select password hash or sensitive fields", async () => {
    (prisma.user.findUnique as any).mockResolvedValue(mockProfile);

    await getProfile("u1");

    const callArgs = (prisma.user.findUnique as any).mock.calls[0][0];
    expect(callArgs.select).not.toHaveProperty("password");
    expect(callArgs.select).not.toHaveProperty("token");
    expect(callArgs.select).not.toHaveProperty("sessions");
    expect(callArgs.select).not.toHaveProperty("accounts");
  });

  it("throws 404 when user not found", async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);

    await expect(getProfile("nonexistent")).rejects.toThrow(AppError);
    await expect(getProfile("nonexistent")).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe("updateProfile", () => {
  it("updates name successfully", async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.user.update as any).mockResolvedValue(mockProfile);

    const result = await updateProfile("u1", { name: "Updated Name" });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { name: "Updated Name" },
      select: expect.any(Object),
    });
    expect(result.name).toBe("Test User");
  });

  it("updates bio and location successfully", async () => {
    const updatedProfile = {
      ...mockProfile,
      bio: "Hello!",
      location: { latitude: 51.5074, longitude: -0.1278 },
    };
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.user.update as any).mockResolvedValue(updatedProfile);

    const result = await updateProfile("u1", {
      bio: "Hello!",
      location: { latitude: 51.5074, longitude: -0.1278 },
    });

    expect(result.bio).toBe("Hello!");
    expect(result.location).toEqual({
      latitude: 51.5074,
      longitude: -0.1278,
    });
  });

  it("throws 409 when username is taken by another user", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: "other-user" });

    await expect(
      updateProfile("u1", { username: "taken" }),
    ).rejects.toMatchObject({ statusCode: 409, message: "Username is already taken" });

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("allows updating to the same username (own username)", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: "u1" });
    (prisma.user.update as any).mockResolvedValue({
      ...mockProfile,
      username: "testuser",
    });

    const result = await updateProfile("u1", { username: "testuser" });

    expect(result.username).toBe("testuser");
    expect(prisma.user.update).toHaveBeenCalledTimes(1);
  });

  it("allows updating username when no conflict", async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.user.update as any).mockResolvedValue({
      ...mockProfile,
      username: "newusername",
    });

    const result = await updateProfile("u1", { username: "newusername" });

    expect(result.username).toBe("newusername");
  });

  it("skips username check when username is not provided", async () => {
    (prisma.user.update as any).mockResolvedValue(mockProfile);

    await updateProfile("u1", { name: "New Name" });

    expect(prisma.user.findUnique).not.toHaveBeenCalledWith(
      expect.objectContaining({ where: { username: expect.any(String) } }),
    );
  });
});

describe("changePassword", () => {
  it("calls auth.api.changePassword with correct parameters", async () => {
    const headers = { "cookie": "session=abc" };
    (auth.api.changePassword as any).mockResolvedValue({});

    await changePassword(headers, "old-password", "new-password-123");

    expect(auth.api.changePassword).toHaveBeenCalledWith({
      body: { currentPassword: "old-password", newPassword: "new-password-123" },
      headers: expect.any(Object),
    });
  });

  it("converts Better Auth error to AppError", async () => {
    const apiError = { statusCode: 400, message: "Current password is incorrect" };
    (auth.api.changePassword as any).mockRejectedValue(apiError);

    await expect(
      changePassword({}, "wrong", "new-password-123"),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Current password is incorrect",
    });
  });

  it("throws generic error for unknown failures", async () => {
    (auth.api.changePassword as any).mockRejectedValue("network error");

    await expect(
      changePassword({}, "old", "new-password-123"),
    ).rejects.toMatchObject({
      statusCode: 500,
    });
  });
});

describe("deleteAccount", () => {
  it("calls auth.api.deleteUser with correct parameters", async () => {
    const headers = { "cookie": "session=abc" };
    (auth.api.deleteUser as any).mockResolvedValue({});

    await deleteAccount(headers, "my-password");

    expect(auth.api.deleteUser).toHaveBeenCalledWith({
      body: { password: "my-password" },
      headers: expect.any(Object),
    });
  });

  it("converts Better Auth error to AppError", async () => {
    const apiError = { statusCode: 401, message: "Invalid password" };
    (auth.api.deleteUser as any).mockRejectedValue(apiError);

    await expect(
      deleteAccount({}, "wrong"),
    ).rejects.toMatchObject({
      statusCode: 401,
      message: "Invalid password",
    });
  });

  it("throws generic error for unknown failures", async () => {
    (auth.api.deleteUser as any).mockRejectedValue("network error");

    await expect(
      deleteAccount({}, "password"),
    ).rejects.toMatchObject({
      statusCode: 500,
    });
  });
});
