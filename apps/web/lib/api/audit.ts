import { prisma, type Prisma } from "@parcel-society/db";
import type { AuthContext } from "./auth";

const toJson = (value: unknown): Prisma.InputJsonValue | undefined => {
  if (value === undefined || value === null) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
};

export const recordAdminAction = async ({
  auth,
  action,
  entityType,
  entityId,
  before,
  after,
}: {
  auth: AuthContext;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
}) => {
  const admin = await prisma.adminUser.findUnique({ where: { userId: auth.user.id } });
  await prisma.auditLog.create({
    data: {
      adminId: admin?.id,
      action,
      entityType,
      entityId,
      before: toJson(before),
      after: toJson(after),
    },
  });
};
