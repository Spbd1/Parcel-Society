import { notFound } from "next/navigation";
import { prisma } from "@parcel-society/db";
import { AdminPageHeader } from "../../../_components/ui";
import { numberValue } from "../../../_components/format";
import { ServerTabs } from "../ServerTabs";
import { ContractsTable } from "./ContractsTable";
type Props = { params: Promise<{ serverId: string }> };
export default async function ContractsPage({ params }: Props) { const { serverId } = await params; const server = await prisma.server.findUnique({ where:{id:serverId}, select:{name:true} }); if(!server) notFound(); const contracts=await prisma.contract.findMany({ where:{serverId}, include:{sender:true, receiver:true}, orderBy:[{roundNumber:"asc"},{createdAt:"asc"}] }); return <><AdminPageHeader title={`${server.name}: contracts`} description="Formal and informal contract values, fees, outcomes, and rounds." /><ServerTabs serverId={serverId} /><ContractsTable contracts={contracts.map(c=>({ sender:c.sender.id, receiver:c.receiver.id, type:c.contractType, value:numberValue(c.value), fee:numberValue(c.fee), fulfilled:c.fulfilled, defaulted:c.defaulted, round:c.roundNumber }))} /></>; }
