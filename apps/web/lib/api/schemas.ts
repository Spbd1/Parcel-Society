import { z } from "zod";

export const serverIdParamsSchema = z.object({ serverId: z.string().min(1) }).strict();

export const joinServerSchema = z.object({
  serverId: z.string().min(1),
}).strict();

export const decisionActionSchema = z.object({
  type: z.enum([
    "PRODUCE",
    "PRODUCTIVE_INVESTMENT",
    "SAFE_ASSET",
    "PUBLIC_CONTRIBUTION",
    "INFORMAL_CONTRACT",
    "FORMAL_CONTRACT",
    "LOBBYING",
    "EXIT",
  ]),
  amount: z.number().finite().nonnegative().optional(),
  parcelId: z.string().min(1).optional(),
  counterpartyId: z.string().min(1).optional(),
  payload: z.record(z.unknown()).default({}),
}).strict();

export const submitDecisionsSchema = z.object({
  decisions: z.array(decisionActionSchema).min(1).max(3),
}).strict();

export const comprehensionCheckSchema = z.object({
  answers: z.array(z.enum(["a", "b", "c"])).length(5),
}).strict();

export const createServerSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  inequalityCondition: z.enum(["LOW", "HIGH"]),
  uncertaintyCondition: z.enum(["STABLE", "UNCERTAIN"]),
  maxPlayers: z.number().int().positive().max(500).default(20),
  seasonLength: z.number().int().positive().max(52).default(7),
  randomSeed: z.string().min(1).optional(),
  config: z.record(z.unknown()).default({}),
}).strict();

export const updateServerSchema = createServerSchema.partial().extend({
  status: z.enum(["DRAFT", "WAITING", "ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
  treasury: z.number().finite().nonnegative().optional(),
  currentRound: z.number().int().nonnegative().optional(),
}).strict();

export const generateMapSchema = z.object({
  width: z.number().int().positive().max(100).default(10),
  height: z.number().int().positive().max(100).default(10),
}).strict();
