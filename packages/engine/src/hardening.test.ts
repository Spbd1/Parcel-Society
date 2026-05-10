import { describe, expect, it } from "vitest";
import { validateDecisions } from "./validation";
import type { EngineConfig, Parcel, PlayerState } from "./types";

const config: EngineConfig = {
  seed: "test",
  inequality: "LOW",
  uncertainty: "STABLE",
  mapWidth: 1,
  mapHeight: 1,
  actionPointsPerRound: 3,
  production: { A: 10, betaQ: 1, betaK: 0.35, minShockMultiplier: 0.4, maxShockMultiplier: 1 },
  taxRate: 0.15,
  formalContractFee: 2,
  informalContractFee: 0,
  informalDefaultRisk: 0.25,
  formalDefaultRisk: 0.05,
  shockProbability: 0.1,
  startingWealth: 100,
  investmentUnitCost: 10,
  safeAssetReturn: 0.03,
  publicGoodMultiplier: 1.5,
  lobbyingCost: 5,
};

const player = (overrides: Partial<PlayerState> = {}): PlayerState => ({
  id: "player-1",
  wealth: 10,
  productiveCapital: 0,
  safeAssets: 0,
  reputation: 0,
  exited: false,
  parcelIds: ["parcel-1"],
  actionPointsRemaining: 3,
  contributedPublic: 0,
  spentOnProductiveInvestment: 0,
  spentOnSafeAssets: 0,
  spentOnLobbying: 0,
  ...overrides,
});

const parcel: Parcel = {
  id: "parcel-1",
  x: 0,
  y: 0,
  soil: 1,
  water: 1,
  marketAccess: 1,
  risk: 0,
  quality: 1,
  ownerId: "player-1",
};

describe("decision submission constraints", () => {
  it("blocks exited players from acting", () => {
    const result = validateDecisions({
      players: [player({ exited: true })],
      parcels: [parcel],
      decisions: [{ playerId: "player-1", type: "PRODUCE", parcelId: "parcel-1" }],
      config,
    });
    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("PLAYER_EXITED");
  });

  it("blocks spending more wealth than the player has", () => {
    const result = validateDecisions({
      players: [player({ wealth: 5 })],
      parcels: [parcel],
      decisions: [{ playerId: "player-1", type: "SAFE_ASSET", amount: 6 }],
      config,
    });
    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("INSUFFICIENT_RESOURCES");
  });

  it("blocks more than three action points", () => {
    const result = validateDecisions({
      players: [player()],
      parcels: [parcel],
      decisions: [
        { playerId: "player-1", type: "PRODUCE", parcelId: "parcel-1" },
        { playerId: "player-1", type: "PRODUCE", parcelId: "parcel-1" },
        { playerId: "player-1", type: "PRODUCE", parcelId: "parcel-1" },
        { playerId: "player-1", type: "PRODUCE", parcelId: "parcel-1" },
      ],
      config,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.at(-1)?.code).toBe("INSUFFICIENT_ACTION_POINTS");
  });
});
