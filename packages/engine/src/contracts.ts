import type { Contract } from "./types";
import type { RandomGenerator } from "./random";

export const createContract = ({
  id,
  round,
  type,
  fromPlayerId,
  toPlayerId,
  amount,
  fee,
  defaultRisk,
}: Omit<Contract, "fulfilled">): Contract => ({
  id,
  round,
  type,
  fromPlayerId,
  toPlayerId,
  amount,
  fee,
  defaultRisk,
});

export const resolveContracts = ({
  contracts,
  random,
}: {
  contracts: readonly Contract[];
  random: RandomGenerator;
}): Contract[] =>
  contracts.map((contract) => ({
    ...contract,
    fulfilled: !random.boolean(contract.defaultRisk),
  }));

export const contractReliability = (contracts: readonly Contract[]): number => {
  if (contracts.length === 0) {
    return 1;
  }
  return (
    contracts.filter((contract) => contract.fulfilled).length / contracts.length
  );
};
