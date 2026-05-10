import { buildResearchExportZip } from "../../../../../lib/services/researchExport";
import { requireSuperAdminAuth } from "../../../../../lib/api/auth";
import { handleApiError } from "../../../../../lib/api/responses";
import { rateLimit } from "../../../../../lib/api/rateLimit";
import { recordAdminAction } from "../../../../../lib/api/audit";

export async function GET(request: Request) {
  try {
    rateLimit({ request, key: "global-export-zip", limit: 3, windowMs: 60_000 });
    const auth = await requireSuperAdminAuth(request);
    const zip = await buildResearchExportZip({ type: "all" });
    await recordAdminAction({ auth, action: "EXPORT_DATA", entityType: "global", entityId: "all", after: { format: "zip" } });

    return new Response(zip as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="parcel-society-all-export.zip"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleApiError(error, { route: "GET /api/admin/export/all.zip" });
  }
}
