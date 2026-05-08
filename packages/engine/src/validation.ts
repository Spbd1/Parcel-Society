import type {
  Decision,
  EngineConfig,
  Parcel,
  PlayerState,
  ValidationError,
  ValidationResult,
} from "./types";

export const decisionCost = (
  decision: Decision,
  config: EngineConfig,
): number => {
  const amount = decision.amount ?? 0;
  switch (decision.type) {
    case "PRODUCTIVE_INVESTMENT":
      return amount;
    case "SAFE_ASSET":
      return amount;
    case "PUBLIC_CONTRIBUTION":
      return amount;
    case "INFORMAL_CONTRACT":
      return amount + config.informalContractFee;
    case "FORMAL_CONTRACT":
      return amount + config.formalContractFee;
    case "LOBBYING":
      return decision.amount ?? config.lobbyingCost;
    case "PRODUCE":
    case "EXIT":
      return 0;
  }
};

export const validateDecisions = ({
  players,
  parcels,
  decisions,
  config,
}: {
  players: readonly PlayerState[];
  parcels: readonly Parcel[];
  decisions: readonly Decision[];
  config: EngineConfig;
}): ValidationResult => {
  const errors: ValidationError[] = [];
  const wealthRemaining = new Map(
    players.map((player) => [player.id, player.wealth]),
  );
  const actionPointsRemaining = new Map(
    players.map((player) => [player.id, player.actionPointsRemaining]),
  );

  for (const decision of decisions) {
    const player = players.find(
      (candidate) => candidate.id === decision.playerId,
    );

    if (!player) {
      errors.push({
        code: "PLAYER_NOT_FOUND",
        message: "Player does not exist.",
        playerId: decision.playerId,
        decision,
      });
      continue;
    }

    if (player.exited) {
      errors.push({
        code: "PLAYER_EXITED",
        message: "Exited players cannot act.",
        playerId: player.id,
        decision,
      });
      continue;
    }

    const amount = decision.amount ?? 0;
    if (amount < 0 || !Number.isFinite(amount)) {
      errors.push({
        code: "INVALID_AMOUNT",
        message: "Decision amount must be a non-negative finite number.",
        playerId: player.id,
        decision,
      });
      continue;
    }

    const remainingAp = actionPointsRemaining.get(player.id) ?? 0;
    if (remainingAp < 1) {
      errors.push({
        code: "INSUFFICIENT_ACTION_POINTS",
        message: "Player has insufficient action points.",
        playerId: player.id,
        decision,
      });
      continue;
    }
    actionPointsRemaining.set(player.id, remainingAp - 1);

    if (decision.type === "PRODUCE") {
      const parcel = parcels.find(
        (candidate) => candidate.id === decision.parcelId,
      );
      if (
        !parcel ||
        (parcel.ownerId && parcel.ownerId !== player.id) ||
        (!parcel.ownerId && !player.parcelIds.includes(parcel.id))
      ) {
        errors.push({
          code: "INVALID_PARCEL",
          message: "Player cannot produce on this parcel.",
          playerId: player.id,
          decision,
        });
        continue;
      }
    }

    if (
      decision.type === "FORMAL_CONTRACT" ||
      decision.type === "INFORMAL_CONTRACT"
    ) {
      if (
        !decision.counterpartyId ||
        !players.some((candidate) => candidate.id === decision.counterpartyId)
      ) {
        errors.push({
          code: "COUNTERPARTY_NOT_FOUND",
          message: "Contract counterparty does not exist.",
          playerId: player.id,
          decision,
        });
        continue;
      }
    }

    const cost = decisionCost(decision, config);
    const remainingWealth = wealthRemaining.get(player.id) ?? 0;
    if (cost > remainingWealth) {
      errors.push({
        code: "INSUFFICIENT_RESOURCES",
        message: "Player cannot spend more resources than available.",
        playerId: player.id,
        decision,
      });
      continue;
    }
    wealthRemaining.set(player.id, remainingWealth - cost);
  }

  return { ok: errors.length === 0, errors };
};
