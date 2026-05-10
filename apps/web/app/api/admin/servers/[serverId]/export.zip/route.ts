import { buildResearchExportZip } from "../../../../../../lib/services/researchExport";
import { requireAdminAuth } from "../../../../../../lib/api/auth";
import { handleApiError } from "../../../../../../lib/api/responses";
import { serverIdParamsSchema } from "../../../../../../lib/api/schemas";

export async function GET(request: Request, context: { params: Promise<{ serverId: string }> }) {
  try {
    await requireAdminAuth(request);
    const { serverId } = serverIdParamsSchema.parse(await context.params);
    const zip = await buildResearchExportZip({ type: "server", serverId });

    return new Response(zip as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="parcel-society-${serverId}-export.zip"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
