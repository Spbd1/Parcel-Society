import { buildResearchExportZip } from "../../../../../lib/services/researchExport";
import { requireAdminAuth } from "../../../../../lib/api/auth";
import { handleApiError } from "../../../../../lib/api/responses";

export async function GET(request: Request) {
  try {
    await requireAdminAuth(request);
    const zip = await buildResearchExportZip({ type: "all" });

    return new Response(zip as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="parcel-society-all-export.zip"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
