import { z } from "zod";

export const inequalityConditionSchema = z.enum(["LOW", "HIGH"]);
export const uncertaintyConditionSchema = z.enum(["STABLE", "UNCERTAIN"]);
export const ruleChangeEventSchema = z.enum([
  "TAX_CHANGE",
  "FORMAL_CONTRACT_FEE_CHANGE",
  "SHOCK_PROBABILITY_CHANGE",
]);

const finiteNonnegative = z.number().finite().nonnegative();
const probability = z.number().finite().min(0).max(1);
const positiveInteger = z.number().int().positive();

export const serverConfigSchema = z
  .object({
    name: z.string().trim().min(1),
    description: z.string().trim().min(1),
    map: z
      .object({
        width: positiveInteger.max(100),
        height: positiveInteger.max(100),
      })
      .strict(),
    season: z
      .object({
        rounds: positiveInteger.max(52),
        actionPointsPerRound: positiveInteger.max(24),
      })
      .strict(),
    treatment: z
      .object({
        inequalityCondition: inequalityConditionSchema,
        uncertaintyCondition: uncertaintyConditionSchema,
      })
      .strict(),
    economy: z
      .object({
        initialWealth: finiteNonnegative,
        initialTreasury: finiteNonnegative,
        taxRate: probability,
        production: z
          .object({
            A: finiteNonnegative,
            betaQ: finiteNonnegative,
            betaK: finiteNonnegative,
          })
          .strict(),
        safeAssetReturn: z.number().finite().min(-1),
        productiveInvestmentDepreciation: probability,
      })
      .strict(),
    contracts: z
      .object({
        formalFeeRate: probability,
        informalFeeRate: probability,
        formalDefaultRisk: probability,
        informalDefaultRisk: probability,
      })
      .strict(),
    lobbying: z
      .object({
        privateReturnMultiplier: finiteNonnegative,
        socialEfficiencyCost: probability,
      })
      .strict(),
    uncertainty: z
      .object({
        ruleChangeRounds: z.array(positiveInteger).default([]),
        possibleEvents: z.array(ruleChangeEventSchema).default([]),
      })
      .strict(),
    shocks: z
      .object({
        baseProbability: probability,
        minMultiplier: z.number().finite().min(0),
        maxMultiplier: z.number().finite().min(0),
      })
      .strict()
      .refine((value) => value.minMultiplier <= value.maxMultiplier, {
        message: "minMultiplier must be less than or equal to maxMultiplier",
        path: ["minMultiplier"],
      }),
    randomSeed: z.string().trim().min(1),
  })
  .strict()
  .superRefine((value, ctx) => {
    for (const round of value.uncertainty.ruleChangeRounds) {
      if (round > value.season.rounds) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Rule change rounds must fall within the configured season length.",
          path: ["uncertainty", "ruleChangeRounds"],
        });
      }
    }
  });

export type ServerConfig = z.infer<typeof serverConfigSchema>;

export function parseServerConfig(value: unknown): ServerConfig {
  return serverConfigSchema.parse(value);
}

export function safeParseServerConfig(value: unknown) {
  return serverConfigSchema.safeParse(value);
}

export function loadServerConfigJson(json: string): ServerConfig {
  return parseServerConfig(JSON.parse(json));
}

export function serverConfigToEngineOverrides(config: ServerConfig) {
  return {
    sourceConfigVersion: 1,
    sourceConfig: config,
    mapWidth: config.map.width,
    mapHeight: config.map.height,
    actionPointsPerRound: config.season.actionPointsPerRound,
    productionA: config.economy.production.A,
    productionBetaQ: config.economy.production.betaQ,
    productionBetaK: config.economy.production.betaK,
    taxRate: config.economy.taxRate,
    formalContractFee: config.contracts.formalFeeRate,
    informalContractFee: config.contracts.informalFeeRate,
    formalDefaultRisk: config.contracts.formalDefaultRisk,
    informalDefaultRisk: config.contracts.informalDefaultRisk,
    shockProbability: config.shocks.baseProbability,
    startingWealth: config.economy.initialWealth,
    safeAssetReturn: config.economy.safeAssetReturn,
    productiveInvestmentDepreciation: config.economy.productiveInvestmentDepreciation,
    minShockMultiplier: config.shocks.minMultiplier,
    maxShockMultiplier: config.shocks.maxMultiplier,
    lobbyingPrivateReturnMultiplier: config.lobbying.privateReturnMultiplier,
    lobbyingSocialEfficiencyCost: config.lobbying.socialEfficiencyCost,
    uncertaintyRuleChangeRounds: config.uncertainty.ruleChangeRounds,
    uncertaintyPossibleEvents: config.uncertainty.possibleEvents,
  };
}
