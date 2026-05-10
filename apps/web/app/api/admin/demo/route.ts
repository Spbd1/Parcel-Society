import { prisma, seedDemo } from "@parcel-society/db";
import { recordAdminAction } from "../../../../lib/api/audit";
import { requireAdminAuth } from "../../../../lib/api/auth";
import {
  apiOk,
  handleApiError,
  ApiException,
} from "../../../../lib/api/responses";

export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV === "production") {
      throw new ApiException(
        403,
        "DEMO_SEED_DISABLED",
        "Demo experiment creation is disabled in production.",
      );
    }

    const auth = await requireAdminAuth(request);
    const result = await seedDemo(prisma);
    await recordAdminAction({
      auth,
      action: "CREATE_DEMO_EXPERIMENT",
      entityType: "demo",
      entityId: "demo-seed",
      after: result,
    });
    return apiOk({ demo: result });
  } catch (error) {
    return handleApiError(error, { route: "POST /api/admin/demo" });
  }
}
