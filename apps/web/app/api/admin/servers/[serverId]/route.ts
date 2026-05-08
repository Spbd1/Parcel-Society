import { prisma } from "@parcel-society/db";
import { requireAdminAuth } from "../../../../../lib/api/auth";
import { ApiException, apiOk, handleApiError } from "../../../../../lib/api/responses";
import { serverIdParamsSchema, updateServerSchema } from "../../../../../lib/api/schemas";

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
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ serverId: string }> }) {
  try {
    await requireAdminAuth(request);
    const { serverId } = serverIdParamsSchema.parse(await context.params);
    const body = updateServerSchema.parse(await request.json());
    const server = await prisma.server.update({ where: { id: serverId }, data: body });
    return apiOk({ server });
  } catch (error) {
    return handleApiError(error);
  }
}
