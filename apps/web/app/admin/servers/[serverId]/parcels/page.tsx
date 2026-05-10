import { notFound } from "next/navigation";
import { prisma } from "@parcel-society/db";
import { DistributionChart } from "../../../_components/AdminCharts";
import { AdminPageHeader, Card, StatCard } from "../../../_components/ui";
import { gini, numberValue } from "../../../_components/format";
import { ServerTabs } from "../ServerTabs";
import { ParcelMap } from "./ParcelMap";

type Props = { params: Promise<{ serverId: string }> };
export default async function ParcelsPage({ params }: Props) {
  const { serverId } = await params;
  const server = await prisma.server.findUnique({ where: { id: serverId }, include: { parcels: { include: { owner: true }, orderBy: [{ y: "asc" }, { x: "asc" }] } } });
  if (!server) notFound();
  const parcels = server.parcels.map((p) => ({ id: p.id, x: p.x, y: p.y, soil: numberValue(p.soil), water: numberValue(p.water), marketAccess: numberValue(p.marketAccess), risk: numberValue(p.risk), quality: numberValue(p.quality), ownerId: p.ownerId, ownerPlayerId: p.owner?.id ?? null }));
  const hist = Array.from({ length: 10 }, (_, i) => ({ name: `${i / 10}-${(i + 1) / 10}`, value: parcels.filter((p) => p.quality >= i / 10 && p.quality < (i + 1) / 10).length }));
  return <><AdminPageHeader title={`${server.name}: parcels`} description="Admin map colored by parcel quality with parcel-level inspection and inequality metrics." /><ServerTabs serverId={serverId} /><div className="mb-6 grid gap-4 md:grid-cols-3"><StatCard label="Parcels" value={parcels.length} /><StatCard label="Parcel-quality Gini" value={gini(parcels.map((p) => p.quality)).toFixed(3)} /><StatCard label="Assigned parcels" value={parcels.filter((p) => p.ownerPlayerId).length} /></div><Card><ParcelMap parcels={parcels} /></Card><Card className="mt-6"><h2 className="mb-4 text-lg font-semibold">Parcel-quality distribution</h2><DistributionChart data={hist} /></Card></>;
}
