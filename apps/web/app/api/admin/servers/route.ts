import { randomUUID } from "node:crypto";
import { prisma, ServerStatus } from "@parcel-society/db";
import { requireAdminAuth } from "../../../../lib/api/auth";
import { apiOk, handleApiError } from "../../../../lib/api/responses";
import { createServerSchema } from "../../../../lib/api/schemas";
import { recordAdminAction } from "../../../../lib/api/audit";

export async function GET(request: Request) {
  try {
    await requireAdminAuth(request);
    const servers = await prisma.server.findMany({
      include: { _count: { select: { players: true, parcels: true, decisions: true } } },
      orderBy: { createdAt: "desc" },
    });
    return apiOk({ servers });
  } catch (error) {
    return handleApiError(error, { route: "GET /api/admin/servers" });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdminAuth(request);
    const body = createServerSchema.parse(await request.json());
    const server = await prisma.server.create({
      data: {
        ...body,
        randomSeed: body.randomSeed ?? randomUUID(),
        status: ServerStatus.DRAFT,
      },
    });
    await recordAdminAction({ auth, action: "CREATE_SERVER", entityType: "server", entityId: server.id, after: server });
    return apiOk({ server }, { status: 201 });
  } catch (error) {
    return handleApiError(error, { route: "POST /api/admin/servers" });
  }
}
