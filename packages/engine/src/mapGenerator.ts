import { gini } from "./gini";
import { createRandom } from "./random";
import type { InequalityCondition, Parcel } from "./types";

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const lowInequalityQuality = (base: number): number => 0.4 + base * 0.2;

const highInequalityQuality = (base: number, mixture: number): number => {
  if (mixture < 0.3) {
    return base * 0.18;
  }
  if (mixture > 0.78) {
    return 0.72 + base * 0.28;
  }
  return 0.25 + base * 0.45;
};

export const parcelQualityGini = (parcels: readonly Parcel[]): number =>
  gini(parcels.map((parcel) => parcel.quality));

export const generateMap = ({
  seed,
  inequality,
  width = 10,
  height = 10,
}: {
  seed: string | number;
  inequality: InequalityCondition;
  width?: number;
  height?: number;
}): Parcel[] => {
  const random = createRandom(`${seed}:map:${inequality}:${width}x${height}`);
  const parcels: Parcel[] = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const soil = random.next();
      const water = random.next();
      const marketAccess = random.next();
      const risk = random.next();
      const baseQuality = clamp01(
        soil * 0.35 + water * 0.3 + marketAccess * 0.25 + (1 - risk) * 0.1,
      );
      const quality =
        inequality === "LOW"
          ? lowInequalityQuality(baseQuality)
          : highInequalityQuality(baseQuality, random.next());

      parcels.push({
        id: `parcel-${x}-${y}`,
        x,
        y,
        soil,
        water,
        marketAccess,
        risk,
        quality,
      });
    }
  }

  return parcels;
};
