import { vi, describe, it, expect, beforeEach } from "vitest";
import { prisma } from "../../../shared/prisma.js";
import { searchUsers } from "../friends.service.js";

vi.mock("../../../shared/prisma.js", () => ({
  prisma: {
    user: { findMany: vi.fn() },
    friendship: { findMany: vi.fn() },
    friendRequest: { findMany: vi.fn() },
  },
}));

const mockUser: Record<string, unknown> = {
  id: "u1",
  name: "Test User",
  username: "testuser",
  image: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("searchUsers", () => {
  describe("email enumeration prevention", () => {
    it("does not search by exact email address", async () => {
      (prisma.user.findMany as any).mockResolvedValue([]);
      (prisma.friendship.findMany as any).mockResolvedValue([]);
      (prisma.friendRequest.findMany as any).mockResolvedValue([]);

      await searchUsers("attacker@example.com", "current-user");

      const args = (prisma.user.findMany as any).mock.calls[0][0];
      const orConditions = args.where.OR;
      const hasEmailCondition = orConditions.some(
        (c: any) => c.email !== undefined,
      );
      expect(hasEmailCondition).toBe(false);
    });

    it("does not search by partial email domain", async () => {
      (prisma.user.findMany as any).mockResolvedValue([]);
      (prisma.friendship.findMany as any).mockResolvedValue([]);
      (prisma.friendRequest.findMany as any).mockResolvedValue([]);

      await searchUsers("gmail.com", "current-user");

      const args = (prisma.user.findMany as any).mock.calls[0][0];
      const orConditions = args.where.OR;
      const hasEmailCondition = orConditions.some(
        (c: any) => c.email !== undefined,
      );
      expect(hasEmailCondition).toBe(false);
    });
  });

  describe("public field search", () => {
    it("returns results when searching by name", async () => {
      (prisma.user.findMany as any).mockResolvedValue([mockUser]);
      (prisma.friendship.findMany as any).mockResolvedValue([]);
      (prisma.friendRequest.findMany as any).mockResolvedValue([]);

      const results = await searchUsers("Test User", "current-user");

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Test User");
    });

    it("returns results when searching by username", async () => {
      (prisma.user.findMany as any).mockResolvedValue([mockUser]);
      (prisma.friendship.findMany as any).mockResolvedValue([]);
      (prisma.friendRequest.findMany as any).mockResolvedValue([]);

      const results = await searchUsers("testuser", "current-user");

      expect(results).toHaveLength(1);
      expect(results[0].username).toBe("testuser");
    });
  });

  describe("response privacy", () => {
    it("does not select email from the database", async () => {
      (prisma.user.findMany as any).mockResolvedValue([]);
      (prisma.friendship.findMany as any).mockResolvedValue([]);
      (prisma.friendRequest.findMany as any).mockResolvedValue([]);

      await searchUsers("test", "current-user");

      const args = (prisma.user.findMany as any).mock.calls[0][0];
      expect(args.select.email).toBeUndefined();
    });

    it("does not select emailVerified from the database", async () => {
      (prisma.user.findMany as any).mockResolvedValue([]);
      (prisma.friendship.findMany as any).mockResolvedValue([]);
      (prisma.friendRequest.findMany as any).mockResolvedValue([]);

      await searchUsers("test", "current-user");

      const args = (prisma.user.findMany as any).mock.calls[0][0];
      expect(args.select.emailVerified).toBeUndefined();
    });

    it("selects only safe public fields from the database", async () => {
      (prisma.user.findMany as any).mockResolvedValue([]);
      (prisma.friendship.findMany as any).mockResolvedValue([]);
      (prisma.friendRequest.findMany as any).mockResolvedValue([]);

      await searchUsers("test", "current-user");

      const args = (prisma.user.findMany as any).mock.calls[0][0];
      expect(Object.keys(args.select).sort()).toEqual(
        ["id", "image", "name", "username"].sort(),
      );
    });
  });
});
