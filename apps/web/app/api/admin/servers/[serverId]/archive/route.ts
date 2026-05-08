import { prisma, ServerStatus } from "@parcel-society/db";
import { requireAdminAuth } from "../../../../../../lib/api/auth";
import { apiOk, handleApiError } from "../../../../../../lib/api/responses";
import { serverIdParamsSchema } from "../../../../../../lib/api/schemas";

export async function POST(request: Request, context: { params: Promise<{ serverId: string }> }) {
  try {
    await requireAdminAuth(request);
    const { serverId } = serverIdParamsSchema.parse(await context.params);
    const server = await prisma.server.update({ where: { id: serverId }, data: { status: ServerStatus.ARCHIVED } });
    return apiOk({ server });
  } catch (error) {
    return handleApiError(error);
  }
}
