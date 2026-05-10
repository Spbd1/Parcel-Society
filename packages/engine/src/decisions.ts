import { calculateOutput } from "./production";
import { decisionCost, validateDecisions } from "./validation";
import type {
  Contract,
  Decision,
  EngineConfig,
  Parcel,
  PlayerState,
  Shock,
  TreasuryTransaction,
} from "./types";

export { decisionCost, validateDecisions };

const clonePlayers = (players: readonly PlayerState[]): PlayerState[] =>
  players.map((player) => ({ ...player, parcelIds: [...player.parcelIds] }));

export const applyValidDecisions = ({
  players,
  parcels,
  decisions,
  config,
  round,
  shock,
}: {
  players: readonly PlayerState[];
  parcels: readonly Parcel[];
  decisions: readonly Decision[];
  config: EngineConfig;
  round: number;
  shock: Shock;
}): {
  players: PlayerState[];
  contracts: Contract[];
  treasuryTransactions: TreasuryTransaction[];
  totalOutput: number;
  taxesCollected: number;
  publicContributions: number;
} => {
  const updatedPlayers = clonePlayers(players);
  const contracts: Contract[] = [];
  const treasuryTransactions: TreasuryTransaction[] = [];
  let totalOutput = 0;
  let taxesCollected = 0;
  let publicContributions = 0;

  for (const decision of decisions) {
    const player = updatedPlayers.find(
      (candidate) => candidate.id === decision.playerId,
    );
    if (!player) {
      continue;
    }

    player.actionPointsRemaining -= 1;
    const amount = decision.amount ?? 0;

    switch (decision.type) {
      case "PRODUCE": {
        const parcel = parcels.find(
          (candidate) => candidate.id === decision.parcelId,
        );
        if (!parcel) {
          break;
        }
        const output = calculateOutput({
          parcel,
          productiveCapital: player.productiveCapital,
          shockMultiplier: shock.multiplier,
          config: config.production,
        });
        const tax = output * config.taxRate;
        player.wealth += output - tax;
        totalOutput += output;
        taxesCollected += tax;
        treasuryTransactions.push({
          round,
          playerId: player.id,
          amount: tax,
          reason: "TAX",
        });
        break;
      }
      case "PRODUCTIVE_INVESTMENT":
        player.wealth -= amount;
        player.productiveCapital += amount / config.investmentUnitCost;
        player.spentOnProductiveInvestment += amount;
        break;
      case "SAFE_ASSET":
        player.wealth -= amount;
        player.safeAssets += amount * (1 + config.safeAssetReturn);
        player.spentOnSafeAssets += amount;
        break;
      case "PUBLIC_CONTRIBUTION":
        player.wealth -= amount;
        player.contributedPublic += amount;
        publicContributions += amount;
        treasuryTransactions.push({
          round,
          playerId: player.id,
          amount,
          reason: "PUBLIC_CONTRIBUTION",
        });
        break;
      case "INFORMAL_CONTRACT":
      case "FORMAL_CONTRACT": {
        const isFormal = decision.type === "FORMAL_CONTRACT";
        const fee = isFormal
          ? config.formalContractFee
          : config.informalContractFee;
        player.wealth -= amount + fee;
        contracts.push({
          id: `contract-${round}-${contracts.length + 1}`,
          round,
          type: isFormal ? "FORMAL" : "INFORMAL",
          fromPlayerId: player.id,
          toPlayerId: decision.counterpartyId as string,
          amount,
          fee,
          defaultRisk: isFormal
            ? config.formalDefaultRisk
            : config.informalDefaultRisk,
        });
        treasuryTransactions.push({
          round,
          playerId: player.id,
          amount: fee,
          reason: `${isFormal ? "FORMAL" : "INFORMAL"}_CONTRACT_FEE`,
        });
        break;
      }
      case "LOBBYING":
        player.wealth -= amount || config.lobbyingCost;
        player.spentOnLobbying += amount || config.lobbyingCost;
        break;
      case "EXIT":
        player.exited = true;
        break;
    }
  }


  return {
    players: updatedPlayers,
    contracts,
    treasuryTransactions,
    totalOutput,
    taxesCollected,
    publicContributions,
  };
};
