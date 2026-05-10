import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    upsert: vi.fn(),
  },
  adminUser: {
    upsert: vi.fn(),
  },
  player: {
    findUnique: vi.fn(),
  },
}));

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@parcel-society/db", () => ({
  UserRole: { PARTICIPANT: "PARTICIPANT", ADMIN: "ADMIN", SUPER_ADMIN: "SUPER_ADMIN" },
  prisma: prismaMock,
}));

const { requireAdminAuth, requireSuperAdminAuth, assertParticipantOnServer } = await import("./auth");

const basic = (email: string, password: string, ip: string) =>
  new Request("https://example.test/api/admin", {
    headers: {
      authorization: `Basic ${Buffer.from(`${email}:${password}`).toString("base64")}`,
      "x-forwarded-for": ip,
    },
  });

describe("admin authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_EMAIL = "admin@example.org";
    process.env.ADMIN_PASSWORD = "secret";
    prismaMock.user.upsert.mockResolvedValue({
      id: "admin-user",
      anonymousId: "anon",
      email: "admin@example.org",
      role: "SUPER_ADMIN",
    });
    prismaMock.adminUser.upsert.mockResolvedValue({ id: "admin-profile" });
  });

  it("rejects missing admin credentials", async () => {
    await expect(requireAdminAuth(new Request("https://example.test/api/admin"))).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
    });
  });

  it("allows configured super admin credentials", async () => {
    await expect(requireSuperAdminAuth(basic("admin@example.org", "secret", "203.0.113.20"))).resolves.toMatchObject({
      user: { role: "SUPER_ADMIN" },
    });
  });
});

describe("participant authorization", () => {
  it("protects participant data for non-members", async () => {
    prismaMock.player.findUnique.mockResolvedValue(null);
    await expect(assertParticipantOnServer("user-1", "server-1")).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
    });
  });
});
