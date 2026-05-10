# Game Mechanics

Parcel Society is a research game. Mechanics should remain simple, auditable, and directly connected to the study design.

## Core objects

- **Server**: one experimental society and treatment assignment.
- **Season**: a repeated interaction session within a server.
- **Round**: one decision and resolution cycle.
- **Player**: an anonymous participant assignment inside a server.
- **Parcel**: one cell on the 10x10 map with a quality value.
- **Treasury**: server-level public balance affected by contributions and events.
- **Contract**: a formal or informal agreement tracked for reliability analysis.

## Default parameters

| Parameter         | Default                                          |
| ----------------- | ------------------------------------------------ |
| Map size          | 10x10 parcels                                    |
| Season length     | 7 rounds                                         |
| Action points     | 3 per active player per round                    |
| Treatment factors | Initial inequality and institutional uncertainty |

## Parcel map

The map represents spatial opportunity. Each parcel has coordinates and a quality score. Low-inequality servers assign more similar quality values, while high-inequality servers assign more unequal values. The map should be generated from stored configuration and seeds so releases are reproducible.

## Player actions

The initial action vocabulary is intentionally constrained:

- **Produce**: convert current opportunities into output.
- **Productive investment**: allocate resources toward future production.
- **Safe asset**: protect resources in a lower-risk option.
- **Public contribution**: contribute to the shared treasury or public good.
- **Informal contract**: cooperate without formal enforcement.
- **Formal contract**: cooperate with a stronger institutional backing.
- **Lobbying**: allocate resources toward rent-seeking or institutional advantage.
- **Exit**: leave the active society.

Do not expand this action list without a clear research-design reason.

## Round lifecycle

1. The server exposes the current round state.
2. Active players submit decisions subject to action-point and validation rules.
3. Administrators or automated session control resolve the round.
4. The engine applies production, investment, contracts, shocks, treasury updates, and scoring.
5. The app stores player-round state, decisions, contracts, events, and treasury transactions.
6. Participants see round summaries and continue until the season ends or they exit.

## Institutions

Stable institutions keep enforcement and shock rules predictable. Uncertain institutions introduce controlled uncertainty while remaining reproducible through explicit configuration and seeds.

## Design principles

- Prefer fewer actions over richer but less interpretable mechanics.
- Keep randomness seeded and inspectable.
- Log every analysis-relevant state transition.
- Preserve anonymous participant identifiers.
- Avoid real-money payout logic in the application core.
- Treat participant-facing text as part of the experimental instrument.
