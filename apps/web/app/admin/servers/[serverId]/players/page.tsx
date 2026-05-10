import { notFound } from "next/navigation";
import { prisma } from "@parcel-society/db";
import { AdminPageHeader } from "../../../_components/ui";
import { numberValue } from "../../../_components/format";
import { ServerTabs } from "../ServerTabs";
import { PlayersTable } from "./PlayersTable";

type Props = { params: Promise<{ serverId: string }> };
export default async function PlayersPage({ params }: Props) {
  const { serverId } = await params;
  const server = await prisma.server.findUnique({ where: { id: serverId }, select: { name: true } });
  if (!server) notFound();
  const players = await prisma.player.findMany({ where: { serverId }, include: { parcel: true, _count: { select: { decisions: true } } }, orderBy: { createdAt: "asc" } });
  return <><AdminPageHeader title={`${server.name}: players`} description="Participant balances, parcel assignments, exits, and submitted action counts." /><ServerTabs serverId={serverId} /><PlayersTable players={players.map((p) => ({ id: p.id, wealth: numberValue(p.wealth), productiveCapital: numberValue(p.productiveCapital), safeAsset: numberValue(p.safeAsset), parcelQuality: numberValue(p.parcel.quality), exited: p.exited, roundExited: p.roundExited, actionsSubmittedCount: p._count.decisions }))} /></>;
}
