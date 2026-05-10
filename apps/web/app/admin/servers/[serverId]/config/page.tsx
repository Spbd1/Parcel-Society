import { notFound } from "next/navigation";
import { prisma } from "@parcel-society/db";
import { AdminPageHeader, Card } from "../../../_components/ui";
import { ServerTabs } from "../ServerTabs";
type Props = { params: Promise<{ serverId: string }> };
export default async function ConfigPage({ params }: Props) { const { serverId } = await params; const server = await prisma.server.findUnique({ where: { id: serverId }, include: { serverConfigs: true } }); if (!server) notFound(); return <><AdminPageHeader title={`${server.name}: config`} description="Raw server configuration and versioned config entries." /><ServerTabs serverId={serverId} /><Card><pre className="overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify({ server: { maxPlayers: server.maxPlayers, seasonLength: server.seasonLength, randomSeed: server.randomSeed, treasury: server.treasury.toString(), status: server.status, currentRound: server.currentRound, inequalityCondition: server.inequalityCondition, uncertaintyCondition: server.uncertaintyCondition, config: server.config }, configRows: server.serverConfigs }, null, 2)}</pre></Card></>; }
