import { prisma } from "@parcel-society/db";
import { requireAdminAuth } from "../../../../../lib/api/auth";
import { ApiException, apiOk, handleApiError } from "../../../../../lib/api/responses";
import { serverIdParamsSchema, updateServerSchema } from "../../../../../lib/api/schemas";
import { recordAdminAction } from "../../../../../lib/api/audit";

export async function GET(request: Request, context: { params: Promise<{ serverId: string }> }) {
  try {
    await requireAdminAuth(request);
    const { serverId } = serverIdParamsSchema.parse(await context.params);
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        seasons: true,
        rounds: true,
        parcels: true,
        players: true,
        _count: { select: { decisions: true, contracts: true, events: true } },
      },
    });
    if (!server) throw new ApiException(404, "SERVER_NOT_FOUND", "Server was not found.");
    return apiOk({ server });
  } catch (error) {
    return handleApiError(error, { route: "GET /api/admin/servers/[serverId]" });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ serverId: string }> }) {
  try {
    const auth = await requireAdminAuth(request);
    const { serverId } = serverIdParamsSchema.parse(await context.params);
    const body = updateServerSchema.parse(await request.json());
    const before = await prisma.server.findUnique({ where: { id: serverId } });
    if (!before) throw new ApiException(404, "SERVER_NOT_FOUND", "Server was not found.");
    const server = await prisma.server.update({ where: { id: serverId }, data: body });
    await recordAdminAction({ auth, action: "UPDATE_SERVER_CONFIG", entityType: "server", entityId: server.id, before, after: server });
    return apiOk({ server });
  } catch (error) {
    return handleApiError(error, { route: "PATCH /api/admin/servers/[serverId]" });
  }
}
