import { randomUUID } from "node:crypto";
import { prisma, ServerStatus } from "@parcel-society/db";
import { requireAdminAuth } from "../../../../lib/api/auth";
import { apiOk, handleApiError } from "../../../../lib/api/responses";
import { createServerSchema } from "../../../../lib/api/schemas";

export async function GET(request: Request) {
  try {
    await requireAdminAuth(request);
    const servers = await prisma.server.findMany({
      include: { _count: { select: { players: true, parcels: true, decisions: true } } },
      orderBy: { createdAt: "desc" },
    });
    return apiOk({ servers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminAuth(request);
    const body = createServerSchema.parse(await request.json());
    const server = await prisma.server.create({
      data: {
        ...body,
        randomSeed: body.randomSeed ?? randomUUID(),
        status: ServerStatus.DRAFT,
      },
    });
    return apiOk({ server }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
