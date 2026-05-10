import { prisma } from "@parcel-society/db";
import { AdminPageHeader, ButtonLink } from "../_components/ui";
import { ServersTable } from "./ServersTable";

export default async function ServersPage() {
  const servers = await prisma.server.findMany({ include: { _count: { select: { players: true } } }, orderBy: { createdAt: "desc" } });
  return (
    <>
      <AdminPageHeader title="Servers" description="Filter and manage all experiment servers." actions={<ButtonLink href="/admin/servers/new">New server</ButtonLink>} />
      <ServersTable servers={servers.map((server) => ({ id: server.id, name: server.name, status: server.status, inequalityCondition: server.inequalityCondition, uncertaintyCondition: server.uncertaintyCondition, maxPlayers: server.maxPlayers, playersJoined: server._count.players, currentRound: server.currentRound, createdAt: server.createdAt.toISOString() }))} />
    </>
  );
}
