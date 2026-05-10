import { notFound } from "next/navigation";
import { prisma } from "@parcel-society/db";
import { AdminPageHeader } from "../../../_components/ui";
import { ServerTabs } from "../ServerTabs";
import { EventsTable } from "./EventsTable";
type Props = { params: Promise<{ serverId: string }> };
const category = (type: string) => type.includes("CHANGE") ? "Rule change" : type.includes("SHOCK") ? "Shock" : type.includes("TREASURY") ? "Treasury" : "Server event";
export default async function EventsPage({ params }: Props) { const { serverId } = await params; const server = await prisma.server.findUnique({ where:{id:serverId}, select:{name:true} }); if(!server) notFound(); const events=await prisma.serverEvent.findMany({ where:{serverId}, orderBy:[{createdAt:"desc"}] }); return <><AdminPageHeader title={`${server.name}: events`} description="Timeline of server events, rule changes, shocks, and treasury-related activity." /><ServerTabs serverId={serverId} /><EventsTable events={events.map(e=>({ type:e.eventType, category:category(e.eventType), round:e.roundNumber, value:JSON.stringify(e.value), createdAt:e.createdAt.toISOString() }))} /></>; }
