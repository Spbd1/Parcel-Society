import { notFound } from "next/navigation";
import { BarMetricChart, DistributionChart, LineMetricChart } from "../../../_components/AdminCharts";
import { formatMoney, formatNumber, formatPercent } from "../../../_components/format";
import { AdminPageHeader, Card, ConditionBadge, StatCard } from "../../../_components/ui";
import { getServerAnalytics } from "../../../../../lib/services/adminAnalytics";
import { ParcelMap } from "../parcels/ParcelMap";
import { ServerTabs } from "../ServerTabs";

type Props = { params: Promise<{ serverId: string }> };

const wealthHistogram = (wealthValues: number[]) => {
  if (wealthValues.length === 0) return [];
  const minimum = Math.min(...wealthValues);
  const maximum = Math.max(...wealthValues);
  const binCount = 8;
  const width = Math.max((maximum - minimum) / binCount, 1);
  return Array.from({ length: binCount }, (_, index) => {
    const start = minimum + index * width;
    const end = index === binCount - 1 ? maximum : start + width;
    return {
      name: `${formatNumber(start)}–${formatNumber(end)}`,
      value: wealthValues.filter((value) => value >= start && (index === binCount - 1 ? value <= end : value < end)).length,
    };
  });
};

export default async function AnalyticsPage({ params }: Props) {
  const { serverId } = await params;
  let analytics: Awaited<ReturnType<typeof getServerAnalytics>>;
  try {
    analytics = await getServerAnalytics(serverId);
  } catch {
    notFound();
  }

  const { server, rounds, latest, players, parcels } = analytics;
  const chartData = rounds.map((round) => ({
    round: round.round,
    productiveInvestmentShare: round.productiveInvestmentShare,
    publicContributionShare: round.publicContributionShare,
    informalCooperationRate: round.informalCooperationRate,
    contractReliability: round.contractReliability,
    exitRate: round.exitRate,
    formalContracts: round.formalContractsStarted,
    informalContracts: round.informalContractsStarted,
  }));
  const histogram = wealthHistogram(players.map((player) => player.finalWealth));

  return (
    <>
      <AdminPageHeader
        title={`${server.name}: analytics`}
        description="Treatment-aware round outcomes, contract mix, wealth distribution, and parcel quality diagnostics."
        actions={<><ConditionBadge value={server.inequalityCondition} /><ConditionBadge value={server.uncertaintyCondition} /></>}
      />
      <ServerTabs serverId={serverId} />
      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Current round" value={server.currentRound} hint={`${server.seasonLength} scheduled rounds`} />
        <StatCard label="Productive investment" value={formatPercent(latest?.productiveInvestmentShare ?? 0)} hint="Latest round share" />
        <StatCard label="Public contribution" value={formatPercent(latest?.publicContributionShare ?? 0)} hint="Latest round share" />
        <StatCard label="Informal cooperation" value={formatPercent(latest?.informalCooperationRate ?? 0)} hint="Informal / all contracts" />
        <StatCard label="Contract reliability" value={formatPercent(latest?.contractReliability ?? 0)} hint="Fulfilled / resolved" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card><h2 className="mb-4 text-lg font-semibold">Productive investment share over rounds</h2><LineMetricChart data={chartData} lines={["productiveInvestmentShare"]} /></Card>
        <Card><h2 className="mb-4 text-lg font-semibold">Public contribution share over rounds</h2><LineMetricChart data={chartData} lines={["publicContributionShare"]} /></Card>
        <Card><h2 className="mb-4 text-lg font-semibold">Informal cooperation rate over rounds</h2><LineMetricChart data={chartData} lines={["informalCooperationRate"]} /></Card>
        <Card><h2 className="mb-4 text-lg font-semibold">Contract reliability over rounds</h2><LineMetricChart data={chartData} lines={["contractReliability"]} /></Card>
        <Card><h2 className="mb-4 text-lg font-semibold">Exit rate over rounds</h2><LineMetricChart data={chartData} lines={["exitRate"]} /></Card>
        <Card><h2 className="mb-4 text-lg font-semibold">Formal vs informal contracts</h2><BarMetricChart data={chartData} bars={["formalContracts", "informalContracts"]} /></Card>
        <Card className="xl:col-span-2"><h2 className="mb-4 text-lg font-semibold">Final wealth distribution</h2><DistributionChart data={histogram} /></Card>
        <Card className="xl:col-span-2"><h2 className="mb-4 text-lg font-semibold">Parcel quality map</h2><ParcelMap parcels={parcels} /></Card>
        <Card className="xl:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Round outcomes</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  {["Round", "Prod. invest", "Public", "Informal", "Reliability", "Exit", "Safe", "Lobbying", "Output", "Treasury", "Active", "Wealth Gini", "Parcel Gini", "Formal share", "Avg wealth", "Median wealth"].map((header) => <th className="px-3 py-2" key={header}>{header}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rounds.map((round) => (
                  <tr key={round.round} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-950">{round.round}</td>
                    <td className="px-3 py-2">{formatPercent(round.productiveInvestmentShare)}</td>
                    <td className="px-3 py-2">{formatPercent(round.publicContributionShare)}</td>
                    <td className="px-3 py-2">{formatPercent(round.informalCooperationRate)}</td>
                    <td className="px-3 py-2">{formatPercent(round.contractReliability)}</td>
                    <td className="px-3 py-2">{formatPercent(round.exitRate)}</td>
                    <td className="px-3 py-2">{formatPercent(round.safeAssetShare)}</td>
                    <td className="px-3 py-2">{formatPercent(round.lobbyingShare)}</td>
                    <td className="px-3 py-2">{formatNumber(round.totalOutput, 2)}</td>
                    <td className="px-3 py-2">{formatMoney(round.treasuryBalance)}</td>
                    <td className="px-3 py-2">{round.activePlayers}</td>
                    <td className="px-3 py-2">{formatNumber(round.finalWealthGini, 3)}</td>
                    <td className="px-3 py-2">{formatNumber(round.initialParcelQualityGini, 3)}</td>
                    <td className="px-3 py-2">{formatPercent(round.formalContractShare)}</td>
                    <td className="px-3 py-2">{formatMoney(round.averageWealth)}</td>
                    <td className="px-3 py-2">{formatMoney(round.medianWealth)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
