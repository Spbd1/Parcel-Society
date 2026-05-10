import { prisma, type Prisma } from "@parcel-society/db";
import { calculateServerOutcomes } from "@parcel-society/engine";
import { ApiException } from "../api/responses";

type Decimalish = { toNumber(): number } | number | null | undefined;

const numberValue = (value: Decimalish): number => {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : value.toNumber();
};

const jsonObject = (value: Prisma.JsonValue): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const roundSummaryOutput = (state: Prisma.JsonValue): number | undefined => {
  const summary = jsonObject(jsonObject(state).roundSummary as Prisma.JsonValue);
  return typeof summary.totalOutput === "number" ? summary.totalOutput : undefined;
};

const cumulativeTreasuryBeforeFirstRound = (transactions: Array<{ roundNumber: number | null; amount: Decimalish }>): number =>
  transactions
    .filter((transaction) => (transaction.roundNumber ?? 0) <= 0)
    .reduce((total, transaction) => total + numberValue(transaction.amount), 0);

export const getServerAnalytics = async (serverId: string) => {
  const server = await prisma.server.findUnique({
    where: { id: serverId },
    include: {
      players: { include: { parcel: true }, orderBy: { createdAt: "asc" } },
      parcels: { orderBy: [{ y: "asc" }, { x: "asc" }] },
      decisions: { orderBy: [{ roundNumber: "asc" }, { createdAt: "asc" }] },
      contracts: { orderBy: [{ roundNumber: "asc" }, { createdAt: "asc" }] },
      treasuryTransactions: { orderBy: [{ roundNumber: "asc" }, { createdAt: "asc" }] },
      playerRoundStates: { orderBy: [{ roundNumber: "asc" }, { playerId: "asc" }] },
      rounds: { orderBy: { roundNumber: "asc" } },
    },
  });

  if (!server) throw new ApiException(404, "SERVER_NOT_FOUND", "Server was not found.");

  const analytics = calculateServerOutcomes({
    players: server.players.map((player) => ({
      id: player.id,
      wealth: numberValue(player.wealth),
      safeAsset: numberValue(player.safeAsset),
      exited: player.exited,
      roundExited: player.roundExited,
    })),
    parcels: server.parcels.map((parcel) => ({ quality: numberValue(parcel.quality) })),
    decisions: server.decisions.map((decision) => ({
      round: decision.roundNumber,
      actionType: decision.actionType,
      amount: numberValue(decision.amount),
    })),
    contracts: server.contracts.map((contract) => ({
      round: contract.roundNumber,
      contractType: contract.contractType,
      fulfilled: contract.fulfilled,
      defaulted: contract.defaulted,
    })),
    playerRoundStates: server.playerRoundStates.map((state) => ({
      playerId: state.playerId,
      round: state.roundNumber,
      wealth: numberValue(state.wealth),
      safeAsset: numberValue(state.safeAsset),
      exited: state.exited,
      totalOutput: roundSummaryOutput(state.state),
    })),
    treasuryTransactions: server.treasuryTransactions.map((transaction) => ({
      round: transaction.roundNumber,
      amount: numberValue(transaction.amount),
    })),
    rounds: [
      ...server.rounds.map((round) => round.roundNumber),
      ...server.decisions.map((decision) => decision.roundNumber),
      ...server.contracts.map((contract) => contract.roundNumber),
      ...server.playerRoundStates.map((state) => state.roundNumber),
    ],
    initialTreasury: cumulativeTreasuryBeforeFirstRound(server.treasuryTransactions),
  });

  return {
    server: {
      id: server.id,
      name: server.name,
      description: server.description,
      status: server.status,
      inequalityCondition: server.inequalityCondition,
      uncertaintyCondition: server.uncertaintyCondition,
      currentRound: server.currentRound,
      seasonLength: server.seasonLength,
      maxPlayers: server.maxPlayers,
      treasury: numberValue(server.treasury),
    },
    rounds: analytics.rounds,
    latest: analytics.latest,
    players: server.players.map((player) => ({
      id: player.id,
      wealth: numberValue(player.wealth),
      safeAsset: numberValue(player.safeAsset),
      finalWealth: numberValue(player.wealth) + numberValue(player.safeAsset),
      exited: player.exited,
      roundExited: player.roundExited,
    })),
    parcels: server.parcels.map((parcel) => ({
      id: parcel.id,
      x: parcel.x,
      y: parcel.y,
      soil: numberValue(parcel.soil),
      water: numberValue(parcel.water),
      marketAccess: numberValue(parcel.marketAccess),
      risk: numberValue(parcel.risk),
      quality: numberValue(parcel.quality),
      ownerId: parcel.ownerId,
      ownerPlayerId: parcel.ownerId,
    })),
  };
};

export const getAnalyticsOverview = async () => {
  const servers = await prisma.server.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  const serverAnalytics = await Promise.all(servers.map((server) => getServerAnalytics(server.id)));
  return {
    servers: serverAnalytics.map((analytics) => ({
      ...analytics.server,
      latest: analytics.latest ?? null,
    })),
    primaryOutcomeAverages: {
      informalCooperationRate: averageDefined(serverAnalytics.map((analytics) => analytics.latest?.informalCooperationRate)),
      contractReliability: averageDefined(serverAnalytics.map((analytics) => analytics.latest?.contractReliability)),
      productiveInvestmentShare: averageDefined(serverAnalytics.map((analytics) => analytics.latest?.productiveInvestmentShare)),
      publicContributionShare: averageDefined(serverAnalytics.map((analytics) => analytics.latest?.publicContributionShare)),
      exitRate: averageDefined(serverAnalytics.map((analytics) => analytics.latest?.exitRate)),
    },
  };
};

const averageDefined = (values: Array<number | undefined>): number => {
  const defined = values.filter((value): value is number => value !== undefined);
  return defined.length === 0 ? 0 : defined.reduce((total, value) => total + value, 0) / defined.length;
};
