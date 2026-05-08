import { generateMap } from "./mapGenerator";
import { createRandom } from "./random";
import { resolveRound } from "./roundResolver";
import { DEFAULT_PRODUCTION_CONFIG } from "./production";
import type {
  Decision,
  EngineConfig,
  PlayerState,
  RuleChangeEventType,
  RoundResolverResult,
  ServerEvent,
  ServerState,
} from "./types";

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  seed: "parcel-society",
  inequality: "LOW",
  uncertainty: "STABLE",
  mapWidth: 10,
  mapHeight: 10,
  actionPointsPerRound: 3,
  production: DEFAULT_PRODUCTION_CONFIG,
  taxRate: 0.1,
  formalContractFee: 2,
  informalContractFee: 0.5,
  informalDefaultRisk: 0.35,
  formalDefaultRisk: 0.08,
  shockProbability: 0.25,
  startingWealth: 100,
  investmentUnitCost: 10,
  safeAssetReturn: 0.02,
  publicGoodMultiplier: 1.4,
  lobbyingCost: 5,
};

export const createInitialServerState = (
  config: EngineConfig = DEFAULT_ENGINE_CONFIG,
): ServerState => ({
  round: 0,
  taxRate: config.taxRate,
  formalContractFee: config.formalContractFee,
  shockProbability: config.shockProbability,
  treasury: 0,
  uncertainty: config.uncertainty,
  events: [],
});

export const createInitialPlayers = (
  count: number,
  config: EngineConfig = DEFAULT_ENGINE_CONFIG,
): PlayerState[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `player-${index + 1}`,
    wealth: config.startingWealth,
    productiveCapital: 0,
    safeAssets: 0,
    exited: false,
    parcelIds: [],
    actionPointsRemaining: config.actionPointsPerRound,
    contributedPublic: 0,
    spentOnProductiveInvestment: 0,
    spentOnSafeAssets: 0,
    spentOnLobbying: 0,
  }));

export const applyRuleChangeIfNeeded = ({
  server,
  seed,
  round,
}: {
  server: ServerState;
  seed: string | number;
  round: number;
}): { server: ServerState; events: ServerEvent[] } => {
  if (server.uncertainty !== "UNCERTAIN" || (round !== 3 && round !== 5)) {
    return { server, events: [] };
  }

  const random = createRandom(`${seed}:rule-change:${round}`);
  const eventType = random.pick<RuleChangeEventType>([
    "TAX_CHANGE",
    "FORMAL_CONTRACT_FEE_CHANGE",
    "SHOCK_PROBABILITY_CHANGE",
  ]);
  const nextServer = { ...server, events: [...server.events] };
  const direction = random.boolean(0.5) ? 1 : -1;
  const event: ServerEvent = {
    round,
    type: eventType,
    description: "Institutional rule change.",
  };

  if (eventType === "TAX_CHANGE") {
    event.previousValue = nextServer.taxRate;
    nextServer.taxRate = Math.max(
      0,
      Math.min(0.5, nextServer.taxRate + direction * random.float(0.02, 0.08)),
    );
    event.newValue = nextServer.taxRate;
  } else if (eventType === "FORMAL_CONTRACT_FEE_CHANGE") {
    event.previousValue = nextServer.formalContractFee;
    nextServer.formalContractFee = Math.max(
      0,
      nextServer.formalContractFee + direction * random.float(0.5, 2),
    );
    event.newValue = nextServer.formalContractFee;
  } else {
    event.previousValue = nextServer.shockProbability;
    nextServer.shockProbability = Math.max(
      0,
      Math.min(
        1,
        nextServer.shockProbability + direction * random.float(0.05, 0.2),
      ),
    );
    event.newValue = nextServer.shockProbability;
  }

  return {
    server: { ...nextServer, events: [...nextServer.events, event] },
    events: [event],
  };
};

export const runServerSimulation = ({
  config = DEFAULT_ENGINE_CONFIG,
  playerCount,
  decisionsByRound,
}: {
  config?: EngineConfig;
  playerCount: number;
  decisionsByRound: readonly (readonly Decision[])[];
}): RoundResolverResult[] => {
  let server = createInitialServerState(config);
  let players = createInitialPlayers(playerCount, config);
  let parcels = generateMap({
    seed: config.seed,
    inequality: config.inequality,
    width: config.mapWidth,
    height: config.mapHeight,
  });

  parcels = parcels.map((parcel, index) => {
    const owner = players[index % players.length];
    if (!owner) {
      return parcel;
    }
    owner.parcelIds.push(parcel.id);
    return { ...parcel, ownerId: owner.id };
  });

  return decisionsByRound.map((roundDecisions) => {
    const result = resolveRound({
      server,
      players,
      parcels,
      decisions: [...roundDecisions],
      config,
      seed: config.seed,
    });
    server = result.server;
    players = result.players;
    parcels = result.parcels;
    return result;
  });
};
