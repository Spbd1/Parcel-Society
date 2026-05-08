import { requireAdminAuth } from "../../../../../../lib/api/auth";
import { apiOk, handleApiError } from "../../../../../../lib/api/responses";
import { generateMapSchema, serverIdParamsSchema } from "../../../../../../lib/api/schemas";
import { createServerMap } from "../../../../../../lib/services/game";

export async function POST(request: Request, context: { params: Promise<{ serverId: string }> }) {
  try {
    await requireAdminAuth(request);
    const { serverId } = serverIdParamsSchema.parse(await context.params);
    const body = generateMapSchema.parse(await request.json().catch(() => ({})));
    const result = await createServerMap({ serverId, width: body.width, height: body.height });
    return apiOk(result);
  } catch (error) {
    return handleApiError(error);
  }
}
