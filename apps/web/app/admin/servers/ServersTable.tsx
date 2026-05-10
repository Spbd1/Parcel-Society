"use client";

import Link from "next/link";
import { DataTable, type Column } from "../_components/DataTable";
import { ConditionBadge, ServerStatusBadge } from "../_components/ui";
import { formatDate } from "../_components/format";

export type ServerRow = {
  id: string; name: string; status: string; inequalityCondition: string; uncertaintyCondition: string; maxPlayers: number; playersJoined: number; currentRound: number; createdAt: string;
};

export function ServersTable({ servers }: { servers: ServerRow[] }) {
  const columns: Column<ServerRow>[] = [
    { key: "name", header: "Name", accessor: (server) => <Link className="font-semibold text-slate-950 hover:underline" href={`/admin/servers/${server.id}`}>{server.name}</Link>, searchValue: (server) => server.name },
    { key: "status", header: "Status", accessor: (server) => <ServerStatusBadge status={server.status} />, searchValue: (server) => server.status },
    { key: "ineq", header: "Inequality", accessor: (server) => <ConditionBadge value={server.inequalityCondition} />, searchValue: (server) => server.inequalityCondition },
    { key: "uncert", header: "Uncertainty", accessor: (server) => <ConditionBadge value={server.uncertaintyCondition} />, searchValue: (server) => server.uncertaintyCondition },
    { key: "players", header: "Players joined", accessor: (server) => `${server.playersJoined}/${server.maxPlayers}` },
    { key: "round", header: "Current round", accessor: (server) => server.currentRound },
    { key: "created", header: "Created date", accessor: (server) => formatDate(server.createdAt) },
    { key: "actions", header: "Actions", accessor: (server) => <Link className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold" href={`/admin/servers/${server.id}`}>Manage</Link> },
  ];
  return <DataTable rows={servers} columns={columns} placeholder="Search servers by name, status, or condition…" />;
}
