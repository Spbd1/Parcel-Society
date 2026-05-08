import { prisma } from "@parcel-society/db";
import { applyAuthCookie, getParticipantAuth } from "../../../lib/api/auth";
import { apiOk, handleApiError } from "../../../lib/api/responses";

export async function GET() {
  try {
    const auth = await getParticipantAuth();
    const players = await prisma.player.findMany({
      where: { userId: auth.user.id },
      include: { server: true, parcel: true },
    });
    return applyAuthCookie(apiOk({ user: auth.user, players }), auth);
  } catch (error) {
    return handleApiError(error);
  }
}
