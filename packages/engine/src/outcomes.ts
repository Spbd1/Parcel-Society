import { gini } from "./gini";

export type OutcomeActionType =
  | "PRODUCE"
  | "PRODUCTIVE_INVESTMENT"
  | "SAFE_ASSET"
  | "PUBLIC_CONTRIBUTION"
  | "INFORMAL_CONTRACT"
  | "FORMAL_CONTRACT"
  | "LOBBYING"
  | "EXIT";

export type OutcomeContractType = "INFORMAL" | "FORMAL";

export interface OutcomeDecisionLike {
  round: number;
  actionType: OutcomeActionType;
  amount: number;
}

export interface OutcomeContractLike {
  round: number;
  contractType: OutcomeContractType;
  fulfilled?: boolean | null;
  defaulted?: boolean | null;
}

export interface OutcomePlayerLike {
  id: string;
  wealth: number;
  safeAsset?: number;
  exited: boolean;
  roundExited?: number | null;
}

export interface OutcomePlayerRoundStateLike {
  playerId: string;
  round: number;
  wealth: number;
  safeAsset?: number;
  exited: boolean;
  totalOutput?: number;
}

export interface OutcomeTreasuryTransactionLike {
  round?: number | null;
  amount: number;
}

export interface OutcomeParcelLike {
  quality: number;
}

export interface RoundOutcomes {
  round: number;
  informalCooperationRate: number;
  contractReliability: number;
  productiveInvestmentShare: number;
  publicContributionShare: number;
  exitRate: number;
  safeAssetShare: number;
  lobbyingShare: number;
  totalOutput: number;
  treasuryBalance: number;
  activePlayers: number;
  finalWealthGini: number;
  initialParcelQualityGini: number;
  formalContractShare: number;
  averageWealth: number;
  medianWealth: number;
  informalContractsStarted: number;
  formalContractsStarted: number;
  totalContractsStarted: number;
}

export interface ServerOutcomes {
  rounds: RoundOutcomes[];
  latest?: RoundOutcomes;
}

export interface CalculateOutcomesInput {
  players: readonly OutcomePlayerLike[];
  parcels: readonly OutcomeParcelLike[];
  decisions: readonly OutcomeDecisionLike[];
  contracts: readonly OutcomeContractLike[];
  playerRoundStates?: readonly OutcomePlayerRoundStateLike[];
  treasuryTransactions?: readonly OutcomeTreasuryTransactionLike[];
  rounds?: readonly number[];
  initialTreasury?: number;
}

const allocationActions = new Set<OutcomeActionType>([
  "PRODUCTIVE_INVESTMENT",
  "PUBLIC_CONTRIBUTION",
  "SAFE_ASSET",
  "LOBBYING",
]);

const share = (part: number, whole: number): number => (whole === 0 ? 0 : part / whole);

const median = (values: readonly number[]): number => {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
};

const average = (values: readonly number[]): number =>
  values.length === 0 ? 0 : values.reduce((total, value) => total + value, 0) / values.length;

export const resolvedContractReliability = (
  contracts: readonly Pick<OutcomeContractLike, "fulfilled" | "defaulted">[],
): number => {
  const resolved = contracts.filter(
    (contract) =>
      (contract.fulfilled !== null && contract.fulfilled !== undefined)
      || (contract.defaulted !== null && contract.defaulted !== undefined),
  );
  return share(
    resolved.filter((contract) => contract.fulfilled === true && contract.defaulted !== true).length,
    resolved.length,
  );
};

export const calculateRoundOutcomes = (
  input: CalculateOutcomesInput & { round: number },
): RoundOutcomes => {
  const { round, players, parcels, decisions, contracts } = input;
  const playerRoundStates = input.playerRoundStates ?? [];
  const treasuryTransactions = input.treasuryTransactions ?? [];
  const roundDecisions = decisions.filter((decision) => decision.round === round);
  const roundContracts = contracts.filter((contract) => contract.round === round);
  const roundStates = playerRoundStates.filter((state) => state.round === round);
  const spending = roundDecisions
    .filter((decision) => allocationActions.has(decision.actionType))
    .reduce((total, decision) => total + decision.amount, 0);
  const spendByType = (actionType: OutcomeActionType) =>
    roundDecisions
      .filter((decision) => decision.actionType === actionType)
      .reduce((total, decision) => total + decision.amount, 0);
  const informalContractsStarted = roundContracts.filter((contract) => contract.contractType === "INFORMAL").length;
  const formalContractsStarted = roundContracts.filter((contract) => contract.contractType === "FORMAL").length;
  const totalContractsStarted = informalContractsStarted + formalContractsStarted;
  const exitedPlayers = roundStates.length > 0
    ? roundStates.filter((state) => state.exited).length
    : players.filter((player) => player.exited && (player.roundExited ?? Number.POSITIVE_INFINITY) <= round).length;
  const activePlayers = roundStates.length > 0
    ? roundStates.filter((state) => !state.exited).length
    : players.filter((player) => !player.exited || (player.roundExited ?? Number.POSITIVE_INFINITY) > round).length;
  const wealthValues = roundStates.length > 0
    ? roundStates.map((state) => state.wealth + (state.safeAsset ?? 0))
    : players.map((player) => player.wealth + (player.safeAsset ?? 0));
  const totalOutput = roundStates.find((state) => state.totalOutput !== undefined)?.totalOutput ?? 0;
  const treasuryBalance = (input.initialTreasury ?? 0) + treasuryTransactions
    .filter((transaction) => (transaction.round ?? 0) <= round)
    .reduce((total, transaction) => total + transaction.amount, 0);

  return {
    round,
    informalCooperationRate: share(informalContractsStarted, totalContractsStarted),
    contractReliability: resolvedContractReliability(roundContracts),
    productiveInvestmentShare: share(spendByType("PRODUCTIVE_INVESTMENT"), spending),
    publicContributionShare: share(spendByType("PUBLIC_CONTRIBUTION"), spending),
    exitRate: share(exitedPlayers, players.length),
    safeAssetShare: share(spendByType("SAFE_ASSET"), spending),
    lobbyingShare: share(spendByType("LOBBYING"), spending),
    totalOutput,
    treasuryBalance,
    activePlayers,
    finalWealthGini: gini(wealthValues),
    initialParcelQualityGini: gini(parcels.map((parcel) => parcel.quality)),
    formalContractShare: share(formalContractsStarted, totalContractsStarted),
    averageWealth: average(wealthValues),
    medianWealth: median(wealthValues),
    informalContractsStarted,
    formalContractsStarted,
    totalContractsStarted,
  };
};

export const calculateServerOutcomes = (input: CalculateOutcomesInput): ServerOutcomes => {
  const rounds = [...new Set(input.rounds ?? [
    ...input.decisions.map((decision) => decision.round),
    ...input.contracts.map((contract) => contract.round),
    ...(input.playerRoundStates ?? []).map((state) => state.round),
    ...(input.treasuryTransactions ?? []).map((transaction) => transaction.round ?? 0),
  ])]
    .filter((round) => round > 0)
    .sort((a, b) => a - b);
  const roundOutcomes = rounds.map((round) => calculateRoundOutcomes({ ...input, round }));
  return {
    rounds: roundOutcomes,
    latest: roundOutcomes.at(-1),
  };
};
