import { joinServerSchema } from "../../../lib/api/schemas";
import { apiOk, handleApiError } from "../../../lib/api/responses";
import { applyAuthCookie, getParticipantAuth } from "../../../lib/api/auth";
import { joinWaitingServer } from "../../../lib/services/game";

export async function POST(request: Request) {
  try {
    const auth = await getParticipantAuth();
    const body = joinServerSchema.parse(await request.json());
    const player = await joinWaitingServer({ userId: auth.user.id, serverId: body.serverId });
    return applyAuthCookie(apiOk({ user: auth.user, player }), auth);
  } catch (error) {
    return handleApiError(error);
  }
}
