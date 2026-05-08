import { prisma } from "@parcel-society/db";
import { assertParticipantOnServer, applyAuthCookie, getParticipantAuth } from "../../../../../lib/api/auth";
import { apiOk, handleApiError } from "../../../../../lib/api/responses";
import { serverIdParamsSchema } from "../../../../../lib/api/schemas";

export async function POST(_request: Request, context: { params: Promise<{ serverId: string }> }) {
  try {
    const { serverId } = serverIdParamsSchema.parse(await context.params);
    const auth = await getParticipantAuth();
    const player = await assertParticipantOnServer(auth.user.id, serverId);
    const server = await prisma.server.findUnique({ where: { id: serverId } });
    const updated = await prisma.player.update({
      where: { id: player.id },
      data: { exited: true, roundExited: server?.currentRound ?? player.roundExited },
    });
    return applyAuthCookie(apiOk({ player: updated }), auth);
  } catch (error) {
    return handleApiError(error);
  }
}
