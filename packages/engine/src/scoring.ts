import { contractReliability } from "./contracts";
import { gini } from "./gini";
import type { Contract, Decision, PlayerState, Scores } from "./types";

const share = (part: number, whole: number): number =>
  whole === 0 ? 0 : part / whole;

export const calculateScores = ({
  players,
  contracts,
  decisions,
}: {
  players: readonly PlayerState[];
  contracts: readonly Contract[];
  decisions: readonly Decision[];
}): Scores => {
  const spending = players.reduce(
    (total, player) =>
      total +
      player.spentOnProductiveInvestment +
      player.contributedPublic +
      player.spentOnSafeAssets +
      player.spentOnLobbying,
    0,
  );
  const informalContracts = contracts.filter(
    (contract) => contract.type === "INFORMAL",
  ).length;
  const contractDecisions = decisions.filter(
    (decision) =>
      decision.type === "INFORMAL_CONTRACT" ||
      decision.type === "FORMAL_CONTRACT",
  ).length;

  return {
    informalCooperationRate: share(informalContracts, contractDecisions),
    contractReliability: contractReliability(contracts),
    productiveInvestmentShare: share(
      players.reduce(
        (total, player) => total + player.spentOnProductiveInvestment,
        0,
      ),
      spending,
    ),
    publicContributionShare: share(
      players.reduce((total, player) => total + player.contributedPublic, 0),
      spending,
    ),
    exitRate: share(
      players.filter((player) => player.exited).length,
      players.length,
    ),
    safeAssetShare: share(
      players.reduce((total, player) => total + player.spentOnSafeAssets, 0),
      spending,
    ),
    lobbyingShare: share(
      players.reduce((total, player) => total + player.spentOnLobbying, 0),
      spending,
    ),
    finalWealthGini: gini(
      players.map((player) => player.wealth + player.safeAssets),
    ),
  };
};
