import Link from "next/link";
import { prisma } from "@parcel-society/db";
import { AdminActions } from "./_components/AdminActions";
import { BarMetricChart, PieMetricChart } from "./_components/AdminCharts";
import { AdminPageHeader, Card, StatCard, ButtonLink } from "./_components/ui";
import { formatDate, formatNumber } from "./_components/format";
import { getAnalyticsOverview } from "../../lib/services/adminAnalytics";

export default async function AdminPage() {
  const [
    servers,
    totalPlayers,
    activePlayers,
    exitedPlayers,
    totalDecisions,
    recentEvents,
    actionMix,
    analyticsOverview,
  ] = await Promise.all([
    prisma.server.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.player.count(),
    prisma.player.count({ where: { exited: false } }),
    prisma.player.count({ where: { exited: true } }),
    prisma.decision.count(),
    prisma.serverEvent.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { server: { select: { id: true, name: true } } },
    }),
    prisma.decision.groupBy({ by: ["actionType"], _count: { _all: true } }),
    getAnalyticsOverview(),
  ]);
  const count = (status?: string) =>
    status
      ? (servers.find((row) => row.status === status)?._count._all ?? 0)
      : servers.reduce((total, row) => total + row._count._all, 0);
  const overviewChart = analyticsOverview.servers.map((server) => ({
    round: server.name.replace("Demo ", ""),
    exitRate: Number(((server.latest?.exitRate ?? 0) * 100).toFixed(1)),
    investmentShare: Number(
      ((server.latest?.productiveInvestmentShare ?? 0) * 100).toFixed(1),
    ),
    publicShare: Number(
      ((server.latest?.publicContributionShare ?? 0) * 100).toFixed(1),
    ),
  }));
  const actionMixChart = actionMix.map((row) => ({
    name: row.actionType.replaceAll("_", " "),
    value: row._count._all,
  }));
  const headerActions = (
    <>
      {process.env.NODE_ENV === "development" ? (
        <AdminActions
          actions={[
            {
              label: "Create Demo Experiment",
              url: "/api/admin/demo",
              confirm:
                "Replace any existing demo servers with a fresh four-server demo experiment?",
            },
          ]}
        />
      ) : null}
      <ButtonLink href="/admin/servers/new">Create server</ButtonLink>
    </>
  );
  return (
    <>
      <AdminPageHeader
        title="Admin dashboard"
        description="Operational overview of Parcel Society servers, participation, decisions, and events."
        actions={headerActions}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total servers" value={formatNumber(count())} />
        <StatCard
          label="Active servers"
          value={formatNumber(count("ACTIVE"))}
        />
        <StatCard
          label="Waiting servers"
          value={formatNumber(count("WAITING"))}
        />
        <StatCard
          label="Completed servers"
          value={formatNumber(count("COMPLETED"))}
        />
        <StatCard label="Total players" value={formatNumber(totalPlayers)} />
        <StatCard label="Active players" value={formatNumber(activePlayers)} />
        <StatCard label="Exited players" value={formatNumber(exitedPlayers)} />
        <StatCard
          label="Total decisions"
          value={formatNumber(totalDecisions)}
        />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Demo outcomes by server</h2>
          <p className="mt-1 text-sm text-slate-500">
            Latest available exit, investment, and public-good contribution
            rates.
          </p>
          {overviewChart.length > 0 ? (
            <BarMetricChart
              data={overviewChart}
              bars={["exitRate", "investmentShare", "publicShare"]}
            />
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Seed demo data to populate this chart.
            </p>
          )}
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Decision mix</h2>
          <p className="mt-1 text-sm text-slate-500">
            Synthetic and participant decisions grouped by action type.
          </p>
          {actionMixChart.length > 0 ? (
            <PieMetricChart data={actionMixChart} />
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              No decisions have been recorded yet.
            </p>
          )}
        </Card>
      </div>
      <Card className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent server events</h2>
          <Link
            className="text-sm font-semibold text-slate-700"
            href="/admin/servers"
          >
            View servers
          </Link>
        </div>
        <div className="space-y-3">
          {recentEvents.map((event) => (
            <div
              className="flex items-start justify-between gap-4 rounded-lg border border-slate-100 p-3"
              key={event.id}
            >
              <div>
                <p className="font-medium text-slate-950">
                  {event.eventType}{" "}
                  <span className="text-slate-500">
                    round {event.roundNumber}
                  </span>
                </p>
                <Link
                  className="text-sm text-slate-600 hover:text-slate-950"
                  href={`/admin/servers/${event.server.id}`}
                >
                  {event.server.name}
                </Link>
              </div>
              <p className="text-xs text-slate-500">
                {formatDate(event.createdAt)}
              </p>
            </div>
          ))}
          {recentEvents.length === 0 ? (
            <p className="text-sm text-slate-500">
              No events have been recorded yet.
            </p>
          ) : null}
        </div>
      </Card>
    </>
  );
}
