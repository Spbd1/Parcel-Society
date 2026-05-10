import { describe, expect, it } from "vitest";

import {
  DEFAULT_ENGINE_CONFIG,
  calculateOutput,
  createInitialPlayers,
  createInitialServerState,
  generateMap,
  generateShockSchedule,
  gini,
  parcelQualityGini,
  resolveRound,
  validateDecisions,
  type ActionType,
  type Decision,
  type EngineConfig,
  type Parcel,
} from "./index";

const config: EngineConfig = { ...DEFAULT_ENGINE_CONFIG, seed: "test-seed" };

const ownedParcel = (ownerId = "player-1"): Parcel => ({
  id: "parcel-0-0",
  x: 0,
  y: 0,
  soil: 0.5,
  water: 0.5,
  marketAccess: 0.5,
  risk: 0.5,
  quality: 0.5,
  ownerId,
});

describe("engine package", () => {
  it("exports initial research action types", () => {
    const action: ActionType = "PRODUCE";

    expect(action).toBe("PRODUCE");
  });

  it("generates deterministic maps", () => {
    expect(generateMap({ seed: "abc", inequality: "LOW" })).toEqual(
      generateMap({ seed: "abc", inequality: "LOW" }),
    );
    expect(generateMap({ seed: "abc", inequality: "LOW" })).toHaveLength(100);
  });

  it("calculates the Gini coefficient", () => {
    expect(gini([1, 1, 1])).toBe(0);
    expect(gini([0, 0, 10])).toBeCloseTo(2 / 3);
  });

  it("calculates production output", () => {
    const output = calculateOutput({
      parcel: { quality: 0.5 },
      productiveCapital: 4,
      shockMultiplier: 0.75,
      config: {
        A: 10,
        betaQ: 0.8,
        betaK: 0.5,
        minShockMultiplier: 0.5,
        maxShockMultiplier: 1,
      },
    });

    expect(output).toBeCloseTo(10 * 1.5 ** 0.8 * 5 ** 0.5 * 0.75);
  });

  it("validates action point limits", () => {
    const players = createInitialPlayers(1, config);
    const decisions: Decision[] = [
      { playerId: "player-1", type: "SAFE_ASSET", amount: 1 },
      { playerId: "player-1", type: "SAFE_ASSET", amount: 1 },
      { playerId: "player-1", type: "SAFE_ASSET", amount: 1 },
      { playerId: "player-1", type: "SAFE_ASSET", amount: 1 },
    ];

    const result = validateDecisions({
      players,
      parcels: [],
      decisions,
      config,
    });

    expect(result.ok).toBe(false);
    expect(
      result.errors.some(
        (error) => error.code === "INSUFFICIENT_ACTION_POINTS",
      ),
    ).toBe(true);
  });

  it("prevents overspending", () => {
    const players = createInitialPlayers(1, { ...config, startingWealth: 5 });
    const result = validateDecisions({
      players,
      parcels: [],
      decisions: [
        { playerId: "player-1", type: "PRODUCTIVE_INVESTMENT", amount: 6 },
      ],
      config,
    });

    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("INSUFFICIENT_RESOURCES");
  });

  it("prevents exited players from acting", () => {
    const players = createInitialPlayers(1, config).map((player) => ({
      ...player,
      exited: true,
    }));
    const result = validateDecisions({
      players,
      parcels: [],
      decisions: [{ playerId: "player-1", type: "SAFE_ASSET", amount: 1 }],
      config,
    });

    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("PLAYER_EXITED");
  });

  it("generates deterministic shock schedules", () => {
    const first = generateShockSchedule({
      seed: "shock-seed",
      rounds: 6,
      shockProbability: 0.8,
      production: config.production,
    });
    const second = generateShockSchedule({
      seed: "shock-seed",
      rounds: 6,
      shockProbability: 0.8,
      production: config.production,
    });

    expect(first).toEqual(second);
  });

  it("produces higher parcel quality Gini under high inequality", () => {
    const low = parcelQualityGini(
      generateMap({ seed: "ineq", inequality: "LOW" }),
    );
    const high = parcelQualityGini(
      generateMap({ seed: "ineq", inequality: "HIGH" }),
    );

    expect(high).toBeGreaterThan(low);
  });

  it("records public contributions as treasury inflows without same-round payouts", () => {
    const players = createInitialPlayers(2, config);
    const result = resolveRound({
      server: createInitialServerState(config),
      players,
      parcels: [],
      decisions: [
        { playerId: "player-1", type: "PUBLIC_CONTRIBUTION", amount: 5 },
      ],
      config,
      seed: "public-contribution-seed",
    });

    expect(result.server.treasury).toBe(5);
    expect(result.players.find((player) => player.id === "player-1")?.wealth).toBe(config.startingWealth - 5);
    expect(result.players.find((player) => player.id === "player-2")?.wealth).toBe(config.startingWealth);
    expect(result.roundSummary.publicContributions).toBe(5);
  });

  it("resolves a round into a valid state", () => {
    const parcels = [ownedParcel()];
    const players = createInitialPlayers(2, config).map((player, index) => ({
      ...player,
      parcelIds: index === 0 ? ["parcel-0-0"] : [],
    }));
    const result = resolveRound({
      server: createInitialServerState(config),
      players,
      parcels,
      decisions: [
        { playerId: "player-1", type: "PRODUCE", parcelId: "parcel-0-0" },
        { playerId: "player-1", type: "PRODUCTIVE_INVESTMENT", amount: 10 },
        { playerId: "player-2", type: "PUBLIC_CONTRIBUTION", amount: 5 },
      ],
      config,
      seed: "round-seed",
    });

    expect(result.server.round).toBe(1);
    expect(result.players).toHaveLength(2);
    expect(result.roundSummary.validationErrors).toHaveLength(0);
    expect(result.server.treasury).toBeGreaterThan(0);
    expect(
      result.players.every((player) => player.actionPointsRemaining >= 0),
    ).toBe(true);
  });
});

describe("research treatment reproducibility", () => {
  it("only applies configured uncertainty rule changes on uncertain servers", () => {
    const stable = resolveRound({
      server: createInitialServerState({
        ...config,
        uncertainty: "STABLE",
        uncertaintyRuleChangeRounds: [1],
        uncertaintyPossibleEvents: ["TAX_CHANGE"],
      }),
      players: createInitialPlayers(1, config),
      parcels: [ownedParcel()],
      decisions: [],
      config: {
        ...config,
        uncertainty: "STABLE",
        uncertaintyRuleChangeRounds: [1],
        uncertaintyPossibleEvents: ["TAX_CHANGE"],
      },
      seed: "uncertainty-seed",
    });
    const uncertain = resolveRound({
      server: createInitialServerState({
        ...config,
        uncertainty: "UNCERTAIN",
        uncertaintyRuleChangeRounds: [1],
        uncertaintyPossibleEvents: ["TAX_CHANGE"],
      }),
      players: createInitialPlayers(1, config),
      parcels: [ownedParcel()],
      decisions: [],
      config: {
        ...config,
        uncertainty: "UNCERTAIN",
        uncertaintyRuleChangeRounds: [1],
        uncertaintyPossibleEvents: ["TAX_CHANGE"],
      },
      seed: "uncertainty-seed",
    });

    expect(stable.serverEvents).toHaveLength(0);
    expect(uncertain.serverEvents).toHaveLength(1);
    expect(uncertain.serverEvents[0]?.type).toBe("TAX_CHANGE");
  });
});
