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
        players: { select: { id: true, parcelId: true, exited: true } },
      },
    });
    const roundNumber = server?.rounds[0]?.roundNumber ?? server?.currentRound ?? 0;
    const decisions = await prisma.decision.findMany({
      where: { serverId, playerId: player.id, roundNumber },
      orderBy: { createdAt: "asc" },
    });
    return applyAuthCookie(apiOk({ server, player, decisions }), auth);
  } catch (error) {
    return handleApiError(error);
  }
}
