import {
  ActionType,
  ContractType,
  InequalityCondition,
  Prisma,
  PrismaClient,
  RoundStatus,
  SeasonStatus,
  ServerEventType,
  ServerStatus,
  TreasuryTransactionType,
  UncertaintyCondition,
  UserRole,
} from "@prisma/client";
import {
  generateMap,
  resolveRound,
  type Decision as EngineDecision,
  type EngineConfig,
  type Parcel as EngineParcel,
  type PlayerState,
  type ServerState,
} from "@parcel-society/engine";

const demoServerSpecs = [
  {
    name: "Demo Low Inequality Stable",
    description:
      "Demo mode server for low initial inequality and stable institutions.",
    inequalityCondition: InequalityCondition.LOW,
    uncertaintyCondition: UncertaintyCondition.STABLE,
    randomSeed: "demo-low-inequality-stable-v2",
  },
  {
    name: "Demo Low Inequality Uncertain",
    description:
      "Demo mode server for low initial inequality and uncertain institutions.",
    inequalityCondition: InequalityCondition.LOW,
    uncertaintyCondition: UncertaintyCondition.UNCERTAIN,
    randomSeed: "demo-low-inequality-uncertain-v2",
  },
  {
    name: "Demo High Inequality Stable",
    description:
      "Demo mode server for high initial inequality and stable institutions.",
    inequalityCondition: InequalityCondition.HIGH,
    uncertaintyCondition: UncertaintyCondition.STABLE,
    randomSeed: "demo-high-inequality-stable-v2",
  },
  {
    name: "Demo High Inequality Uncertain",
    description:
      "Demo mode server for high initial inequality and uncertain institutions.",
    inequalityCondition: InequalityCondition.HIGH,
    uncertaintyCondition: UncertaintyCondition.UNCERTAIN,
    randomSeed: "demo-high-inequality-uncertain-v2",
  },
] as const;

type DemoSeedOptions = {
  adminEmail?: string;
  adminPassword?: string;
};

type Decimalish = Prisma.Decimal | number;

const toNumber = (value: Decimalish): number =>
  typeof value === "number" ? value : value.toNumber();

const demoConfig = (spec: (typeof demoServerSpecs)[number]): EngineConfig => ({
  seed: spec.randomSeed,
  inequality: spec.inequalityCondition,
  uncertainty: spec.uncertaintyCondition,
  mapWidth: 10,
  mapHeight: 10,
  actionPointsPerRound: 3,
  production: {
    A: 10,
    betaQ: 1,
    betaK: 0.35,
    minShockMultiplier: 0.45,
    maxShockMultiplier: 1,
  },
  taxRate: 0.15,
  formalContractFee: 2,
  informalContractFee: 0,
  informalDefaultRisk: 0.25,
  formalDefaultRisk: 0.05,
  shockProbability:
    spec.uncertaintyCondition === UncertaintyCondition.UNCERTAIN ? 0.35 : 0.1,
  startingWealth: 100,
  investmentUnitCost: 10,
  safeAssetReturn: 0.03,
  publicGoodMultiplier: 1.5,
  lobbyingCost: 5,
});

const eventType = (type: string): ServerEventType => {
  if (type === "TAX_CHANGE") return ServerEventType.TAX_CHANGE;
  if (type === "FORMAL_CONTRACT_FEE_CHANGE")
    return ServerEventType.FORMAL_CONTRACT_FEE_CHANGE;
  if (type === "SHOCK_PROBABILITY_CHANGE")
    return ServerEventType.SHOCK_PROBABILITY_CHANGE;
  return ServerEventType.RESOURCE_SHOCK;
};

const transactionType = (reason: string): TreasuryTransactionType => {
  if (reason === "TAX") return TreasuryTransactionType.TAX;
  if (reason === "PUBLIC_CONTRIBUTION")
    return TreasuryTransactionType.CONTRIBUTION;
  if (reason.endsWith("CONTRACT_FEE")) return TreasuryTransactionType.FEE;
  return TreasuryTransactionType.ADJUSTMENT;
};

const enginePlayer = (
  player: {
    id: string;
    wealth: Decimalish;
    productiveCapital: Decimalish;
    safeAsset: Decimalish;
    exited: boolean;
    parcelId: string;
  },
  actionPoints: number,
): PlayerState => ({
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

const engineParcel = (parcel: {
  id: string;
  x: number;
  y: number;
  soil: Decimalish;
  water: Decimalish;
  marketAccess: Decimalish;
  risk: Decimalish;
  quality: Decimalish;
  ownerId: string | null;
}): EngineParcel => ({
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

const decisionsForRound = (
  players: Array<{ id: string; parcelId: string }>,
  roundNumber: number,
): EngineDecision[] =>
  players.flatMap((player, index) => {
    const counterpart = players[(index + roundNumber) % players.length];
    const base: EngineDecision[] = [
      { playerId: player.id, type: "PRODUCE", parcelId: player.parcelId },
    ];

    if (roundNumber === 1) {
      base.push(
        index % 2 === 0
          ? {
              playerId: player.id,
              type: "PRODUCTIVE_INVESTMENT",
              amount: 12 + (index % 3) * 3,
            }
          : {
              playerId: player.id,
              type: "SAFE_ASSET",
              amount: 8 + (index % 4) * 2,
            },
      );
      base.push(
        index % 5 === 0
          ? { playerId: player.id, type: "PUBLIC_CONTRIBUTION", amount: 5 }
          : {
              playerId: player.id,
              type: index % 3 === 0 ? "FORMAL_CONTRACT" : "INFORMAL_CONTRACT",
              amount: 4 + (index % 4),
              counterpartyId: counterpart.id,
            },
      );
      return base;
    }

    if (roundNumber === 2) {
      base.push(
        index % 4 === 0
          ? { playerId: player.id, type: "LOBBYING", amount: 5 }
          : {
              playerId: player.id,
              type: "PRODUCTIVE_INVESTMENT",
              amount: 10 + (index % 2) * 5,
            },
      );
      base.push(
        index % 3 === 0
          ? { playerId: player.id, type: "PUBLIC_CONTRIBUTION", amount: 6 }
          : {
              playerId: player.id,
              type: "SAFE_ASSET",
              amount: 6 + (index % 3) * 2,
            },
      );
      return base;
    }

    base.push(
      index % 2 === 0
        ? {
            playerId: player.id,
            type: "FORMAL_CONTRACT",
            amount: 5 + (index % 5),
            counterpartyId: counterpart.id,
          }
        : {
            playerId: player.id,
            type: "PUBLIC_CONTRIBUTION",
            amount: 4 + (index % 4),
          },
    );
    if (index === 3 || index === 14) {
      base.push({ playerId: player.id, type: "EXIT" });
    } else {
      base.push(
        index % 5 === 0
          ? { playerId: player.id, type: "LOBBYING", amount: 5 }
          : { playerId: player.id, type: "SAFE_ASSET", amount: 5 },
      );
    }
    return base;
  });

const resolveSeedRound = async ({
  tx,
  serverId,
  seed,
  uncertainty,
  config,
  roundId,
  roundNumber,
}: {
  tx: Prisma.TransactionClient;
  serverId: string;
  seed: string;
  uncertainty: UncertaintyCondition;
  config: EngineConfig;
  roundId: string;
  roundNumber: number;
}) => {
  const [server, players, parcels, decisions] = await Promise.all([
    tx.server.findUniqueOrThrow({ where: { id: serverId } }),
    tx.player.findMany({ where: { serverId }, orderBy: { createdAt: "asc" } }),
    tx.parcel.findMany({
      where: { serverId },
      orderBy: [{ y: "asc" }, { x: "asc" }],
    }),
    tx.decision.findMany({
      where: { serverId, roundNumber },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const result = resolveRound({
    server: {
      round: roundNumber - 1,
      taxRate: Number(config.taxRate),
      formalContractFee: Number(config.formalContractFee),
      shockProbability: Number(config.shockProbability),
      treasury: toNumber(server.treasury),
      uncertainty,
      events: [],
    } satisfies ServerState,
    players: players.map((player) =>
      enginePlayer(player, config.actionPointsPerRound),
    ),
    parcels: parcels.map(engineParcel),
    decisions: decisions.map((decision) => ({
      playerId: decision.playerId,
      type: decision.actionType,
      amount: toNumber(decision.amount),
      parcelId: (decision.payload as { parcelId?: string }).parcelId,
      counterpartyId: decision.targetPlayerId ?? undefined,
    })),
    config,
    seed,
  });

  for (const player of result.players) {
    await tx.player.update({
      where: { id: player.id },
      data: {
        wealth: player.wealth,
        productiveCapital: player.productiveCapital,
        safeAsset: player.safeAssets,
        exited: player.exited,
        roundExited: player.exited ? roundNumber : undefined,
      },
    });
    await tx.playerRoundState.create({
      data: {
        playerId: player.id,
        serverId,
        roundNumber,
        wealth: player.wealth,
        productiveCapital: player.productiveCapital,
        safeAsset: player.safeAssets,
        reputation: 0,
        exited: player.exited,
        state: { roundSummary: result.roundSummary } as Prisma.InputJsonValue,
      },
    });
  }

  if (result.contracts.length > 0) {
    await tx.contract.createMany({
      data: result.contracts.map((contract) => ({
        senderId: contract.fromPlayerId,
        receiverId: contract.toPlayerId,
        serverId,
        roundNumber,
        contractType:
          contract.type === "FORMAL"
            ? ContractType.FORMAL
            : ContractType.INFORMAL,
        value: contract.amount,
        fee: contract.fee,
        fulfilled: contract.fulfilled ?? null,
        defaulted:
          contract.fulfilled === undefined ? null : !contract.fulfilled,
        resolvedAt: new Date(),
      })),
    });
  }

  if (result.serverEvents.length > 0) {
    await tx.serverEvent.createMany({
      data: result.serverEvents.map((event) => ({
        serverId,
        roundNumber,
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
        roundNumber,
        type: transactionType(transaction.reason),
        amount: transaction.amount,
        description: transaction.reason,
      })),
    });
  }

  await tx.round.update({
    where: { id: roundId },
    data: { status: RoundStatus.RESOLVED },
  });
  await tx.server.update({
    where: { id: serverId },
    data: {
      currentRound: roundNumber,
      treasury: result.server.treasury,
      config: {
        demo: true,
        demoResolvedRounds: 3,
        mapWidth: 10,
        mapHeight: 10,
        taxRate: result.server.taxRate,
        formalContractFee: result.server.formalContractFee,
        shockProbability: result.server.shockProbability,
        actionPointsPerRound: config.actionPointsPerRound,
        startingWealth: config.startingWealth,
        productionA: config.production.A,
        productionBetaQ: config.production.betaQ,
        productionBetaK: config.production.betaK,
        minShockMultiplier: config.production.minShockMultiplier,
        maxShockMultiplier: config.production.maxShockMultiplier,
        informalContractFee: config.informalContractFee,
        informalDefaultRisk: config.informalDefaultRisk,
        formalDefaultRisk: config.formalDefaultRisk,
        safeAssetReturn: config.safeAssetReturn,
        publicGoodMultiplier: config.publicGoodMultiplier,
        investmentUnitCost: config.investmentUnitCost,
        lobbyingCost: config.lobbyingCost,
      },
    },
  });
};

export async function seedDemo(
  prisma: PrismaClient,
  options: DemoSeedOptions = {},
) {
  const adminEmail =
    options.adminEmail ?? process.env.ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword =
    options.adminPassword ?? process.env.ADMIN_PASSWORD ?? "changeme";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: UserRole.SUPER_ADMIN },
    create: {
      email: adminEmail,
      role: UserRole.SUPER_ADMIN,
    },
  });

  await prisma.adminUser.upsert({
    where: { userId: admin.id },
    update: { email: adminEmail, name: "Demo Admin" },
    create: { userId: admin.id, email: adminEmail, name: "Demo Admin" },
  });

  const servers = [];
  for (const spec of demoServerSpecs) {
    const server = await prisma.$transaction(
      async (tx) => {
        const existing = await tx.server.findUnique({
          where: { name: spec.name },
          include: { players: { select: { userId: true } } },
        });
        if (existing) {
          const demoUserIds = existing.players.map((player) => player.userId);
          await tx.server.delete({ where: { id: existing.id } });
          if (demoUserIds.length > 0) {
            await tx.user.deleteMany({ where: { id: { in: demoUserIds } } });
          }
        }

        const config = demoConfig(spec);
        const createdServer = await tx.server.create({
          data: {
            name: spec.name,
            description: spec.description,
            status: ServerStatus.ACTIVE,
            inequalityCondition: spec.inequalityCondition,
            uncertaintyCondition: spec.uncertaintyCondition,
            maxPlayers: 20,
            currentRound: 0,
            seasonLength: 7,
            treasury: 0,
            randomSeed: spec.randomSeed,
            config: {
              demo: true,
              mapWidth: 10,
              mapHeight: 10,
              actionPointsPerRound: config.actionPointsPerRound,
              startingWealth: config.startingWealth,
              taxRate: config.taxRate,
              formalContractFee: config.formalContractFee,
              informalContractFee: config.informalContractFee,
              formalDefaultRisk: config.formalDefaultRisk,
              informalDefaultRisk: config.informalDefaultRisk,
              shockProbability: config.shockProbability,
              safeAssetReturn: config.safeAssetReturn,
              publicGoodMultiplier: config.publicGoodMultiplier,
              investmentUnitCost: config.investmentUnitCost,
              lobbyingCost: config.lobbyingCost,
              productionA: config.production.A,
              productionBetaQ: config.production.betaQ,
              productionBetaK: config.production.betaK,
              minShockMultiplier: config.production.minShockMultiplier,
              maxShockMultiplier: config.production.maxShockMultiplier,
            },
          },
        });

        const generatedParcels = generateMap({
          seed: spec.randomSeed,
          inequality: spec.inequalityCondition,
          width: 10,
          height: 10,
        });
        await tx.parcel.createMany({
          data: generatedParcels.map((parcel) => ({
            serverId: createdServer.id,
            x: parcel.x,
            y: parcel.y,
            soil: parcel.soil,
            water: parcel.water,
            marketAccess: parcel.marketAccess,
            risk: parcel.risk,
            quality: parcel.quality,
          })),
        });

        const parcels = await tx.parcel.findMany({
          where: { serverId: createdServer.id },
          orderBy: [
            {
              quality:
                spec.inequalityCondition === InequalityCondition.HIGH
                  ? "desc"
                  : "asc",
            },
            { y: "asc" },
            { x: "asc" },
          ],
          take: 20,
        });

        for (let index = 0; index < 20; index += 1) {
          const user = await tx.user.create({
            data: {
              role: UserRole.PARTICIPANT,
            },
          });
          const player = await tx.player.create({
            data: {
              userId: user.id,
              serverId: createdServer.id,
              parcelId: parcels[index].id,
              wealth: config.startingWealth,
            },
          });
          await tx.parcel.update({
            where: { id: parcels[index].id },
            data: { ownerId: player.id },
          });
        }

        const now = new Date();
        const season = await tx.season.create({
          data: {
            serverId: createdServer.id,
            startsAt: now,
            endsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            status: SeasonStatus.ACTIVE,
          },
        });

        let activeRound = await tx.round.create({
          data: {
            serverId: createdServer.id,
            seasonId: season.id,
            roundNumber: 1,
            status: RoundStatus.ACTIVE,
            startsAt: now,
            endsAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          },
        });

        for (let roundNumber = 1; roundNumber <= 3; roundNumber += 1) {
          const activePlayers = await tx.player.findMany({
            where: { serverId: createdServer.id, exited: false },
            select: { id: true, parcelId: true },
            orderBy: { createdAt: "asc" },
          });
          const decisions = decisionsForRound(activePlayers, roundNumber);
          await tx.decision.createMany({
            data: decisions.map((decision) => ({
              playerId: decision.playerId,
              serverId: createdServer.id,
              roundNumber,
              actionType: decision.type as ActionType,
              amount: decision.amount ?? 0,
              targetPlayerId: decision.counterpartyId ?? null,
              payload: decision.parcelId ? { parcelId: decision.parcelId } : {},
            })),
          });
          await resolveSeedRound({
            tx,
            serverId: createdServer.id,
            seed: spec.randomSeed,
            uncertainty: spec.uncertaintyCondition,
            config,
            roundId: activeRound.id,
            roundNumber,
          });
          activeRound = await tx.round.create({
            data: {
              serverId: createdServer.id,
              seasonId: season.id,
              roundNumber: roundNumber + 1,
              status: RoundStatus.ACTIVE,
              startsAt: new Date(
                now.getTime() + roundNumber * 24 * 60 * 60 * 1000,
              ),
              endsAt: new Date(
                now.getTime() + (roundNumber + 1) * 24 * 60 * 60 * 1000,
              ),
            },
          });
        }

        await tx.server.update({
          where: { id: createdServer.id },
          data: { status: ServerStatus.ACTIVE, currentRound: 3 },
        });
        return createdServer;
      },
      { timeout: 30_000 },
    );
    servers.push(server);
  }

  return {
    adminEmail,
    adminPassword,
    serverCount: servers.length,
    serverNames: servers.map((server) => server.name),
  };
}
