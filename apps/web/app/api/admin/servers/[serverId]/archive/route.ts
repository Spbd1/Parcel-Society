import { prisma, ServerStatus } from "@parcel-society/db";
import { requireAdminAuth } from "../../../../../../lib/api/auth";
import { ApiException, apiOk, handleApiError } from "../../../../../../lib/api/responses";
import { serverIdParamsSchema } from "../../../../../../lib/api/schemas";
import { recordAdminAction } from "../../../../../../lib/api/audit";

export async function POST(request: Request, context: { params: Promise<{ serverId: string }> }) {
  try {
    const auth = await requireAdminAuth(request);
    const { serverId } = serverIdParamsSchema.parse(await context.params);
    const before = await prisma.server.findUnique({ where: { id: serverId } });
    if (!before) throw new ApiException(404, "SERVER_NOT_FOUND", "Server was not found.");
    const server = await prisma.server.update({ where: { id: serverId }, data: { status: ServerStatus.ARCHIVED } });
    await recordAdminAction({ auth, action: "ARCHIVE_SERVER", entityType: "server", entityId: server.id, before, after: server });
    return apiOk({ server });
  } catch (error) {
    return handleApiError(error, { route: "POST /api/admin/servers/[serverId]/archive" });
  }
}
