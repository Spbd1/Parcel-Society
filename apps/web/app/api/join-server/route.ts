import { prisma } from "@parcel-society/db";
import { joinServerSchema } from "../../../lib/api/schemas";
import { ApiException, apiOk, handleApiError } from "../../../lib/api/responses";
import { applyAuthCookie, getParticipantAuth } from "../../../lib/api/auth";
import { joinWaitingServer } from "../../../lib/services/game";
import { rateLimit } from "../../../lib/api/rateLimit";

export async function POST(request: Request) {
  try {
    rateLimit({ request, key: "join-server", limit: 10, windowMs: 60_000 });
    const auth = await getParticipantAuth();
    const body = joinServerSchema.parse(await request.json());
    const passedCheck = await prisma.comprehensionCheck.findFirst({
      where: { userId: auth.user.id, passed: true },
    });
    if (!passedCheck) {
      throw new ApiException(403, "COMPREHENSION_CHECK_REQUIRED", "Pass the comprehension check before joining a server.");
    }
    const player = await joinWaitingServer({ userId: auth.user.id, serverId: body.serverId });
    return applyAuthCookie(apiOk({ user: auth.user, player }), auth);
  } catch (error) {
    return handleApiError(error);
  }
}
