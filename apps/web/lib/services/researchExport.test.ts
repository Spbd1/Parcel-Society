import { describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  server: {
    findMany: vi.fn(),
  },
}));

vi.mock("@parcel-society/db", () => ({
  ActionType: {
    PRODUCE: "PRODUCE",
    PRODUCTIVE_INVESTMENT: "PRODUCTIVE_INVESTMENT",
    SAFE_ASSET: "SAFE_ASSET",
    PUBLIC_CONTRIBUTION: "PUBLIC_CONTRIBUTION",
    INFORMAL_CONTRACT: "INFORMAL_CONTRACT",
    FORMAL_CONTRACT: "FORMAL_CONTRACT",
    LOBBYING: "LOBBYING",
    EXIT: "EXIT",
  },
  ContractType: { FORMAL: "FORMAL", INFORMAL: "INFORMAL" },
  InequalityCondition: { LOW: "LOW", HIGH: "HIGH" },
  RoundStatus: { PENDING: "PENDING", ACTIVE: "ACTIVE", RESOLVED: "RESOLVED" },
  SeasonStatus: { PENDING: "PENDING", ACTIVE: "ACTIVE", COMPLETED: "COMPLETED", ARCHIVED: "ARCHIVED" },
  ServerEventType: {
    TAX_CHANGE: "TAX_CHANGE",
    FORMAL_CONTRACT_FEE_CHANGE: "FORMAL_CONTRACT_FEE_CHANGE",
    SHOCK_PROBABILITY_CHANGE: "SHOCK_PROBABILITY_CHANGE",
    RESOURCE_SHOCK: "RESOURCE_SHOCK",
    INFO: "INFO",
  },
  ServerStatus: { DRAFT: "DRAFT", WAITING: "WAITING", ACTIVE: "ACTIVE", COMPLETED: "COMPLETED", ARCHIVED: "ARCHIVED" },
  TreasuryTransactionType: {
    CONTRIBUTION: "CONTRIBUTION",
    TAX: "TAX",
    FEE: "FEE",
    FINE: "FINE",
    PUBLIC_SPENDING: "PUBLIC_SPENDING",
    PAYOUT: "PAYOUT",
    ADJUSTMENT: "ADJUSTMENT",
  },
  UncertaintyCondition: { STABLE: "STABLE", UNCERTAIN: "UNCERTAIN" },
  prisma: prismaMock,
}));

const { buildResearchExportZip } = await import("./researchExport");

const decimal = (value: number) => ({ toNumber: () => value });
const date = new Date("2026-05-10T12:00:00.000Z");

const readUint16 = (bytes: Uint8Array, offset: number) =>
  new DataView(bytes.buffer, bytes.byteOffset + offset, 2).getUint16(0, true);
const readUint32 = (bytes: Uint8Array, offset: number) =>
  new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0, true);

const unzipStoredFiles = (bytes: Uint8Array): Record<string, string> => {
  const decoder = new TextDecoder();
  const files: Record<string, string> = {};
  let offset = 0;

  while (readUint32(bytes, offset) === 0x04034b50) {
    const compressedSize = readUint32(bytes, offset + 18);
    const filenameLength = readUint16(bytes, offset + 26);
    const extraLength = readUint16(bytes, offset + 28);
    const filenameStart = offset + 30;
    const dataStart = filenameStart + filenameLength + extraLength;
    const filename = decoder.decode(bytes.slice(filenameStart, filenameStart + filenameLength));
    files[filename] = decoder.decode(bytes.slice(dataStart, dataStart + compressedSize));
    offset = dataStart + compressedSize;
  }

  expect(readUint32(bytes, offset)).toBe(0x02014b50);
  expect(readUint32(bytes, bytes.length - 22)).toBe(0x06054b50);
  return files;
};

const serverFixture = () => ({
  id: "server-1",
  inequalityCondition: "LOW",
  uncertaintyCondition: "STABLE",
  randomSeed: "seed-1",
  config: {
    mapWidth: 1,
    mapHeight: 1,
    adminEmail: "researcher@example.org",
    adminPassword: "super-secret",
    allowedIpAddress: "203.0.113.9",
    authToken: "token-123",
  },
  createdAt: date,
  updatedAt: date,
  treasury: decimal(7),
  players: [
    {
      id: "player-1",
      serverId: "server-1",
      parcel: { quality: decimal(0.7) },
      wealth: decimal(105),
      productiveCapital: decimal(2),
      safeAsset: decimal(4),
      exited: false,
      roundExited: null,
      createdAt: date,
    },
  ],
  parcels: [
    {
      id: "parcel-1",
      serverId: "server-1",
      x: 0,
      y: 0,
      soil: decimal(0.8),
      water: decimal(0.7),
      marketAccess: decimal(0.6),
      risk: decimal(0.1),
      quality: decimal(0.7),
      ownerId: "player-1",
    },
  ],
  decisions: [
    {
      id: "decision-1",
      serverId: "server-1",
      playerId: "player-1",
      roundNumber: 1,
      actionType: "PUBLIC_CONTRIBUTION",
      amount: decimal(5),
      targetPlayerId: null,
      createdAt: date,
    },
  ],
  contracts: [],
  events: [],
  treasuryTransactions: [
    {
      id: "transaction-1",
      serverId: "server-1",
      playerId: "player-1",
      roundNumber: 1,
      type: "CONTRIBUTION",
      amount: decimal(5),
      description: "Public contribution",
      createdAt: date,
    },
  ],
  playerRoundStates: [
    {
      roundNumber: 1,
      playerId: "player-1",
      serverId: "server-1",
      state: { roundSummary: { totalOutput: 0 } },
    },
  ],
  serverConfigs: [
    {
      key: "runtime",
      value: { formalFixedFee: 2, password: "hidden", nested: { ip: "198.51.100.4" } },
      createdAt: date,
      updatedAt: date,
    },
  ],
});

describe("research export zip", () => {
  it("builds a valid ZIP with expected CSV files", async () => {
    prismaMock.server.findMany.mockResolvedValue([serverFixture()]);

    const zip = await buildResearchExportZip({ type: "server", serverId: "server-1" });
    const files = unzipStoredFiles(zip);

    expect(Object.keys(files).sort()).toEqual([
      "contracts.csv",
      "decisions.csv",
      "parcels.csv",
      "players.csv",
      "round_outcomes.csv",
      "server_configs.csv",
      "server_events.csv",
      "server_summary.csv",
      "treasury_transactions.csv",
    ].sort());
    expect(files["players.csv"]).toContain("player_id,server_id");
    expect(files["decisions.csv"]).toContain("PUBLIC_CONTRIBUTION");
    expect(files["treasury_transactions.csv"]).toContain("CONTRIBUTION");
  });

  it("does not export emails, passwords, IP addresses, or auth credentials", async () => {
    prismaMock.server.findMany.mockResolvedValue([serverFixture()]);

    const zip = await buildResearchExportZip({ type: "server", serverId: "server-1" });
    const exportedText = Object.values(unzipStoredFiles(zip)).join("\n");

    expect(exportedText).not.toContain("researcher@example.org");
    expect(exportedText).not.toContain("super-secret");
    expect(exportedText).not.toContain("203.0.113.9");
    expect(exportedText).not.toContain("198.51.100.4");
    expect(exportedText).not.toContain("token-123");
  });
});
