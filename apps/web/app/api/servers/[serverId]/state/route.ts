import { prisma } from "@parcel-society/db";
import { assertParticipantOnServer, applyAuthCookie, getParticipantAuth } from "../../../../../lib/api/auth";
import { handleApiError, apiOk } from "../../../../../lib/api/responses";
import { serverIdParamsSchema } from "../../../../../lib/api/schemas";

export async function GET(_request: Request, context: { params: Promise<{ serverId: string }> }) {
  try {
    const { serverId } = serverIdParamsSchema.parse(await context.params);
    const auth = await getParticipantAuth();
    const player = await assertParticipantOnServer(auth.user.id, serverId);
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        parcels: true,
        rounds: { orderBy: { roundNumber: "desc" }, take: 1 },
        players: { select: { id: true, parcelId: true, wealth: true, exited: true } },
      },
    });
    return applyAuthCookie(apiOk({ server, player }), auth);
  } catch (error) {
    return handleApiError(error);
  }
}
