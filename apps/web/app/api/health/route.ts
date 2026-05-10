import { prisma } from "@parcel-society/db";

export const dynamic = "force-dynamic";

type HealthResponse = {
  ok: boolean;
  database: "connected" | "disconnected";
  timestamp: string;
};

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return Response.json({
      ok: true,
      database: "connected",
      timestamp,
    } satisfies HealthResponse);
  } catch (error) {
    console.error("Health check failed", error);

    return Response.json(
      {
        ok: false,
        database: "disconnected",
        timestamp,
      } satisfies HealthResponse,
      { status: 503 },
    );
  }
}
