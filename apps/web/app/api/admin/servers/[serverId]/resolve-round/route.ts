import { requireAdminAuth } from "../../../../../../lib/api/auth";
import { apiOk, handleApiError } from "../../../../../../lib/api/responses";
import { serverIdParamsSchema } from "../../../../../../lib/api/schemas";
import { resolveActiveRound } from "../../../../../../lib/services/game";

export async function POST(request: Request, context: { params: Promise<{ serverId: string }> }) {
  try {
    await requireAdminAuth(request);
    const { serverId } = serverIdParamsSchema.parse(await context.params);
    return apiOk({ summary: await resolveActiveRound(serverId) });
  } catch (error) {
    return handleApiError(error);
  }
}
