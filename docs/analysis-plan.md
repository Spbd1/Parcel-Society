# Parcel Society analysis plan

## Primary outcomes

The primary outcomes are calculated at the server-round level and can be summarized at the final round or averaged across rounds for robustness checks.

1. **Informal cooperation rate**: informal contracts started divided by all contracts started.
2. **Contract reliability**: fulfilled contracts divided by resolved contracts, where a contract is resolved when it has an observed fulfilled or defaulted status.
3. **Productive investment share**: resources allocated to productive investment divided by all allocated resources.
4. **Public contribution share**: resources allocated to public contribution divided by all allocated resources.
5. **Exit rate**: exited players divided by total players.

## Secondary outcomes

Secondary outcomes are diagnostic and mechanism-oriented measures:

- **Safe asset share**: safe asset allocation divided by total allocated resources.
- **Lobbying share**: lobbying allocation divided by total allocated resources.
- **Total output**: total production output recorded for a round.
- **Treasury balance**: cumulative server treasury balance through the round.
- **Active players**: non-exited players in the round.
- **Final wealth Gini**: inequality in player wealth plus safe assets for the round or final state.
- **Initial parcel quality Gini**: inequality in assigned parcel quality at baseline.
- **Formal contract share**: formal contracts started divided by all contracts started.
- **Average wealth**: mean player wealth plus safe assets.
- **Median wealth**: median player wealth plus safe assets.

## Treatment design

Parcel Society uses a 2×2 treatment structure:

| Factor                    | Low / stable condition             | High / uncertain condition               |
| ------------------------- | ---------------------------------- | ---------------------------------------- |
| Initial inequality        | Low parcel-quality inequality      | High parcel-quality inequality           |
| Institutional uncertainty | Stable rules and shock environment | Uncertain rules and/or shock environment |

The main contrasts are the high-inequality effect, the uncertainty effect, and their interaction.

## Basic regression model

For each outcome, estimate a simple server-level model:

```text
outcome_s = β0 + β1 HighInequality_s + β2 Uncertainty_s + β3 HighInequality_s × Uncertainty_s + ε_s
```

For final-round round outcomes, use one row per server from the last observed round. For server-summary outcomes, use one row per server from `server_summary.csv`. The helper script at `packages/analysis/scripts/estimate_effects.py` implements this simple OLS specification and writes a Markdown report.

## Clustering warning at server level

Player decisions and round observations are nested within servers. Standard errors should therefore be clustered at the server level for confirmatory inference whenever using player-round, decision-level, contract-level, or repeated round-level data. The current helper script intentionally does **not** implement clustered standard errors; it is only for quick descriptive treatment-effect estimates.

## Limitations

- The simple regression is not a substitute for the preregistered confirmatory model.
- Small pilot samples may make treatment estimates noisy and interaction estimates especially unstable.
- Missing or unresolved contracts reduce the denominator for contract reliability.
- Resource-share outcomes depend on recorded allocation amounts and exclude non-allocation actions.
- Final-round summaries may miss dynamic patterns that appear earlier in a session.
- Multiple secondary outcomes should be treated as exploratory unless adjusted for multiple comparisons.
