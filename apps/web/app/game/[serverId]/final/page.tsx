"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { requestJson } from "../../../components/api";

type DecimalValue = number | string | { toString(): string };
type Player = { wealth: DecimalValue; productiveCapital: DecimalValue; safeAsset: DecimalValue; exited: boolean };
type Decision = { actionType: string; amount: DecimalValue };
type Contract = { fulfilled: boolean | null; defaulted: boolean | null };
type Server = { status: string; treasury: DecimalValue; players: Array<{ exited: boolean; wealth: DecimalValue }> };
type FinalResponse = { server: Server | null; player: Player; decisions: Decision[]; contracts: Contract[] };

const money = (value: DecimalValue | undefined) => Number(value ?? 0).toFixed(2);

export default function FinalPage() {
  const { serverId } = useParams<{ serverId: string }>();
  const [data, setData] = useState<FinalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    requestJson<FinalResponse>(`/api/servers/${serverId}/final-summary`)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load final season page."))
      .finally(() => setLoading(false));
  }, [serverId]);

  const totals = useMemo(() => {
    const decisions = data?.decisions ?? [];
    const fulfilled = data?.contracts.filter((contract) => contract.fulfilled).length ?? 0;
    const resolved = data?.contracts.filter((contract) => contract.fulfilled !== null || contract.defaulted !== null).length ?? 0;
    return {
      contributions: decisions.filter((decision) => decision.actionType === "PUBLIC_CONTRIBUTION").reduce((sum, decision) => sum + Number(decision.amount), 0),
      investments: decisions.filter((decision) => decision.actionType === "PRODUCTIVE_INVESTMENT").reduce((sum, decision) => sum + Number(decision.amount), 0),
      reliability: resolved === 0 ? "No resolved contracts" : `${Math.round((fulfilled / resolved) * 100)}% fulfilled`,
      exited: data?.player.exited || decisions.some((decision) => decision.actionType === "EXIT"),
      averageWealth: data?.server?.players.length ? data.server.players.reduce((sum, player) => sum + Number(player.wealth), 0) / data.server.players.length : 0,
      exits: data?.server?.players.filter((player) => player.exited).length ?? 0,
    };
  }, [data]);

  if (loading) return <p className="rounded-lg border border-slate-200 bg-white p-5 text-slate-700">Loading final season page...</p>;
  if (error) return <p className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700">{error}</p>;

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Final season page</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Your season results</h1>
        <p className="mt-3 text-slate-700">This page summarizes your choices and server-level outcomes. No real-money payout is shown.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[["Final wealth", money(data?.player.wealth)], ["Contribution total", money(totals.contributions)], ["Investment total", money(totals.investments)], ["Contract reliability", totals.reliability], ["Exited", totals.exited ? "Yes" : "No"], ["Final safe asset", money(data?.player.safeAsset)], ["Server treasury", money(data?.server?.treasury)], ["Server average wealth", money(totals.averageWealth)]].map(([label, value]) => (
          <div className="rounded-2xl border border-slate-200 bg-white p-5" key={label}>
            <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
            <dd className="mt-1 text-2xl font-bold text-slate-950">{value}</dd>
          </div>
        ))}
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-950">Server-level outcomes</h2>
        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-3"><dt className="text-slate-500">Server status</dt><dd className="font-semibold text-slate-900">{data?.server?.status ?? "Unknown"}</dd></div>
          <div className="rounded-lg bg-slate-50 p-3"><dt className="text-slate-500">Participants</dt><dd className="font-semibold text-slate-900">{data?.server?.players.length ?? 0}</dd></div>
          <div className="rounded-lg bg-slate-50 p-3"><dt className="text-slate-500">Exited participants</dt><dd className="font-semibold text-slate-900">{totals.exits}</dd></div>
        </dl>
      </article>

      <Link className="inline-flex rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white" href={`/game/${serverId}`}>Back to dashboard</Link>
    </section>
  );
}
