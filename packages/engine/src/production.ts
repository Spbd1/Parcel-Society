import type { Parcel, ProductionConfig } from "./types";

export const DEFAULT_PRODUCTION_CONFIG: ProductionConfig = {
  A: 10,
  betaQ: 0.8,
  betaK: 0.5,
  minShockMultiplier: 0.5,
  maxShockMultiplier: 1,
};

export const calculateOutput = ({
  parcel,
  productiveCapital,
  shockMultiplier,
  config = DEFAULT_PRODUCTION_CONFIG,
}: {
  parcel: Pick<Parcel, "quality">;
  productiveCapital: number;
  shockMultiplier: number;
  config?: ProductionConfig;
}): number =>
  config.A *
  (1 + parcel.quality) ** config.betaQ *
  (1 + productiveCapital) ** config.betaK *
  shockMultiplier;
