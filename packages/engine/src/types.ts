export type InequalityCondition = "LOW" | "HIGH";
export type UncertaintyCondition = "STABLE" | "UNCERTAIN";

export type ActionType =
  | "PRODUCE"
  | "PRODUCTIVE_INVESTMENT"
  | "SAFE_ASSET"
  | "PUBLIC_CONTRIBUTION"
  | "INFORMAL_CONTRACT"
  | "FORMAL_CONTRACT"
  | "LOBBYING"
  | "EXIT";

export type RuleChangeEventType =
  | "TAX_CHANGE"
  | "FORMAL_CONTRACT_FEE_CHANGE"
  | "SHOCK_PROBABILITY_CHANGE";

export interface EngineConfig {
  seed: string | number;
  inequality: InequalityCondition;
  uncertainty: UncertaintyCondition;
  mapWidth: number;
  mapHeight: number;
  actionPointsPerRound: number;
  production: ProductionConfig;
  taxRate: number;
  formalContractFee: number;
  informalContractFee: number;
  informalDefaultRisk: number;
  formalDefaultRisk: number;
  shockProbability: number;
  startingWealth: number;
  investmentUnitCost: number;
  safeAssetReturn: number;
  lobbyingCost: number;
  uncertaintyRuleChangeRounds?: readonly number[];
  uncertaintyPossibleEvents?: readonly RuleChangeEventType[];
}

export interface ProductionConfig {
  A: number;
  betaQ: number;
  betaK: number;
  minShockMultiplier: number;
  maxShockMultiplier: number;
}

export interface Parcel {
  id: string;
  x: number;
  y: number;
  soil: number;
  water: number;
  marketAccess: number;
  risk: number;
  quality: number;
  ownerId?: string;
}

export interface PlayerState {
  id: string;
  wealth: number;
  productiveCapital: number;
  safeAssets: number;
  exited: boolean;
  parcelIds: string[];
  actionPointsRemaining: number;
  contributedPublic: number;
  spentOnProductiveInvestment: number;
  spentOnSafeAssets: number;
  spentOnLobbying: number;
}

export interface ServerState {
  round: number;
  taxRate: number;
  formalContractFee: number;
  shockProbability: number;
  treasury: number;
  uncertainty: UncertaintyCondition;
  events: ServerEvent[];
}

export interface Decision {
  playerId: string;
  type: ActionType;
  amount?: number;
  parcelId?: string;
  counterpartyId?: string;
}

export interface Contract {
  id: string;
  round: number;
  type: "INFORMAL" | "FORMAL";
  fromPlayerId: string;
  toPlayerId: string;
  amount: number;
  fee: number;
  defaultRisk: number;
  fulfilled?: boolean;
}

export interface ServerEvent {
  round: number;
  type: RuleChangeEventType | "SHOCK";
  description: string;
  previousValue?: number;
  newValue?: number;
}

export interface TreasuryTransaction {
  round: number;
  playerId?: string;
  amount: number;
  reason: string;
}

export interface Shock {
  round: number;
  occurred: boolean;
  multiplier: number;
}

export interface ValidationError {
  code:
    | "PLAYER_NOT_FOUND"
    | "PLAYER_EXITED"
    | "INSUFFICIENT_ACTION_POINTS"
    | "INSUFFICIENT_RESOURCES"
    | "INVALID_AMOUNT"
    | "INVALID_PARCEL"
    | "COUNTERPARTY_NOT_FOUND";
  message: string;
  playerId?: string;
  decision?: Decision;
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationError[];
}

export interface RoundSummary {
  round: number;
  totalOutput: number;
  taxesCollected: number;
  publicContributions: number;
  shocks: Shock[];
  validationErrors: ValidationError[];
}

export interface RoundResolverInput {
  server: ServerState;
  players: PlayerState[];
  parcels: Parcel[];
  decisions: Decision[];
  config: EngineConfig;
  seed: string | number;
}

export interface RoundResolverResult {
  server: ServerState;
  players: PlayerState[];
  parcels: Parcel[];
  contracts: Contract[];
  serverEvents: ServerEvent[];
  treasuryTransactions: TreasuryTransaction[];
  roundSummary: RoundSummary;
}

export interface Scores {
  informalCooperationRate: number;
  contractReliability: number;
  productiveInvestmentShare: number;
  publicContributionShare: number;
  exitRate: number;
  safeAssetShare: number;
  lobbyingShare: number;
  finalWealthGini: number;
}
