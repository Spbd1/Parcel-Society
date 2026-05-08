import { prisma, ServerStatus } from "@parcel-society/db";
import { applyAuthCookie, getParticipantAuth } from "../../../../lib/api/auth";
import { apiOk, handleApiError } from "../../../../lib/api/responses";

export async function GET() {
  try {
    const auth = await getParticipantAuth();
    const servers = await prisma.server.findMany({
      where: { status: ServerStatus.WAITING },
      include: { _count: { select: { players: true, parcels: true } } },
      orderBy: { createdAt: "desc" },
    });
    return applyAuthCookie(apiOk({ servers }), auth);
  } catch (error) {
    return handleApiError(error);
  }
}
