import { prisma } from "@parcel-society/db";
import { requireAdminAuth } from "../../../../../../lib/api/auth";
import { handleApiError } from "../../../../../../lib/api/responses";
import { serverIdParamsSchema } from "../../../../../../lib/api/schemas";

const csvEscape = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  const text = value instanceof Date ? value.toISOString() : typeof value === "object" ? JSON.stringify(value) : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const tableToCsv = (rows: object[]): string => {
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  return [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => csvEscape((row as Record<string, unknown>)[header]))
        .join(","),
    ),
  ].join("\n");
};

export async function GET(request: Request, context: { params: Promise<{ serverId: string }> }) {
  try {
    await requireAdminAuth(request);
    const { serverId } = serverIdParamsSchema.parse(await context.params);
    const [players, parcels, decisions, contracts, serverEvents, treasuryTransactions, roundOutcomes] = await Promise.all([
      prisma.player.findMany({ where: { serverId }, orderBy: { createdAt: "asc" } }),
      prisma.parcel.findMany({ where: { serverId }, orderBy: [{ y: "asc" }, { x: "asc" }] }),
      prisma.decision.findMany({ where: { serverId }, orderBy: [{ roundNumber: "asc" }, { createdAt: "asc" }] }),
      prisma.contract.findMany({ where: { serverId }, orderBy: [{ roundNumber: "asc" }, { createdAt: "asc" }] }),
      prisma.serverEvent.findMany({ where: { serverId }, orderBy: [{ roundNumber: "asc" }, { createdAt: "asc" }] }),
      prisma.treasuryTransaction.findMany({ where: { serverId }, orderBy: [{ roundNumber: "asc" }, { createdAt: "asc" }] }),
      prisma.playerRoundState.findMany({ where: { serverId }, orderBy: [{ roundNumber: "asc" }, { playerId: "asc" }] }),
    ]);

    const files = {
      players: tableToCsv(players),
      parcels: tableToCsv(parcels),
      decisions: tableToCsv(decisions),
      contracts: tableToCsv(contracts),
      server_events: tableToCsv(serverEvents),
      treasury_transactions: tableToCsv(treasuryTransactions),
      round_outcomes: tableToCsv(roundOutcomes),
    };

    return Response.json({ ok: true, data: { files } });
  } catch (error) {
    return handleApiError(error);
  }
}
