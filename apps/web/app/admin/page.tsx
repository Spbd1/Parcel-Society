import Link from "next/link";
import { prisma } from "@parcel-society/db";
import { AdminPageHeader, Card, StatCard, ButtonLink } from "./_components/ui";
import { formatDate, formatNumber } from "./_components/format";

export default async function AdminPage() {
  const [servers, totalPlayers, activePlayers, exitedPlayers, totalDecisions, recentEvents] = await Promise.all([
    prisma.server.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.player.count(),
    prisma.player.count({ where: { exited: false } }),
    prisma.player.count({ where: { exited: true } }),
    prisma.decision.count(),
    prisma.serverEvent.findMany({ take: 8, orderBy: { createdAt: "desc" }, include: { server: { select: { id: true, name: true } } } }),
  ]);
  const count = (status?: string) => status ? servers.find((row) => row.status === status)?._count._all ?? 0 : servers.reduce((total, row) => total + row._count._all, 0);
  return (
    <>
      <AdminPageHeader title="Admin dashboard" description="Operational overview of Parcel Society servers, participation, decisions, and events." actions={<ButtonLink href="/admin/servers/new">Create server</ButtonLink>} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total servers" value={formatNumber(count())} />
        <StatCard label="Active servers" value={formatNumber(count("ACTIVE"))} />
        <StatCard label="Waiting servers" value={formatNumber(count("WAITING"))} />
        <StatCard label="Completed servers" value={formatNumber(count("COMPLETED"))} />
        <StatCard label="Total players" value={formatNumber(totalPlayers)} />
        <StatCard label="Active players" value={formatNumber(activePlayers)} />
        <StatCard label="Exited players" value={formatNumber(exitedPlayers)} />
        <StatCard label="Total decisions" value={formatNumber(totalDecisions)} />
      </div>
      <Card className="mt-6">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Recent server events</h2><Link className="text-sm font-semibold text-slate-700" href="/admin/servers">View servers</Link></div>
        <div className="space-y-3">
          {recentEvents.map((event) => <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-100 p-3" key={event.id}><div><p className="font-medium text-slate-950">{event.eventType} <span className="text-slate-500">round {event.roundNumber}</span></p><Link className="text-sm text-slate-600 hover:text-slate-950" href={`/admin/servers/${event.server.id}`}>{event.server.name}</Link></div><p className="text-xs text-slate-500">{formatDate(event.createdAt)}</p></div>)}
          {recentEvents.length === 0 ? <p className="text-sm text-slate-500">No events have been recorded yet.</p> : null}
        </div>
      </Card>
    </>
  );
}
