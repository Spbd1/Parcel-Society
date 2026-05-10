import { requireAdminAuth } from "../../../../../../lib/api/auth";
import { apiOk, handleApiError } from "../../../../../../lib/api/responses";
import { serverIdParamsSchema } from "../../../../../../lib/api/schemas";
import { resolveActiveRound } from "../../../../../../lib/services/game";
import { recordAdminAction } from "../../../../../../lib/api/audit";

export async function POST(request: Request, context: { params: Promise<{ serverId: string }> }) {
  try {
    const auth = await requireAdminAuth(request);
    const { serverId } = serverIdParamsSchema.parse(await context.params);
    const summary = await resolveActiveRound(serverId);
    await recordAdminAction({ auth, action: "RESOLVE_ROUND", entityType: "server", entityId: serverId, after: summary });
    return apiOk({ summary });
  } catch (error) {
    return handleApiError(error, { route: "POST /api/admin/servers/[serverId]/resolve-round" });
  }
}
