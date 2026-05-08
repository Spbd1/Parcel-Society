"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { requestJson } from "../../../components/api";

type DecimalValue = number | string | { toString(): string };
type Decision = { id: string; actionType: string; amount: DecimalValue };
type Contract = { id: string; contractType: string; value: DecimalValue; fulfilled: boolean | null; defaulted: boolean | null };
type Event = { id: string; eventType: string; value: unknown };
type Summary = { roundNumber: number; wealth: DecimalValue; productiveCapital: DecimalValue; safeAsset: DecimalValue; reputation: DecimalValue; exited: boolean; state: Record<string, unknown> } | null;
type SummaryResponse = { summary: Summary; decisions: Decision[]; contracts: Contract[]; events: Event[]; server: { treasury: DecimalValue } | null };

const money = (value: DecimalValue | undefined) => Number(value ?? 0).toFixed(2);

export default function RoundSummaryPage() {
  const { serverId } = useParams<{ serverId: string }>();
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    requestJson<SummaryResponse>(`/api/servers/${serverId}/round-summary`)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load summary."))
      .finally(() => setLoading(false));
  }, [serverId]);

  const totals = useMemo(() => {
    const decisions = data?.decisions ?? [];
    return {
      produced: Number(data?.summary?.state?.outputProduced ?? data?.summary?.state?.output ?? 0),
      investments: decisions.filter((decision) => ["PRODUCTIVE_INVESTMENT", "SAFE_ASSET"].includes(decision.actionType)).reduce((sum, decision) => sum + Number(decision.amount), 0),
      contribution: decisions.filter((decision) => decision.actionType === "PUBLIC_CONTRIBUTION").reduce((sum, decision) => sum + Number(decision.amount), 0),
    };
  }, [data]);

  if (loading) return <p className="rounded-lg border border-slate-200 bg-white p-5 text-slate-700">Loading round summary...</p>;
  if (error) return <p className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700">{error}</p>;

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Round summary</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Round {data?.summary?.roundNumber ?? "not resolved yet"}</h1>
        <p className="mt-3 text-slate-700">Review the latest resolved round and your current standing.</p>
      </div>

      {!data?.summary ? <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">No resolved round summary is available yet.</p> : null}

      <div className="grid gap-4 md:grid-cols-3">
        {[["Output produced", money(totals.produced)], ["Investments", money(totals.investments)], ["Treasury contribution", money(totals.contribution)], ["Current wealth", money(data?.summary?.wealth)], ["Safe asset", money(data?.summary?.safeAsset)], ["Reputation", money(data?.summary?.reputation)]].map(([label, value]) => (
          <div className="rounded-2xl border border-slate-200 bg-white p-5" key={label}><dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 text-2xl font-bold text-slate-950">{value}</dd></div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-950">Contracts created</h2>
          {data?.contracts.length ? <ul className="mt-3 space-y-2 text-sm">{data.contracts.map((contract) => <li className="rounded-lg bg-slate-50 p-3" key={contract.id}>{contract.contractType} · value {money(contract.value)} · {contract.fulfilled ? "fulfilled" : contract.defaulted ? "defaulted" : "pending"}</li>)}</ul> : <p className="mt-3 text-sm text-slate-600">No contracts recorded for this round.</p>}
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-950">Shocks and rule changes</h2>
          {data?.events.length ? <ul className="mt-3 space-y-2 text-sm">{data.events.map((event) => <li className="rounded-lg bg-slate-50 p-3" key={event.id}>{event.eventType}</li>)}</ul> : <p className="mt-3 text-sm text-slate-600">No shocks or rule changes recorded.</p>}
        </article>
      </div>

      <Link className="inline-flex rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white" href={`/game/${serverId}`}>Back to dashboard</Link>
    </section>
  );
}
