"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type ActionKind = "patch" | "post" | "export";

type Action = {
  label: string;
  confirm?: string;
  url: string;
  kind?: ActionKind;
  body?: Record<string, unknown>;
  destructive?: boolean;
  preview?: { submitted: number; missing: number; currentRound: number; nextRound: number };
};

const authHeader = () => {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("parcel_admin_basic");
  return token ? { Authorization: `Basic ${token}` } : {};
};

export function ConfirmDialog({ action, onClose, onConfirm, busy }: { action: Action | null; onClose: () => void; onConfirm: () => void; busy: boolean }) {
  if (!action) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-slate-950">Confirm action</h2>
        <p className="mt-2 text-sm text-slate-600">{action.confirm ?? `Run ${action.label}?`}</p>
        {action.preview ? (
          <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-sm">
            <div><span className="text-slate-500">Submitted players</span><p className="font-semibold">{action.preview.submitted}</p></div>
            <div><span className="text-slate-500">Missing decisions</span><p className="font-semibold">{action.preview.missing}</p></div>
            <div><span className="text-slate-500">Current round</span><p className="font-semibold">{action.preview.currentRound}</p></div>
            <div><span className="text-slate-500">Expected next round</span><p className="font-semibold">{action.preview.nextRound}</p></div>
          </div>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold" onClick={onClose} disabled={busy}>Cancel</button>
          <button className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${action.destructive ? "bg-red-600" : "bg-slate-950"}`} onClick={onConfirm} disabled={busy}>{busy ? "Working…" : "Confirm"}</button>
        </div>
      </div>
    </div>
  );
}

export function AdminActions({ actions }: { actions: Action[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<Action | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const headers = useMemo(() => ({ "Content-Type": "application/json", ...authHeader() }), []);

  const run = async (action: Action) => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(action.url, {
        method: action.kind === "patch" ? "PATCH" : "POST",
        headers,
        body: action.kind === "patch" || action.body ? JSON.stringify(action.body ?? {}) : undefined,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error?.message ?? data?.message ?? "Action failed");
      if (action.kind === "export") {
        const blob = new Blob([JSON.stringify(data.data ?? data, null, 2)], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "parcel-society-export.json";
        link.click();
      }
      setMessage(`${action.label} completed.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusy(false);
      setPending(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => <button key={action.label} className={`rounded-lg px-3 py-2 text-sm font-semibold text-white ${action.destructive ? "bg-red-600" : "bg-slate-950"}`} onClick={() => action.confirm || action.destructive || action.preview ? setPending(action) : void run(action)}>{action.label}</button>)}
      </div>
      {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
      <ConfirmDialog action={pending} busy={busy} onClose={() => setPending(null)} onConfirm={() => pending && void run(pending)} />
    </div>
  );
}
