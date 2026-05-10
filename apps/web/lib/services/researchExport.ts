import { ActionType, ContractType, prisma, type Prisma } from "@parcel-society/db";
import { gini } from "@parcel-society/engine";
import { ApiException } from "../api/responses";
import { defaultEngineConfig } from "./game";

const textEncoder = new TextEncoder();

type Decimalish = { toNumber(): number } | number | null | undefined;
type CsvRow = Record<string, unknown>;

type ExportScope =
  | { type: "server"; serverId: string }
  | { type: "all" };

const numberValue = (value: Decimalish): number => {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : value.toNumber();
};

const jsonObject = (value: Prisma.JsonValue): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const csvEscape = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  const text = value instanceof Date ? value.toISOString() : typeof value === "object" ? JSON.stringify(value) : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const tableToCsv = (headers: readonly string[], rows: readonly CsvRow[]): string =>
  [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n") + "\n";

const crcTable = new Uint32Array(256);
for (let index = 0; index < 256; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  crcTable[index] = value >>> 0;
}

const crc32 = (data: Uint8Array): number => {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const dosDateTime = (date: Date): { date: number; time: number } => ({
  date: (((date.getFullYear() - 1980) & 0x7f) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
});

const uint16 = (value: number): Uint8Array => {
  const buffer = new Uint8Array(2);
  const view = new DataView(buffer.buffer);
  view.setUint16(0, value, true);
  return buffer;
};

const uint32 = (value: number): Uint8Array => {
  const buffer = new Uint8Array(4);
  const view = new DataView(buffer.buffer);
  view.setUint32(0, value >>> 0, true);
  return buffer;
};

const concatBytes = (parts: readonly Uint8Array[]): Uint8Array => {
  const totalLength = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
};

const zipFiles = (files: Record<string, string>): Uint8Array => {
  const now = new Date();
  const timestamp = dosDateTime(now);
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const [filename, content] of Object.entries(files)) {
    const name = textEncoder.encode(filename);
    const data = textEncoder.encode(content);
    const crc = crc32(data);
    const localHeader = concatBytes([
      uint32(0x04034b50),
      uint16(20),
      uint16(0x0800),
      uint16(0),
      uint16(timestamp.time),
      uint16(timestamp.date),
      uint32(crc),
      uint32(data.length),
      uint32(data.length),
      uint16(name.length),
      uint16(0),
      name,
    ]);
    const centralHeader = concatBytes([
      uint32(0x02014b50),
      uint16(20),
      uint16(20),
      uint16(0x0800),
      uint16(0),
      uint16(timestamp.time),
      uint16(timestamp.date),
      uint32(crc),
      uint32(data.length),
      uint32(data.length),
      uint16(name.length),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(0),
      uint32(offset),
      name,
    ]);
    localParts.push(localHeader, data);
    centralParts.push(centralHeader);
    offset += localHeader.length + data.length;
  }

  const centralDirectory = concatBytes(centralParts);
  const end = concatBytes([
    uint32(0x06054b50),
    uint16(0),
    uint16(0),
    uint16(centralParts.length),
    uint16(centralParts.length),
    uint32(centralDirectory.length),
    uint32(offset),
    uint16(0),
  ]);

  return concatBytes([...localParts, centralDirectory, end]);
};

const playerHeaders = [
  "player_id",
  "server_id",
  "treatment_inequality",
  "treatment_uncertainty",
  "initial_parcel_quality",
  "initial_wealth",
  "final_wealth",
  "productive_capital_final",
  "safe_asset_final",
  "exited",
  "round_exited",
];
const parcelHeaders = ["parcel_id", "server_id", "x", "y", "soil", "water", "market_access", "risk", "quality", "owner_player_id"];
const decisionHeaders = ["decision_id", "server_id", "player_id", "round", "action_type", "amount", "target_player_id", "created_at"];
const contractHeaders = ["contract_id", "server_id", "round", "sender_id", "receiver_id", "contract_type", "value", "fee", "fulfilled", "defaulted"];
const eventHeaders = ["event_id", "server_id", "round", "event_type", "event_value_json", "created_at"];
const transactionHeaders = ["transaction_id", "server_id", "player_id", "round", "type", "amount", "description"];
const roundOutcomeHeaders = [
  "server_id",
  "round",
  "informal_cooperation_rate",
  "contract_reliability",
  "productive_investment_share",
  "public_contribution_share",
  "exit_rate",
  "safe_asset_share",
  "lobbying_share",
  "treasury",
  "active_players",
  "total_output",
];
const serverSummaryHeaders = [
  "server_id",
  "inequality_condition",
  "uncertainty_condition",
  "random_seed",
  "initial_land_gini",
  "final_wealth_gini",
  "final_exit_rate",
  "final_contract_reliability",
  "final_public_contribution_share",
  "final_productive_investment_share",
];

const share = (part: number, whole: number): number => (whole === 0 ? 0 : part / whole);

const resolvedContractReliability = (contracts: Array<{ fulfilled: boolean | null; defaulted: boolean | null }>): number => {
  const resolved = contracts.filter((contract) => contract.fulfilled !== null || contract.defaulted !== null);
  return share(resolved.filter((contract) => contract.fulfilled === true && contract.defaulted !== true).length, resolved.length);
};

const roundSummaryOutput = (states: Array<{ state: Prisma.JsonValue }>): number => {
  for (const state of states) {
    const summary = jsonObject(jsonObject(state.state).roundSummary as Prisma.JsonValue);
    const value = summary.totalOutput;
    if (typeof value === "number") return value;
  }
  return 0;
};

export const buildResearchExportZip = async (scope: ExportScope): Promise<Uint8Array> => {
  const where = scope.type === "server" ? { id: scope.serverId } : {};
  const servers = await prisma.server.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: {
      players: { include: { parcel: true }, orderBy: { createdAt: "asc" } },
      parcels: { orderBy: [{ serverId: "asc" }, { y: "asc" }, { x: "asc" }] },
      decisions: { orderBy: [{ serverId: "asc" }, { roundNumber: "asc" }, { createdAt: "asc" }] },
      contracts: { orderBy: [{ serverId: "asc" }, { roundNumber: "asc" }, { createdAt: "asc" }] },
      events: { orderBy: [{ serverId: "asc" }, { roundNumber: "asc" }, { createdAt: "asc" }] },
      treasuryTransactions: { orderBy: [{ serverId: "asc" }, { roundNumber: "asc" }, { createdAt: "asc" }] },
      playerRoundStates: { orderBy: [{ serverId: "asc" }, { roundNumber: "asc" }, { playerId: "asc" }] },
    },
  });

  if (scope.type === "server" && servers.length === 0) {
    throw new ApiException(404, "SERVER_NOT_FOUND", "Server was not found.");
  }

  const playerRows: CsvRow[] = [];
  const parcelRows: CsvRow[] = [];
  const decisionRows: CsvRow[] = [];
  const contractRows: CsvRow[] = [];
  const eventRows: CsvRow[] = [];
  const transactionRows: CsvRow[] = [];
  const roundOutcomeRows: CsvRow[] = [];
  const serverSummaryRows: CsvRow[] = [];

  for (const server of servers) {
    const config = defaultEngineConfig(server);
    const players = server.players;
    const parcels = server.parcels;
    const decisions = server.decisions;
    const contracts = server.contracts;
    const events = server.events;
    const treasuryTransactions = server.treasuryTransactions;
    const playerRoundStates = server.playerRoundStates;
    const rounds = [...new Set([
      ...decisions.map((decision) => decision.roundNumber),
      ...contracts.map((contract) => contract.roundNumber),
      ...events.map((event) => event.roundNumber),
      ...treasuryTransactions.map((transaction) => transaction.roundNumber ?? 0),
      ...playerRoundStates.map((state) => state.roundNumber),
    ])].filter((round) => round > 0).sort((a, b) => a - b);

    playerRows.push(...players.map((player) => ({
      player_id: player.id,
      server_id: server.id,
      treatment_inequality: server.inequalityCondition,
      treatment_uncertainty: server.uncertaintyCondition,
      initial_parcel_quality: numberValue(player.parcel.quality),
      initial_wealth: config.startingWealth,
      final_wealth: numberValue(player.wealth),
      productive_capital_final: numberValue(player.productiveCapital),
      safe_asset_final: numberValue(player.safeAsset),
      exited: player.exited,
      round_exited: player.roundExited,
    })));

    parcelRows.push(...parcels.map((parcel) => ({
      parcel_id: parcel.id,
      server_id: parcel.serverId,
      x: parcel.x,
      y: parcel.y,
      soil: numberValue(parcel.soil),
      water: numberValue(parcel.water),
      market_access: numberValue(parcel.marketAccess),
      risk: numberValue(parcel.risk),
      quality: numberValue(parcel.quality),
      owner_player_id: parcel.ownerId,
    })));

    decisionRows.push(...decisions.map((decision) => ({
      decision_id: decision.id,
      server_id: decision.serverId,
      player_id: decision.playerId,
      round: decision.roundNumber,
      action_type: decision.actionType,
      amount: numberValue(decision.amount),
      target_player_id: decision.targetPlayerId,
      created_at: decision.createdAt,
    })));

    contractRows.push(...contracts.map((contract) => ({
      contract_id: contract.id,
      server_id: contract.serverId,
      round: contract.roundNumber,
      sender_id: contract.senderId,
      receiver_id: contract.receiverId,
      contract_type: contract.contractType,
      value: numberValue(contract.value),
      fee: numberValue(contract.fee),
      fulfilled: contract.fulfilled,
      defaulted: contract.defaulted,
    })));

    eventRows.push(...events.map((event) => ({
      event_id: event.id,
      server_id: event.serverId,
      round: event.roundNumber,
      event_type: event.eventType,
      event_value_json: event.value,
      created_at: event.createdAt,
    })));

    transactionRows.push(...treasuryTransactions.map((transaction) => ({
      transaction_id: transaction.id,
      server_id: transaction.serverId,
      player_id: transaction.playerId,
      round: transaction.roundNumber,
      type: transaction.type,
      amount: numberValue(transaction.amount),
      description: transaction.description,
    })));

    for (const round of rounds) {
      const roundDecisions = decisions.filter((decision) => decision.roundNumber === round);
      const roundContracts = contracts.filter((contract) => contract.roundNumber === round);
      const roundStates = playerRoundStates.filter((state) => state.roundNumber === round);
      const spending = roundDecisions
        .filter((decision) =>
          [ActionType.PRODUCTIVE_INVESTMENT, ActionType.PUBLIC_CONTRIBUTION, ActionType.SAFE_ASSET, ActionType.LOBBYING].includes(decision.actionType),
        )
        .reduce((total, decision) => total + numberValue(decision.amount), 0);
      const spendByType = (type: ActionType) =>
        roundDecisions.filter((decision) => decision.actionType === type).reduce((total, decision) => total + numberValue(decision.amount), 0);
      const contractDecisionCount = roundDecisions.filter(
        (decision) => decision.actionType === ActionType.INFORMAL_CONTRACT || decision.actionType === ActionType.FORMAL_CONTRACT,
      ).length;
      const treasury = treasuryTransactions
        .filter((transaction) => (transaction.roundNumber ?? 0) <= round)
        .reduce((total, transaction) => total + numberValue(transaction.amount), 0);

      roundOutcomeRows.push({
        server_id: server.id,
        round,
        informal_cooperation_rate: share(roundContracts.filter((contract) => contract.contractType === ContractType.INFORMAL).length, contractDecisionCount),
        contract_reliability: resolvedContractReliability(roundContracts),
        productive_investment_share: share(spendByType(ActionType.PRODUCTIVE_INVESTMENT), spending),
        public_contribution_share: share(spendByType(ActionType.PUBLIC_CONTRIBUTION), spending),
        exit_rate: share(roundStates.filter((state) => state.exited).length || players.filter((player) => player.exited && (player.roundExited ?? Infinity) <= round).length, players.length),
        safe_asset_share: share(spendByType(ActionType.SAFE_ASSET), spending),
        lobbying_share: share(spendByType(ActionType.LOBBYING), spending),
        treasury,
        active_players: roundStates.length > 0 ? roundStates.filter((state) => !state.exited).length : players.filter((player) => !player.exited || (player.roundExited ?? Infinity) > round).length,
        total_output: roundSummaryOutput(roundStates),
      });
    }

    const finalRound = rounds.length > 0 ? rounds[rounds.length - 1] : undefined;
    const finalOutcome = finalRound
      ? [...roundOutcomeRows].reverse().find((row: CsvRow) => row.server_id === server.id && row.round === finalRound)
      : undefined;
    serverSummaryRows.push({
      server_id: server.id,
      inequality_condition: server.inequalityCondition,
      uncertainty_condition: server.uncertaintyCondition,
      random_seed: server.randomSeed,
      initial_land_gini: gini(players.map((player) => numberValue(player.parcel.quality))),
      final_wealth_gini: gini(players.map((player) => numberValue(player.wealth) + numberValue(player.safeAsset))),
      final_exit_rate: share(players.filter((player) => player.exited).length, players.length),
      final_contract_reliability: finalOutcome?.contract_reliability ?? resolvedContractReliability(contracts),
      final_public_contribution_share: finalOutcome?.public_contribution_share ?? 0,
      final_productive_investment_share: finalOutcome?.productive_investment_share ?? 0,
    });
  }

  return zipFiles({
    "players.csv": tableToCsv(playerHeaders, playerRows),
    "parcels.csv": tableToCsv(parcelHeaders, parcelRows),
    "decisions.csv": tableToCsv(decisionHeaders, decisionRows),
    "contracts.csv": tableToCsv(contractHeaders, contractRows),
    "server_events.csv": tableToCsv(eventHeaders, eventRows),
    "treasury_transactions.csv": tableToCsv(transactionHeaders, transactionRows),
    "round_outcomes.csv": tableToCsv(roundOutcomeHeaders, roundOutcomeRows),
    "server_summary.csv": tableToCsv(serverSummaryHeaders, serverSummaryRows),
  });
};
