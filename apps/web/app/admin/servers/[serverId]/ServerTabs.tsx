import Link from "next/link";

const tabs = ["config", "players", "parcels", "rounds", "contracts", "events", "analytics"];

export function ServerTabs({ serverId }: { serverId: string }) {
  return <div className="mb-6 flex flex-wrap gap-2"><Link className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold" href={`/admin/servers/${serverId}`}>Overview</Link>{tabs.map((tab) => <Link key={tab} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold capitalize" href={`/admin/servers/${serverId}/${tab}`}>{tab}</Link>)}</div>;
}
