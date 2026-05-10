import { prisma } from "@parcel-society/db";
import { assertParticipantOnServer, applyAuthCookie, getParticipantAuth } from "../../../../../lib/api/auth";
import { apiOk, handleApiError } from "../../../../../lib/api/responses";
import { serverIdParamsSchema } from "../../../../../lib/api/schemas";

export async function GET(_request: Request, context: { params: Promise<{ serverId: string }> }) {
  try {
    const { serverId } = serverIdParamsSchema.parse(await context.params);
    const auth = await getParticipantAuth();
    const player = await assertParticipantOnServer(auth.user.id, serverId);
    const [server, decisions, contracts, participantCount, exitedCount, wealthAggregate] = await Promise.all([
      prisma.server.findUnique({
        where: { id: serverId },
        select: {
          id: true,
          name: true,
          status: true,
          treasury: true,
          currentRound: true,
          seasonLength: true,
          inequalityCondition: true,
          uncertaintyCondition: true,
        },
      }),
      prisma.decision.findMany({ where: { serverId, playerId: player.id } }),
      prisma.contract.findMany({
        where: { serverId, OR: [{ senderId: player.id }, { receiverId: player.id }] },
      }),
      prisma.player.count({ where: { serverId } }),
      prisma.player.count({ where: { serverId, exited: true } }),
      prisma.player.aggregate({ where: { serverId }, _avg: { wealth: true } }),
    ]);
    return applyAuthCookie(apiOk({
      server,
      player,
      decisions,
      contracts,
      serverOutcomes: {
        participantCount,
        exitedCount,
        averageWealth: wealthAggregate._avg.wealth ?? 0,
      },
    }), auth);
  } catch (error) {
    return handleApiError(error);
  }
}
