import { prisma } from "@parcel-society/db";
import { assertParticipantOnServer, applyAuthCookie, getParticipantAuth } from "../../../../../lib/api/auth";
import { apiOk, handleApiError } from "../../../../../lib/api/responses";
import { serverIdParamsSchema } from "../../../../../lib/api/schemas";

export async function GET(_request: Request, context: { params: Promise<{ serverId: string }> }) {
  try {
    const { serverId } = serverIdParamsSchema.parse(await context.params);
    const auth = await getParticipantAuth();
    const player = await assertParticipantOnServer(auth.user.id, serverId);
    const [server, decisions, contracts] = await Promise.all([
      prisma.server.findUnique({ where: { id: serverId }, include: { players: true } }),
      prisma.decision.findMany({ where: { serverId, playerId: player.id } }),
      prisma.contract.findMany({
        where: { serverId, OR: [{ senderId: player.id }, { receiverId: player.id }] },
      }),
    ]);
    return applyAuthCookie(apiOk({ server, player, decisions, contracts }), auth);
  } catch (error) {
    return handleApiError(error);
  }
}
