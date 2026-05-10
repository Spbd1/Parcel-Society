import { requireAdminAuth } from "../../../../../../lib/api/auth";
import { apiOk, handleApiError } from "../../../../../../lib/api/responses";
import { serverIdParamsSchema } from "../../../../../../lib/api/schemas";
import { getServerAnalytics } from "../../../../../../lib/services/adminAnalytics";

export async function GET(request: Request, context: { params: Promise<{ serverId: string }> }) {
  try {
    await requireAdminAuth(request);
    const { serverId } = serverIdParamsSchema.parse(await context.params);
    const analytics = await getServerAnalytics(serverId);
    return apiOk(analytics);
  } catch (error) {
    return handleApiError(error);
  }
}
