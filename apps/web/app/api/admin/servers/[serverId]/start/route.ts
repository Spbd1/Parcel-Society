import { requireAdminAuth } from "../../../../../../lib/api/auth";
import { apiOk, handleApiError } from "../../../../../../lib/api/responses";
import { serverIdParamsSchema } from "../../../../../../lib/api/schemas";
import { startServer } from "../../../../../../lib/services/game";

export async function POST(request: Request, context: { params: Promise<{ serverId: string }> }) {
  try {
    await requireAdminAuth(request);
    const { serverId } = serverIdParamsSchema.parse(await context.params);
    return apiOk(await startServer(serverId));
  } catch (error) {
    return handleApiError(error);
  }
}
