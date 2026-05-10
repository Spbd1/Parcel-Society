# Research Design

Parcel Society is designed for controlled online behavioral experiments about cooperation, inequality, and institutional trust. The first public release supports a simple research design that can be audited, reproduced, and extended by researchers before a preregistered study.

## Research question

How do initial spatial inequality and institutional uncertainty affect cooperation, investment, public-good contribution, contract reliability, rent-seeking, and exit in a repeated small-society setting?

## Unit of assignment

The server is the unit of treatment assignment. Participants inside a server share the same parcel map, public treasury, round schedule, institutional condition, and social environment. Assigning treatments at the server level reduces contamination between participants who interact during the same session.

## Treatment structure

Parcel Society uses a 2x2 design:

| Condition                                | Initial parcel inequality          | Institutional environment                                        |
| ---------------------------------------- | ---------------------------------- | ---------------------------------------------------------------- |
| Low inequality + stable institutions     | Low dispersion in parcel quality.  | Rules and enforcement are predictable across rounds.             |
| Low inequality + uncertain institutions  | Low dispersion in parcel quality.  | Reliability or shocks vary according to controlled seeded rules. |
| High inequality + stable institutions    | High dispersion in parcel quality. | Rules and enforcement are predictable across rounds.             |
| High inequality + uncertain institutions | High dispersion in parcel quality. | Reliability or shocks vary according to controlled seeded rules. |

## Session structure

- Participants join an available server.
- Each participant is assigned an anonymous internal player identifier.
- A server runs a seven-round season by default.
- Each round gives every active participant three action points by default.
- Participants allocate decisions across production, investment, public contribution, contracts, lobbying, or exit.
- Rounds are resolved by deterministic engine logic and seeded randomness where the design requires uncertainty.
- Administrators export normalized CSV files after pilots or sessions.

## Primary outcomes

Primary outcomes should be summarized at the server or server-round level for confirmatory analysis:

1. Public-good contribution share.
2. Productive investment share.
3. Contract reliability.
4. Informal versus formal cooperation rate.
5. Lobbying or rent-seeking share.
6. Exit rate.
7. Final wealth and inequality measures.

## Secondary and diagnostic outcomes

Secondary outcomes can help explain mechanisms but should be marked exploratory unless included in a preregistration:

- Safe-asset allocation.
- Total production output.
- Treasury balance.
- Active-player count.
- Initial parcel-quality Gini.
- Final wealth Gini.
- Round completion and missingness indicators.
- Event and shock frequencies.

## Randomization and reproducibility

Server configuration should include seeds and explicit treatment labels. A reproduced server should produce the same map and same seeded institutional events when run with the same code and configuration. Randomization records should be retained with exported data and analysis scripts.

## Exclusions and missingness

Before real studies, researchers should define:

- Minimum participation requirements.
- How to handle participants who exit or disconnect.
- Whether incomplete rounds are excluded or carried forward.
- How unresolved contracts enter reliability denominators.
- Whether servers with low participant counts remain in confirmatory analysis.

## Analysis expectation

The repository includes a lightweight analysis helper for descriptive treatment contrasts. Confirmatory studies should use a preregistered model, account for clustering within servers, and report uncertainty clearly.

## Scope boundaries

Parcel Society intentionally avoids entertainment-game complexity. New mechanics should be added only when they answer a research question and can be explained to participants, logged cleanly, and exported for analysis.
