import { resolveContracts } from "./contracts";
import { applyValidDecisions } from "./decisions";
import { createRandom } from "./random";
import { applyRuleChangeIfNeeded } from "./serverSimulator";
import { generateShock } from "./shocks";
import type { RoundResolverInput, RoundResolverResult } from "./types";
import { validateDecisions } from "./validation";

export const resolveRound = ({
  server,
  players,
  parcels,
  decisions,
  config,
  seed,
}: RoundResolverInput): RoundResolverResult => {
  const round = server.round + 1;
  const resetPlayers = players.map((player) => ({
    ...player,
    parcelIds: [...player.parcelIds],
    actionPointsRemaining: player.exited ? 0 : config.actionPointsPerRound,
  }));
  const ruleChange = applyRuleChangeIfNeeded({
    server: { ...server },
    seed,
    round,
  });
  const workingServer = ruleChange.server;
  const validation = validateDecisions({
    players: resetPlayers,
    parcels,
    decisions,
    config: {
      ...config,
      formalContractFee: workingServer.formalContractFee,
      taxRate: workingServer.taxRate,
      shockProbability: workingServer.shockProbability,
    },
  });
  const validDecisionKeys = new Set(
    validation.ok
      ? decisions.map((_, index) => index)
      : decisions
          .map((_, index) => index)
          .filter(
            (index) =>
              !validation.errors.some(
                (error) => error.decision === decisions[index],
              ),
          ),
  );
  const validDecisions = decisions.filter((_, index) =>
    validDecisionKeys.has(index),
  );
  const random = createRandom(`${seed}:round:${round}`);
  const shock = generateShock({
    round,
    shockProbability: workingServer.shockProbability,
    production: config.production,
    random,
  });
  const shockEvents = shock.occurred
    ? [
        {
          round,
          type: "SHOCK" as const,
          description: `Production shock applied with multiplier ${shock.multiplier.toFixed(3)}.`,
          newValue: shock.multiplier,
        },
      ]
    : [];

  const effectiveConfig = {
    ...config,
    taxRate: workingServer.taxRate,
    formalContractFee: workingServer.formalContractFee,
    shockProbability: workingServer.shockProbability,
  };
  const applied = applyValidDecisions({
    players: resetPlayers,
    parcels,
    decisions: validDecisions,
    config: effectiveConfig,
    round,
    shock,
  });
  const resolvedContracts = resolveContracts({
    contracts: applied.contracts,
    random,
  });
  const playersAfterContracts = applied.players.map((player) => ({
    ...player,
    parcelIds: [...player.parcelIds],
  }));

  for (const contract of resolvedContracts) {
    if (contract.fulfilled) {
      const receiver = playersAfterContracts.find(
        (player) => player.id === contract.toPlayerId,
      );
      if (receiver) {
        receiver.wealth += contract.amount;
      }
    }
  }

  const treasuryDelta = applied.treasuryTransactions.reduce(
    (total, transaction) => total + transaction.amount,
    0,
  );
  const serverEvents = [...ruleChange.events, ...shockEvents];
  const updatedServer = {
    ...workingServer,
    round,
    treasury: workingServer.treasury + treasuryDelta,
    events: [...workingServer.events, ...shockEvents],
  };

  return {
    server: updatedServer,
    players: playersAfterContracts,
    parcels: parcels.map((parcel) => ({ ...parcel })),
    contracts: resolvedContracts,
    serverEvents,
    treasuryTransactions: applied.treasuryTransactions,
    roundSummary: {
      round,
      totalOutput: applied.totalOutput,
      taxesCollected: applied.taxesCollected,
      publicContributions: applied.publicContributions,
      shocks: [shock],
      validationErrors: validation.errors,
    },
  };
};
