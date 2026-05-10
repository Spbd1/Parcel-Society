import { prisma } from "@parcel-society/db";

export const dynamic = "force-dynamic";

type HealthResponse = {
  ok: boolean;
  database: "connected" | "disconnected";
  applicationTable: "Server";
  timestamp: string;
};

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    await prisma.server.count();

    return Response.json({
      ok: true,
      database: "connected",
      applicationTable: "Server",
      timestamp,
    } satisfies HealthResponse);
  } catch (error) {
    console.error("Health check failed", error);

    return Response.json(
      {
        ok: false,
        database: "disconnected",
        applicationTable: "Server",
        timestamp,
      } satisfies HealthResponse,
      { status: 503 },
    );
  }
}
