import { prisma } from "@parcel-society/db";
import { assertParticipantOnServer, applyAuthCookie, getParticipantAuth } from "../../../../../lib/api/auth";
import { apiOk, handleApiError } from "../../../../../lib/api/responses";
import { serverIdParamsSchema } from "../../../../../lib/api/schemas";

export async function GET(_request: Request, context: { params: Promise<{ serverId: string }> }) {
  try {
    const { serverId } = serverIdParamsSchema.parse(await context.params);
    const auth = await getParticipantAuth();
    const player = await assertParticipantOnServer(auth.user.id, serverId);
    const latest = await prisma.playerRoundState.findFirst({
      where: { serverId, playerId: player.id },
      orderBy: { roundNumber: "desc" },
    });
    return applyAuthCookie(apiOk({ summary: latest?.state ?? null }), auth);
  } catch (error) {
    return handleApiError(error);
  }
}
