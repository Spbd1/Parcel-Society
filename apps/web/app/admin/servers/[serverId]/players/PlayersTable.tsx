"use client";
import { DataTable, type Column } from "../../../_components/DataTable";
import { formatMoney, formatNumber, shortId } from "../../../_components/format";
export type PlayerRow = { id: string; wealth: number; productiveCapital: number; safeAsset: number; parcelQuality: number; exited: boolean; roundExited: number | null; actionsSubmittedCount: number };
export function PlayersTable({ players }: { players: PlayerRow[] }) {
  const columns: Column<PlayerRow>[] = [
    { key: "id", header: "Player", accessor: (p) => shortId(p.id), searchValue: (p) => p.id },
    { key: "wealth", header: "Wealth", accessor: (p) => formatMoney(p.wealth) },
    { key: "capital", header: "Productive capital", accessor: (p) => formatMoney(p.productiveCapital) },
    { key: "safe", header: "Safe asset", accessor: (p) => formatMoney(p.safeAsset) },
    { key: "quality", header: "Parcel quality", accessor: (p) => formatNumber(p.parcelQuality, 3) },
    { key: "exited", header: "Exited", accessor: (p) => p.exited ? "Yes" : "No", searchValue: (p) => p.exited ? "exited yes" : "active no" },
    { key: "roundExited", header: "Round exited", accessor: (p) => p.roundExited ?? "—" },
    { key: "actions", header: "Actions submitted", accessor: (p) => p.actionsSubmittedCount },
  ];
  return <DataTable rows={players} columns={columns} placeholder="Search players by id or status…" />;
}
