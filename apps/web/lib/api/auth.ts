import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma, UserRole } from "@parcel-society/db";
import { ApiException } from "./responses";
import { rateLimit } from "./rateLimit";

const PARTICIPANT_COOKIE = "parcel_society_user_id";

const appSecret = (): string => {
  const secret = process.env.APP_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV !== "production") return "parcel-society-development-secret";
  throw new ApiException(500, "APP_SECRET_NOT_CONFIGURED", "Participant session signing is not configured.");
};

const signParticipantId = (userId: string): string =>
  createHmac("sha256", appSecret()).update(userId).digest("base64url");

const encodeParticipantCookie = (userId: string): string => `${userId}.${signParticipantId(userId)}`;

const decodeParticipantCookie = (value: string | undefined): string | null => {
  if (!value) return null;
  const separator = value.lastIndexOf(".");
  if (separator <= 0) return null;
  const userId = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  const expected = signParticipantId(userId);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length) return null;
  return timingSafeEqual(signatureBuffer, expectedBuffer) ? userId : null;
};

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
  const existingUserId = decodeParticipantCookie(cookieStore.get(PARTICIPANT_COOKIE)?.value);

  if (existingUserId) {
    const user = await prisma.user.findUnique({
      where: { id: existingUserId },
    });
    if (user) {
      return { user };
    }
  }

  const user = await prisma.user.create({
    data: { role: UserRole.PARTICIPANT },
  });
  return {
    user,
    setCookie: { name: PARTICIPANT_COOKIE, value: encodeParticipantCookie(user.id) },
  };
};

const parseBasicAuth = (
  request: Request,
): { email: string; password: string } | null => {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) {
    return null;
  }

  const decoded = Buffer.from(header.slice("Basic ".length), "base64").toString(
    "utf8",
  );
  const separator = decoded.indexOf(":");
  if (separator === -1) {
    return null;
  }

  return {
    email: decoded.slice(0, separator),
    password: decoded.slice(separator + 1),
  };
};

export const requireAdminAuth = async (
  request: Request,
): Promise<AuthContext> => {
  rateLimit({ request, key: "admin-login", limit: 20, windowMs: 60_000 });
  const credentials = parseBasicAuth(request);
  const adminEmail =
    process.env.ADMIN_EMAIL ??
    (process.env.NODE_ENV === "production" ? undefined : "admin@example.com");
  const adminPassword =
    process.env.ADMIN_PASSWORD ??
    (process.env.NODE_ENV === "production" ? undefined : "changeme");

  if (!adminEmail || !adminPassword) {
    throw new ApiException(
      500,
      "ADMIN_AUTH_NOT_CONFIGURED",
      "Admin credentials are not configured.",
    );
  }

  if (
    !credentials ||
    credentials.email !== adminEmail ||
    credentials.password !== adminPassword
  ) {
    throw new ApiException(
      401,
      "UNAUTHORIZED",
      "Admin credentials are required.",
    );
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

export const requireSuperAdminAuth = async (
  request: Request,
): Promise<AuthContext> => {
  const auth = await requireAdminAuth(request);
  if (auth.user.role !== UserRole.SUPER_ADMIN) {
    throw new ApiException(
      403,
      "SUPER_ADMIN_REQUIRED",
      "Super admin privileges are required.",
    );
  }
  return auth;
};

export const assertParticipantOnServer = async (
  userId: string,
  serverId: string,
) => {
  const player = await prisma.player.findUnique({
    where: { userId_serverId: { userId, serverId } },
  });

  if (!player) {
    throw new ApiException(
      403,
      "FORBIDDEN",
      "You are not a participant on this server.",
    );
  }

  return player;
};

export const applyAuthCookie = <T extends Response>(
  response: T,
  auth: AuthContext,
): T => {
  if (auth.setCookie) {
    response.headers.append(
      "Set-Cookie",
      `${auth.setCookie.name}=${auth.setCookie.value}; Path=/; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
    );
  }
  return response;
};
