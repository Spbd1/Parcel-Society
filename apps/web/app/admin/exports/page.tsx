import Link from "next/link";
import { prisma } from "@parcel-society/db";
import { AdminPageHeader, Card, EmptyState } from "../_components/ui";
import { formatDate, shortId } from "../_components/format";

export default async function ExportsPage() {
  const [servers, jobs] = await Promise.all([
    prisma.server.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, name: true, status: true } }),
    prisma.exportJob.findMany({ orderBy: { createdAt: "desc" }, include: { server: { select: { name: true } }, requestedBy: { select: { email: true, anonymousId: true } } }, take: 50 }),
  ]);
  return <><AdminPageHeader title="Exports" description="Export all data, download server-specific CSV payloads, and review generated export jobs." />
    <div className="grid gap-6 lg:grid-cols-2">
      <Card><h2 className="text-lg font-semibold">Export all data</h2><p className="mt-2 text-sm text-slate-600">Download a ZIP containing normalized, de-identified research CSV files for every server.</p><a className="mt-4 inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold" href="/api/admin/export/all.zip">Download all research CSVs</a></Card>
      <Card><h2 className="text-lg font-semibold">Server-specific CSV downloads</h2><div className="mt-4 max-h-96 space-y-2 overflow-auto">{servers.map(s=><div className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3" key={s.id}><div><p className="font-medium">{s.name}</p><p className="text-xs text-slate-500">{s.status} · {shortId(s.id)}</p></div><Link className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white" href={`/api/admin/servers/${s.id}/export.zip`}>Download ZIP</Link></div>)}</div></Card>
    </div>
    <Card className="mt-6"><h2 className="mb-4 text-lg font-semibold">Generated export jobs</h2>{jobs.length === 0 ? <EmptyState title="No export jobs yet" description="Generated jobs will appear here with status, file path, and errors." /> : <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="text-left text-xs uppercase text-slate-500"><th className="p-2">Job</th><th className="p-2">Server</th><th className="p-2">Status</th><th className="p-2">File</th><th className="p-2">Error</th><th className="p-2">Created</th></tr></thead><tbody>{jobs.map(j=><tr className="border-t" key={j.id}><td className="p-2">{shortId(j.id)}</td><td className="p-2">{j.server?.name ?? "All data"}</td><td className="p-2">{j.status}</td><td className="p-2">{j.filePath ?? "—"}</td><td className="p-2">{j.error ?? "—"}</td><td className="p-2">{formatDate(j.createdAt)}</td></tr>)}</tbody></table></div>}</Card>
  </>;
}
