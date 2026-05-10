import { cookies } from "next/headers";
import { prisma, UserRole } from "@parcel-society/db";
import { ApiException } from "./responses";
import { rateLimit } from "./rateLimit";

const PARTICIPANT_COOKIE = "parcel_society_user_id";

export type AuthContext = {
  user: {
    id: string;
    anonymousId: string;
    email: string | null;
    role: UserRole;
  };
  setCookie?: { name: string; value: string };
};

export const getParticipantAuth = async (): Promise<AuthContext> => {
  const cookieStore = await cookies();
  const existingUserId = cookieStore.get(PARTICIPANT_COOKIE)?.value;

  if (existingUserId) {
    const user = await prisma.user.findUnique({ where: { id: existingUserId } });
    if (user) {
      return { user };
    }
  }

  const user = await prisma.user.create({ data: { role: UserRole.PARTICIPANT } });
  return {
    user,
    setCookie: { name: PARTICIPANT_COOKIE, value: user.id },
  };
};

const parseBasicAuth = (request: Request): { email: string; password: string } | null => {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) {
    return null;
  }

  const decoded = Buffer.from(header.slice("Basic ".length), "base64").toString("utf8");
  const separator = decoded.indexOf(":");
  if (separator === -1) {
    return null;
  }

  return {
    email: decoded.slice(0, separator),
    password: decoded.slice(separator + 1),
  };
};

export const requireAdminAuth = async (request: Request): Promise<AuthContext> => {
  rateLimit({ request, key: "admin-login", limit: 20, windowMs: 60_000 });
  const credentials = parseBasicAuth(request);
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new ApiException(500, "ADMIN_AUTH_NOT_CONFIGURED", "Admin credentials are not configured.");
  }

  if (
    !credentials ||
    credentials.email !== adminEmail ||
    credentials.password !== adminPassword
  ) {
    throw new ApiException(401, "UNAUTHORIZED", "Admin credentials are required.");
  }

  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: UserRole.SUPER_ADMIN },
    create: {
      email: adminEmail,
      role: UserRole.SUPER_ADMIN,
    },
  });

  await prisma.adminUser.upsert({
    where: { userId: user.id },
    update: { email: adminEmail },
    create: { userId: user.id, email: adminEmail, name: "Environment Admin" },
  });

  return { user };
};

export const requireSuperAdminAuth = async (request: Request): Promise<AuthContext> => {
  const auth = await requireAdminAuth(request);
  if (auth.user.role !== UserRole.SUPER_ADMIN) {
    throw new ApiException(403, "SUPER_ADMIN_REQUIRED", "Super admin privileges are required.");
  }
  return auth;
};

export const assertParticipantOnServer = async (userId: string, serverId: string) => {
  const player = await prisma.player.findUnique({
    where: { userId_serverId: { userId, serverId } },
  });

  if (!player) {
    throw new ApiException(403, "FORBIDDEN", "You are not a participant on this server.");
  }

  return player;
};

export const applyAuthCookie = <T extends Response>(response: T, auth: AuthContext): T => {
  if (auth.setCookie) {
    response.headers.append(
      "Set-Cookie",
      `${auth.setCookie.name}=${auth.setCookie.value}; Path=/; HttpOnly; SameSite=Lax`,
    );
  }
  return response;
};
