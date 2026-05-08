import { createRandom, type RandomGenerator } from "./random";
import type { ProductionConfig, Shock } from "./types";

export const generateShock = ({
  round,
  shockProbability,
  production,
  random,
}: {
  round: number;
  shockProbability: number;
  production: ProductionConfig;
  random: RandomGenerator;
}): Shock => {
  const occurred = random.boolean(shockProbability);
  return {
    round,
    occurred,
    multiplier: occurred
      ? random.float(
          production.minShockMultiplier,
          production.maxShockMultiplier,
        )
      : 1,
  };
};

export const generateShockSchedule = ({
  seed,
  rounds,
  shockProbability,
  production,
}: {
  seed: string | number;
  rounds: number;
  shockProbability: number;
  production: ProductionConfig;
}): Shock[] => {
  const random = createRandom(`${seed}:shocks:${rounds}:${shockProbability}`);
  return Array.from({ length: rounds }, (_, index) =>
    generateShock({
      round: index + 1,
      shockProbability,
      production,
      random,
    }),
  );
};
