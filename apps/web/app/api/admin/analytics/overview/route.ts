import { prisma, ServerStatus } from "@parcel-society/db";
import { requireAdminAuth } from "../../../../../lib/api/auth";
import { apiOk, handleApiError } from "../../../../../lib/api/responses";
import { getAnalyticsOverview } from "../../../../../lib/services/adminAnalytics";

export async function GET(request: Request) {
  try {
    await requireAdminAuth(request);
    const [serversByStatus, playerCount, decisionCount, contractCount, treasuryAggregate, analytics] = await Promise.all([
      prisma.server.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.player.count(),
      prisma.decision.count(),
      prisma.contract.count(),
      prisma.server.aggregate({ _sum: { treasury: true }, where: { status: { not: ServerStatus.ARCHIVED } } }),
      getAnalyticsOverview(),
    ]);
    return apiOk({
      serversByStatus,
      playerCount,
      decisionCount,
      contractCount,
      activeTreasury: treasuryAggregate._sum.treasury ?? 0,
      analytics,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
