import { buildResearchExportZip } from "../../../../../../lib/services/researchExport";
import { requireAdminAuth } from "../../../../../../lib/api/auth";
import { handleApiError } from "../../../../../../lib/api/responses";
import { serverIdParamsSchema } from "../../../../../../lib/api/schemas";
import { rateLimit } from "../../../../../../lib/api/rateLimit";
import { recordAdminAction } from "../../../../../../lib/api/audit";

export async function GET(request: Request, context: { params: Promise<{ serverId: string }> }) {
  try {
    rateLimit({ request, key: "server-export-zip", limit: 6, windowMs: 60_000 });
    const auth = await requireAdminAuth(request);
    const { serverId } = serverIdParamsSchema.parse(await context.params);
    const zip = await buildResearchExportZip({ type: "server", serverId });
    await recordAdminAction({ auth, action: "EXPORT_DATA", entityType: "server", entityId: serverId, after: { format: "zip" } });

    return new Response(zip as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="parcel-society-${serverId}-export.zip"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleApiError(error, { route: "GET /api/admin/servers/[serverId]/export.zip" });
  }
}
