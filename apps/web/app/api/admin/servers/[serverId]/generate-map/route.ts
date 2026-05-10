import { requireAdminAuth } from "../../../../../../lib/api/auth";
import { apiOk, handleApiError } from "../../../../../../lib/api/responses";
import { generateMapSchema, serverIdParamsSchema } from "../../../../../../lib/api/schemas";
import { createServerMap } from "../../../../../../lib/services/game";
import { recordAdminAction } from "../../../../../../lib/api/audit";

export async function POST(request: Request, context: { params: Promise<{ serverId: string }> }) {
  try {
    const auth = await requireAdminAuth(request);
    const { serverId } = serverIdParamsSchema.parse(await context.params);
    const body = generateMapSchema.parse(await request.json().catch(() => ({})));
    const result = await createServerMap({ serverId, width: body.width, height: body.height });
    await recordAdminAction({ auth, action: "GENERATE_MAP", entityType: "server", entityId: serverId, after: { width: body.width, height: body.height, parcelCount: result.count } });
    return apiOk(result);
  } catch (error) {
    return handleApiError(error, { route: "POST /api/admin/servers/[serverId]/generate-map" });
  }
}
