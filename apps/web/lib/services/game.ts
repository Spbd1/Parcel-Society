import {
  ActionType,
  ContractType,
  InequalityCondition,
  prisma,
  RoundStatus,
  SeasonStatus,
  ServerEventType,
  ServerStatus,
  TreasuryTransactionType,
  UncertaintyCondition,
  type Prisma,
} from "@parcel-society/db";
import {
  decisionCost,
  generateMap,
  resolveRound,
  validateDecisions,
  type Decision as EngineDecision,
  type EngineConfig,
  type Parcel as EngineParcel,
  type PlayerState,
  type ServerState,
} from "@parcel-society/engine";
import { ApiException } from "../api/responses";

type Decimalish = { toNumber(): number } | number;

const toNumber = (value: Decimalish): number =>
  typeof value === "number" ? value : value.toNumber();

type EnginePlayerRecord = {
  id: string;
  wealth: Decimalish;
  productiveCapital: Decimalish;
  safeAsset: Decimalish;
  exited: boolean;
  parcelId: string;
};

type EngineParcelRecord = {
  id: string;
  x: number;
  y: number;
  soil: Decimalish;
  water: Decimalish;
  marketAccess: Decimalish;
  risk: Decimalish;
  quality: Decimalish;
  ownerId: string | null;
};

type EngineDecisionRecord = {
  playerId: string;
  actionType: ActionType;
  amount: Decimalish;
  payload: Prisma.JsonValue;
  targetPlayerId: string | null;
};

const jsonObject = (value: Prisma.JsonValue): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

export const defaultEngineConfig = (server: {
  randomSeed: string;
  inequalityCondition: InequalityCondition;
  uncertaintyCondition: UncertaintyCondition;
  config: Prisma.JsonValue;
}): EngineConfig => {
  const overrides = jsonObject(server.config);
  return {
    seed: server.randomSeed,
    inequality: server.inequalityCondition,
    uncertainty: server.uncertaintyCondition,
    mapWidth: Number(overrides.mapWidth ?? 10),
    mapHeight: Number(overrides.mapHeight ?? 10),
    actionPointsPerRound: Number(overrides.actionPointsPerRound ?? 3),
    production: {
      A: Number(overrides.productionA ?? 10),
      betaQ: Number(overrides.productionBetaQ ?? 1),
      betaK: Number(overrides.productionBetaK ?? 0.35),
      minShockMultiplier: Number(overrides.minShockMultiplier ?? 0.4),
      maxShockMultiplier: Number(overrides.maxShockMultiplier ?? 1),
    },
    taxRate: Number(overrides.taxRate ?? 0.15),
    formalContractFee: Number(overrides.formalContractFee ?? 2),
    informalContractFee: Number(overrides.informalContractFee ?? 0),
    informalDefaultRisk: Number(overrides.informalDefaultRisk ?? 0.25),
    formalDefaultRisk: Number(overrides.formalDefaultRisk ?? 0.05),
    shockProbability: Number(
      overrides.shockProbability ??
        (server.uncertaintyCondition === UncertaintyCondition.UNCERTAIN ? 0.35 : 0.1),
    ),
    startingWealth: Number(overrides.startingWealth ?? 100),
    investmentUnitCost: Number(overrides.investmentUnitCost ?? 10),
    safeAssetReturn: Number(overrides.safeAssetReturn ?? 0.03),
    publicGoodMultiplier: Number(overrides.publicGoodMultiplier ?? 1.5),
    lobbyingCost: Number(overrides.lobbyingCost ?? 5),
  };
};

export const joinWaitingServer = async ({
  userId,
  serverId,
}: {
  userId: string;
  serverId: string;
}) =>
  prisma.$transaction(async (tx) => {
    const server = await tx.server.findUnique({
      where: { id: serverId },
      include: { parcels: true, players: true },
    });

    if (!server) {
      throw new ApiException(404, "SERVER_NOT_FOUND", "Server was not found.");
    }
    if (server.status !== ServerStatus.WAITING) {
      throw new ApiException(409, "SERVER_NOT_WAITING", "Only waiting servers can be joined.");
    }

    const existing = server.players.find((player) => player.userId === userId);
    if (existing) {
      throw new ApiException(409, "PLAYER_ALREADY_JOINED", "You have already joined this server.");
    }
    if (server.players.length >= server.maxPlayers) {
      throw new ApiException(409, "SERVER_FULL", "Server is already full.");
    }

    const assignedParcelIds = new Set(server.players.map((player) => player.parcelId));
    const availableParcels = server.parcels.filter(
      (parcel) => !assignedParcelIds.has(parcel.id),
    );
    if (availableParcels.length === 0) {
      throw new ApiException(409, "NO_AVAILABLE_PARCELS", "No parcels are available.");
    }

    const parcel = availableParcels[Math.floor(Math.random() * availableParcels.length)];
    const config = defaultEngineConfig(server);
    const player = await tx.player.create({
      data: {
        userId,
        serverId,
        parcelId: parcel.id,
        wealth: config.startingWealth,
      },
    });
    await tx.parcel.update({ where: { id: parcel.id }, data: { ownerId: player.id } });
    return player;
  });

export const createServerMap = async ({
  serverId,
  width,
  height,
}: {
  serverId: string;
  width: number;
  height: number;
}) =>
  prisma.$transaction(async (tx) => {
    const server = await tx.server.findUnique({
      where: { id: serverId },
      include: { players: true },
    });
    if (!server) {
      throw new ApiException(404, "SERVER_NOT_FOUND", "Server was not found.");
    }
    if (server.players.length > 0) {
      throw new ApiException(409, "PLAYERS_ALREADY_JOINED", "Cannot replace a map after players join.");
    }

    await tx.parcel.deleteMany({ where: { serverId } });
    const parcels = generateMap({
      seed: server.randomSeed,
      inequality: server.inequalityCondition,
      width,
      height,
    });
    await tx.parcel.createMany({
      data: parcels.map((parcel) => ({
        serverId,
        x: parcel.x,
        y: parcel.y,
        soil: parcel.soil,
        water: parcel.water,
        marketAccess: parcel.marketAccess,
        risk: parcel.risk,
        quality: parcel.quality,
      })),
    });
    await tx.server.update({
      where: { id: serverId },
      data: { config: { ...jsonObject(server.config), mapWidth: width, mapHeight: height } },
    });
    return { count: parcels.length };
  });

const enginePlayer = (player: EnginePlayerRecord, actionPoints: number): PlayerState => ({
  id: player.id,
  wealth: toNumber(player.wealth),
  productiveCapital: toNumber(player.productiveCapital),
  safeAssets: toNumber(player.safeAsset),
  exited: player.exited,
  parcelIds: [player.parcelId],
  actionPointsRemaining: actionPoints,
  contributedPublic: 0,
  spentOnProductiveInvestment: 0,
  spentOnSafeAssets: 0,
  spentOnLobbying: 0,
});

const engineParcel = (parcel: EngineParcelRecord): EngineParcel => ({
  id: parcel.id,
  x: parcel.x,
  y: parcel.y,
  soil: toNumber(parcel.soil),
  water: toNumber(parcel.water),
  marketAccess: toNumber(parcel.marketAccess),
  risk: toNumber(parcel.risk),
  quality: toNumber(parcel.quality),
  ownerId: parcel.ownerId ?? undefined,
});

const engineDecision = (decision: EngineDecisionRecord): EngineDecision => ({
  playerId: decision.playerId,
  type: decision.actionType,
  amount: toNumber(decision.amount),
  parcelId: jsonObject(decision.payload).parcelId as string | undefined,
  counterpartyId: decision.targetPlayerId ?? undefined,
});

export const submitPlayerDecisions = async ({
  userId,
  serverId,
  decisions,
}: {
  userId: string;
  serverId: string;
  decisions: Array<{
    type: ActionType;
    amount?: number;
    parcelId?: string;
    counterpartyId?: string;
    payload?: Record<string, unknown>;
  }>;
}) => {
  const server = await prisma.server.findUnique({
    where: { id: serverId },
    include: {
      rounds: { where: { status: RoundStatus.ACTIVE }, orderBy: { roundNumber: "desc" }, take: 1 },
      parcels: true,
      players: { include: { parcel: true } },
    },
  });

  if (!server) {
    throw new ApiException(404, "SERVER_NOT_FOUND", "Server was not found.");
  }
  if (server.status !== ServerStatus.ACTIVE || server.rounds.length === 0) {
    throw new ApiException(409, "ROUND_NOT_ACTIVE", "No round is active for this server.");
  }

  const player = server.players.find((candidate) => candidate.userId === userId);
  if (!player) {
    throw new ApiException(403, "FORBIDDEN", "You are not a participant on this server.");
  }

  if (player.exited) {
    throw new ApiException(409, "PLAYER_EXITED", "Exited players cannot submit decisions.");
  }

  const activeRound = server.rounds[0];
  const existingDecisions = await prisma.decision.findMany({
    where: { serverId, roundNumber: activeRound.roundNumber },
  });
  if (existingDecisions.some((decision) => decision.playerId === player.id && decision.actionType === ActionType.EXIT)) {
    throw new ApiException(409, "PLAYER_EXITED", "Exited players cannot submit more decisions.");
  }
  const exitIndex = decisions.findIndex((decision) => decision.type === ActionType.EXIT);
  if (exitIndex !== -1 && exitIndex !== decisions.length - 1) {
    throw new ApiException(400, "INVALID_DECISIONS", "Exit must be the final action in a submission.");
  }
  const config = defaultEngineConfig(server);
  const candidateDecisions: EngineDecision[] = [
    ...existingDecisions.map(engineDecision),
    ...decisions.map((decision) => ({
      playerId: player.id,
      type: decision.type,
      amount: decision.amount,
      parcelId: decision.parcelId,
      counterpartyId: decision.counterpartyId,
    })),
  ];
  const validation = validateDecisions({
    players: server.players.map((candidate) => enginePlayer(candidate, config.actionPointsPerRound)),
    parcels: server.parcels.map(engineParcel),
    decisions: candidateDecisions,
    config,
  });
  if (!validation.ok) {
    throw new ApiException(400, "INVALID_DECISIONS", "One or more decisions are invalid.", validation.errors);
  }

  const totalCost = decisions.reduce(
    (total, decision) =>
      total + decisionCost({ playerId: player.id, type: decision.type, amount: decision.amount, parcelId: decision.parcelId, counterpartyId: decision.counterpartyId }, config),
    0,
  );
  if (totalCost > toNumber(player.wealth)) {
    throw new ApiException(400, "INSUFFICIENT_WEALTH", "Player does not have enough wealth.");
  }

  await prisma.decision.createMany({
    data: decisions.map((decision) => ({
      playerId: player.id,
      serverId,
      roundNumber: activeRound.roundNumber,
      actionType: decision.type,
      amount: decision.amount ?? 0,
      targetPlayerId: decision.counterpartyId,
      payload: { ...(decision.payload ?? {}), parcelId: decision.parcelId },
    })),
  });

  return { roundNumber: activeRound.roundNumber, count: decisions.length };
};

export const startServer = async (serverId: string) =>
  prisma.$transaction(async (tx) => {
    const server = await tx.server.findUnique({ where: { id: serverId }, include: { parcels: true } });
    if (!server) {
      throw new ApiException(404, "SERVER_NOT_FOUND", "Server was not found.");
    }
    if (server.status !== ServerStatus.WAITING) {
      throw new ApiException(409, "SERVER_NOT_WAITING", "Only waiting servers can be started.");
    }
    if (server.parcels.length === 0) {
      throw new ApiException(409, "MAP_REQUIRED", "Generate a map before starting the server.");
    }
    const now = new Date();
    const season = await tx.season.create({
      data: {
        serverId,
        startsAt: now,
        endsAt: new Date(now.getTime() + server.seasonLength * 24 * 60 * 60 * 1000),
        status: SeasonStatus.ACTIVE,
      },
    });
    const round = await tx.round.create({
      data: {
        serverId,
        seasonId: season.id,
        roundNumber: 1,
        status: RoundStatus.ACTIVE,
        startsAt: now,
        endsAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      },
    });
    await tx.server.update({ where: { id: serverId }, data: { status: ServerStatus.ACTIVE, currentRound: 0 } });
    return { season, round };
  });

const eventType = (type: string): ServerEventType => {
  if (type === "TAX_CHANGE") return ServerEventType.TAX_CHANGE;
  if (type === "FORMAL_CONTRACT_FEE_CHANGE") return ServerEventType.FORMAL_CONTRACT_FEE_CHANGE;
  if (type === "SHOCK_PROBABILITY_CHANGE") return ServerEventType.SHOCK_PROBABILITY_CHANGE;
  return ServerEventType.RESOURCE_SHOCK;
};

const transactionType = (reason: string): TreasuryTransactionType => {
  if (reason === "TAX") return TreasuryTransactionType.TAX;
  if (reason === "PUBLIC_CONTRIBUTION") return TreasuryTransactionType.CONTRIBUTION;
  if (reason.endsWith("CONTRACT_FEE")) return TreasuryTransactionType.FEE;
  return TreasuryTransactionType.ADJUSTMENT;
};

export const resolveActiveRound = async (serverId: string) =>
  prisma.$transaction(async (tx) => {
    const server = await tx.server.findUnique({
      where: { id: serverId },
      include: {
        players: { include: { parcel: true } },
        parcels: true,
        contracts: true,
        rounds: { where: { status: RoundStatus.ACTIVE }, orderBy: { roundNumber: "desc" }, take: 1 },
        seasons: { where: { status: SeasonStatus.ACTIVE }, take: 1 },
      },
    });
    if (!server) {
      throw new ApiException(404, "SERVER_NOT_FOUND", "Server was not found.");
    }
    if (server.status !== ServerStatus.ACTIVE || server.rounds.length === 0) {
      throw new ApiException(409, "ROUND_NOT_ACTIVE", "No active round can be resolved.");
    }

    const round = server.rounds[0];
    const config = defaultEngineConfig(server);
    const decisions = await tx.decision.findMany({ where: { serverId, roundNumber: round.roundNumber } });
    const result = resolveRound({
      server: {
        round: server.currentRound,
        taxRate: config.taxRate,
        formalContractFee: config.formalContractFee,
        shockProbability: config.shockProbability,
        treasury: toNumber(server.treasury),
        uncertainty: server.uncertaintyCondition,
        events: [],
      } satisfies ServerState,
      players: server.players.map((player) => enginePlayer(player, config.actionPointsPerRound)),
      parcels: server.parcels.map(engineParcel),
      decisions: decisions.map(engineDecision),
      config,
      seed: server.randomSeed,
    });

    for (const player of result.players) {
      await tx.player.update({
        where: { id: player.id },
        data: {
          wealth: player.wealth,
          productiveCapital: player.productiveCapital,
          safeAsset: player.safeAssets,
          exited: player.exited,
          roundExited: player.exited ? round.roundNumber : undefined,
        },
      });
      await tx.playerRoundState.upsert({
        where: { playerId_roundNumber: { playerId: player.id, roundNumber: round.roundNumber } },
        update: {
          wealth: player.wealth,
          productiveCapital: player.productiveCapital,
          safeAsset: player.safeAssets,
          exited: player.exited,
          state: { roundSummary: result.roundSummary },
        },
        create: {
          playerId: player.id,
          serverId,
          roundNumber: round.roundNumber,
          wealth: player.wealth,
          productiveCapital: player.productiveCapital,
          safeAsset: player.safeAssets,
          reputation: 0,
          exited: player.exited,
          state: { roundSummary: result.roundSummary },
        },
      });
    }

    if (result.contracts.length > 0) {
      await tx.contract.createMany({
        data: result.contracts.map((contract) => ({
          senderId: contract.fromPlayerId,
          receiverId: contract.toPlayerId,
          serverId,
          roundNumber: round.roundNumber,
          contractType: contract.type === "FORMAL" ? ContractType.FORMAL : ContractType.INFORMAL,
          value: contract.amount,
          fee: contract.fee,
          fulfilled: contract.fulfilled ?? null,
          defaulted: contract.fulfilled === undefined ? null : !contract.fulfilled,
          resolvedAt: new Date(),
        })),
      });
    }
    if (result.serverEvents.length > 0) {
      await tx.serverEvent.createMany({
        data: result.serverEvents.map((event) => ({
          serverId,
          roundNumber: round.roundNumber,
          eventType: eventType(event.type),
          value: event as unknown as Prisma.InputJsonValue,
        })),
      });
    }
    if (result.treasuryTransactions.length > 0) {
      await tx.treasuryTransaction.createMany({
        data: result.treasuryTransactions.map((transaction) => ({
          serverId,
          playerId: transaction.playerId,
          roundNumber: round.roundNumber,
          type: transactionType(transaction.reason),
          amount: transaction.amount,
          description: transaction.reason,
        })),
      });
    }

    const nextConfig = {
      ...jsonObject(server.config),
      taxRate: result.server.taxRate,
      formalContractFee: result.server.formalContractFee,
      shockProbability: result.server.shockProbability,
    };
    const completed = round.roundNumber >= server.seasonLength;
    await tx.round.update({ where: { id: round.id }, data: { status: RoundStatus.RESOLVED } });
    if (completed) {
      await tx.server.update({
        where: { id: serverId },
        data: {
          currentRound: round.roundNumber,
          treasury: result.server.treasury,
          status: ServerStatus.COMPLETED,
          config: nextConfig,
        },
      });
      if (server.seasons[0]) {
        await tx.season.update({ where: { id: server.seasons[0].id }, data: { status: SeasonStatus.COMPLETED, endsAt: new Date() } });
      }
    } else {
      await tx.server.update({
        where: { id: serverId },
        data: {
          currentRound: round.roundNumber,
          treasury: result.server.treasury,
          config: nextConfig,
        },
      });
      await tx.round.create({
        data: {
          serverId,
          seasonId: server.seasons[0]?.id ?? round.seasonId,
          roundNumber: round.roundNumber + 1,
          status: RoundStatus.ACTIVE,
          startsAt: new Date(),
          endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    }

    return result.roundSummary;
  });
