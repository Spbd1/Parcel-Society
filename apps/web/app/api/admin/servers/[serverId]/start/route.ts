import { requireAdminAuth } from "../../../../../../lib/api/auth";
import { apiOk, handleApiError } from "../../../../../../lib/api/responses";
import { serverIdParamsSchema } from "../../../../../../lib/api/schemas";
import { startServer } from "../../../../../../lib/services/game";
import { recordAdminAction } from "../../../../../../lib/api/audit";

export async function POST(request: Request, context: { params: Promise<{ serverId: string }> }) {
  try {
    const auth = await requireAdminAuth(request);
    const { serverId } = serverIdParamsSchema.parse(await context.params);
    const result = await startServer(serverId);
    await recordAdminAction({ auth, action: "START_SERVER", entityType: "server", entityId: serverId, after: result });
    return apiOk(result);
  } catch (error) {
    return handleApiError(error, { route: "POST /api/admin/servers/[serverId]/start" });
  }
}
