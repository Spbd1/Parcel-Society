"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { DEFAULT_ACTION_POINTS, DEFAULT_MAP_HEIGHT, DEFAULT_MAP_WIDTH } from "@parcel-society/shared";
import { requestJson } from "../../components/api";

const actionLabels = {
  PRODUCE: "Produce",
  PRODUCTIVE_INVESTMENT: "Productive Investment",
  SAFE_ASSET: "Safe Asset",
  PUBLIC_CONTRIBUTION: "Public Contribution",
  INFORMAL_CONTRACT: "Informal Contract",
  FORMAL_CONTRACT: "Formal Contract",
  LOBBYING: "Lobbying",
  EXIT: "Exit",
} as const;

type ActionType = keyof typeof actionLabels;
type DecimalValue = number | string | { toString(): string };
type Parcel = { id: string; x: number; y: number; quality: DecimalValue; ownerId: string | null };
type Player = { id: string; parcelId: string; wealth: DecimalValue; productiveCapital?: DecimalValue; safeAsset?: DecimalValue; reputation?: DecimalValue; exited: boolean };
type Server = {
  id: string;
  name: string;
  status: string;
  currentRound: number;
  seasonLength: number;
  treasury: DecimalValue;
  inequalityCondition: "LOW" | "HIGH";
  uncertaintyCondition: "STABLE" | "UNCERTAIN";
  parcels: Parcel[];
  players: Array<Pick<Player, "id" | "parcelId" | "wealth" | "reputation" | "exited">>;
  rounds: Array<{ roundNumber: number; status: string }>;
};
type Decision = { id: string; actionType: ActionType; amount: DecimalValue; targetPlayerId: string | null; createdAt: string };
type StateResponse = { server: Server | null; player: Player; decisions: Decision[] };
type DraftDecision = { type: ActionType; amount: string; counterpartyId: string };

const money = (value: DecimalValue | undefined) => Number(value ?? 0).toFixed(2);
const quality = (value: DecimalValue) => Number(value).toFixed(2);

export default function GamePage() {
  const params = useParams<{ serverId: string }>();
  const serverId = params.serverId;
  const [data, setData] = useState<StateResponse | null>(null);
  const [selected, setSelected] = useState<ActionType[]>([]);
  const [drafts, setDrafts] = useState<Record<ActionType, DraftDecision>>({} as Record<ActionType, DraftDecision>);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    requestJson<StateResponse>(`/api/servers/${serverId}/state`)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load game."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [serverId]);

  const server = data?.server;
  const player = data?.player;
  const playerParcel = useMemo(() => server?.parcels.find((parcel) => parcel.id === player?.parcelId), [server, player]);
  const roundNumber = server?.rounds[0]?.roundNumber ?? server?.currentRound ?? 0;
  const remaining = DEFAULT_ACTION_POINTS - selected.length;

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (selected.length === 0) errors.push("Select at least one action.");
    if (selected.length > DEFAULT_ACTION_POINTS) errors.push("You can use at most 3 action points per round.");
    selected.forEach((type) => {
      const draft = drafts[type];
      if (["PRODUCTIVE_INVESTMENT", "SAFE_ASSET", "PUBLIC_CONTRIBUTION", "LOBBYING"].includes(type) && (!draft?.amount || Number(draft.amount) <= 0)) {
        errors.push(`${actionLabels[type]} needs an amount greater than 0.`);
      }
      if (["INFORMAL_CONTRACT", "FORMAL_CONTRACT"].includes(type)) {
        if (!draft?.counterpartyId) errors.push(`${actionLabels[type]} needs a target player.`);
        if (!draft?.amount || Number(draft.amount) <= 0) errors.push(`${actionLabels[type]} needs an amount greater than 0.`);
      }
    });
    return errors;
  }, [drafts, selected]);

  const toggleAction = (type: ActionType) => {
    setSuccess(null);
    setSelected((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type]);
    setDrafts((current) => ({ ...current, [type]: current[type] ?? { type, amount: "", counterpartyId: "" } }));
  };

  const updateDraft = (type: ActionType, patch: Partial<DraftDecision>) => {
    setDrafts((current) => ({ ...current, [type]: { ...(current[type] ?? { type, amount: "", counterpartyId: "" }), ...patch } }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (validationErrors.length > 0) return;
    setSubmitting(true);
    try {
      await requestJson(`/api/servers/${serverId}/decisions`, {
        method: "POST",
        body: JSON.stringify({
          decisions: selected.map((type) => ({
            type,
            amount: drafts[type]?.amount ? Number(drafts[type].amount) : undefined,
            counterpartyId: drafts[type]?.counterpartyId || undefined,
            parcelId: player?.parcelId,
            payload: { contractType: type === "FORMAL_CONTRACT" ? "FORMAL" : type === "INFORMAL_CONTRACT" ? "INFORMAL" : undefined },
          })),
        }),
      });
      setSelected([]);
      setDrafts({} as Record<ActionType, DraftDecision>);
      setSuccess("Decisions submitted for this round.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit decisions.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="rounded-lg border border-slate-200 bg-white p-5 text-slate-700">Loading game dashboard...</p>;
  if (!server || !player) return <p className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700">Game server was not found or you are not joined.</p>;

  const otherPlayers = server.players.filter((candidate) => candidate.id !== player.id);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Round {roundNumber || "Waiting"}</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">{server.name}</h1>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-800">Inequality: {server.inequalityCondition}</span>
            <span className="rounded-full bg-purple-100 px-3 py-1 text-purple-800">Institution: {server.uncertaintyCondition}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Status: {server.status}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold" href={`/game/${serverId}/summary`}>Round Summary</Link>
          <Link className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold" href={`/game/${serverId}/final`}>Final</Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[["Wealth", money(player.wealth)], ["Productive capital", money(player.productiveCapital)], ["Safe asset", money(player.safeAsset)], ["Reputation", money(player.reputation)], ["Parcel quality", playerParcel ? quality(playerParcel.quality) : "—"], ["Treasury", money(server.treasury)]].map(([label, value]) => (
          <div className="rounded-2xl border border-slate-200 bg-white p-4" key={label}>
            <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
            <dd className="mt-1 text-xl font-bold text-slate-950">{value}</dd>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-950">10x10 map</h2>
          <div className="mt-4 grid w-full max-w-xl grid-cols-10 gap-1">
            {Array.from({ length: DEFAULT_MAP_WIDTH * DEFAULT_MAP_HEIGHT }).map((_, index) => {
              const x = index % DEFAULT_MAP_WIDTH;
              const y = Math.floor(index / DEFAULT_MAP_WIDTH);
              const parcel = server.parcels.find((item) => item.x === x && item.y === y);
              const mine = parcel?.id === player.parcelId;
              return <div className={`aspect-square rounded border text-[10px] ${mine ? "border-emerald-900 bg-emerald-600 text-white" : parcel?.ownerId ? "border-slate-300 bg-slate-200 text-slate-500" : "border-slate-200 bg-slate-50 text-slate-400"}`} key={`${x}-${y}`} title={parcel ? `Quality ${quality(parcel.quality)}` : "Empty"}>{mine ? "You" : ""}</div>;
            })}
          </div>
          <p className="mt-3 text-sm text-slate-600">Your parcel is highlighted in green.</p>
        </div>

        <form className="rounded-2xl border border-slate-200 bg-white p-5" onSubmit={submit}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-950">Action panel</h2>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">{remaining} AP remaining</span>
          </div>
          <div className="mt-4 space-y-2">
            {(Object.keys(actionLabels) as ActionType[]).map((type) => {
              const active = selected.includes(type);
              const contract = type === "INFORMAL_CONTRACT" || type === "FORMAL_CONTRACT";
              const amount = ["PRODUCTIVE_INVESTMENT", "SAFE_ASSET", "PUBLIC_CONTRIBUTION", "LOBBYING"].includes(type) || contract;
              return (
                <div className="rounded-xl border border-slate-200 p-3" key={type}>
                  <label className="flex items-center gap-3 text-sm font-medium text-slate-900">
                    <input checked={active} className="h-4 w-4 accent-emerald-700" disabled={!active && remaining <= 0} onChange={() => toggleAction(type)} type="checkbox" />
                    {actionLabels[type]}
                  </label>
                  {active && amount ? <input className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" min="0" onChange={(event) => updateDraft(type, { amount: event.target.value })} placeholder="Amount" type="number" value={drafts[type]?.amount ?? ""} /> : null}
                  {active && contract ? (
                    <div className="mt-3 space-y-2">
                      <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" onChange={(event) => updateDraft(type, { counterpartyId: event.target.value })} value={drafts[type]?.counterpartyId ?? ""}>
                        <option value="">Select target player</option>
                        {otherPlayers.map((candidate) => <option key={candidate.id} value={candidate.id}>Player {candidate.id.slice(-6)} · parcel {candidate.parcelId.slice(-6)}</option>)}
                      </select>
                      <p className="text-xs leading-5 text-slate-600">{type === "FORMAL_CONTRACT" ? "Formal contract: fee 2, lower default risk." : "Informal contract: no fee, higher default risk."}</p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          {validationErrors.length > 0 ? <ul className="mt-4 list-disc rounded-lg border border-amber-200 bg-amber-50 p-4 pl-8 text-sm text-amber-800">{validationErrors.map((item) => <li key={item}>{item}</li>)}</ul> : null}
          {error ? <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
          {success ? <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p> : null}
          <button className="mt-4 w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:bg-slate-400" disabled={submitting || validationErrors.length > 0} type="submit">{submitting ? "Submitting..." : "Submit Decisions"}</button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-950">Submitted decisions</h2>
        {data.decisions.length === 0 ? <p className="mt-3 text-sm text-slate-600">No submitted decisions for this round yet.</p> : (
          <ul className="mt-3 divide-y divide-slate-200 text-sm">
            {data.decisions.map((decision) => <li className="flex justify-between py-3" key={decision.id}><span>{actionLabels[decision.actionType]}</span><span className="text-slate-600">Amount {money(decision.amount)}</span></li>)}
          </ul>
        )}
        <p className="mt-4 text-sm text-slate-600">Round status: {server.rounds[0]?.status ?? "Waiting for researcher to start"}</p>
      </div>
    </section>
  );
}
