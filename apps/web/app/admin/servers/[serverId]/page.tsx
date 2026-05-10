import { notFound } from "next/navigation";
import { prisma } from "@parcel-society/db";
import { AdminActions } from "../../_components/AdminActions";
import { AdminPageHeader, Card, ConditionBadge, ServerStatusBadge, StatCard } from "../../_components/ui";
import { formatMoney, formatNumber, gini, numberValue } from "../../_components/format";
import { ServerTabs } from "./ServerTabs";

type Props = { params: Promise<{ serverId: string }> };

export default async function ServerDetailPage({ params }: Props) {
  const { serverId } = await params;
  const server = await prisma.server.findUnique({
    where: { id: serverId },
    include: {
      players: { include: { parcel: true } },
      parcels: true,
      rounds: { orderBy: { roundNumber: "desc" } },
      _count: { select: { players: true, decisions: true, parcels: true } },
    },
  });
  if (!server) notFound();
  const activeRound = server.rounds.find((round) => round.status === "ACTIVE");
  const submittedPlayers = activeRound ? new Set((await prisma.decision.findMany({ where: { serverId, roundNumber: activeRound.roundNumber }, select: { playerId: true } })).map((decision) => decision.playerId)).size : 0;
  const activePlayers = server.players.filter((player) => !player.exited).length;
  const missing = Math.max(activePlayers - submittedPlayers, 0);
  const qualityGini = gini(server.parcels.map((parcel) => numberValue(parcel.quality)));
  const config = server.config && typeof server.config === "object" && !Array.isArray(server.config) ? server.config as Record<string, unknown> : {};
  return (
    <>
      <AdminPageHeader title={server.name} description={server.description ?? "No description provided."} actions={<ServerStatusBadge status={server.status} />} />
      <ServerTabs serverId={serverId} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Status" value={<ServerStatusBadge status={server.status} />} hint={<><ConditionBadge value={server.inequalityCondition} /> <ConditionBadge value={server.uncertaintyCondition} /></>} />
        <StatCard label="Current round" value={activeRound?.roundNumber ?? server.currentRound} hint={`${server.seasonLength} scheduled rounds`} />
        <StatCard label="Players" value={`${server._count.players}/${server.maxPlayers}`} hint={`${activePlayers} active`} />
        <StatCard label="Treasury" value={formatMoney(server.treasury)} />
        <StatCard label="Parcel-quality Gini" value={qualityGini.toFixed(3)} hint={`${server._count.parcels} parcels`} />
        <StatCard label="Total decisions" value={formatNumber(server._count.decisions)} />
        <StatCard label="Tax rate" value={formatNumber(Number(config.taxRate ?? 0.15), 2)} />
        <StatCard label="Shock probability" value={formatNumber(Number(config.shockProbability ?? 0), 2)} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card><h2 className="mb-3 text-lg font-semibold">Config summary</h2><pre className="overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify({ maxPlayers: server.maxPlayers, seasonLength: server.seasonLength, randomSeed: server.randomSeed, ...config }, null, 2)}</pre></Card>
        <Card><h2 className="mb-3 text-lg font-semibold">Actions</h2><AdminActions actions={[
          { label: "Generate map", url: `/api/admin/servers/${serverId}/generate-map`, body: { width: 10, height: 10 }, confirm: "Replace this server's map? This is only allowed before players join." },
          { label: "Open waiting room", url: `/api/admin/servers/${serverId}`, kind: "patch", body: { status: "WAITING" }, confirm: "Open this server for participant joins?" },
          { label: "Start season", url: `/api/admin/servers/${serverId}/start`, confirm: "Start the season and activate round 1?" },
          { label: "Resolve current round", url: `/api/admin/servers/${serverId}/resolve-round`, confirm: "Resolve the active round?", preview: { submitted: submittedPlayers, missing, currentRound: activeRound?.roundNumber ?? server.currentRound, nextRound: (activeRound?.roundNumber ?? server.currentRound) + 1 } },
          { label: "Complete season", url: `/api/admin/servers/${serverId}`, kind: "patch", body: { status: "COMPLETED" }, confirm: "Mark this season as completed?", destructive: true },
          { label: "Archive server", url: `/api/admin/servers/${serverId}/archive`, confirm: "Archive this server?", destructive: true },
          { label: "Export data", url: `/api/admin/servers/${serverId}/export`, kind: "export" },
        ]} /></Card>
      </div>
    </>
  );
}
