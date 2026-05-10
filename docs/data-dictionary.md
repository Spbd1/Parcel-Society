# Data Dictionary

Parcel Society research exports are available to administrators as ZIP files:

- `GET /api/admin/servers/:serverId/export.zip` exports one server.
- `GET /api/admin/export/all.zip` exports all servers in one normalized dataset.

The ZIP contains eight CSV files. Exports intentionally omit emails, IP addresses, participant names, admin names, authentication data, comprehension-check answers, and any other direct personal identifiers. Participant references use internal `player_id` values only.

## Missing values and types

- Empty CSV cells represent unavailable or inapplicable values.
- Boolean values are exported as `true` or `false`; unresolved nullable booleans are blank.
- Timestamps are ISO 8601 UTC strings.
- Monetary and share fields are numeric decimals. Share/rate fields range from `0` to `1` when denominators are non-zero.
- Enum values are exported in their database form, such as `LOW`, `HIGH`, `STABLE`, `UNCERTAIN`, `FORMAL`, and `INFORMAL`.

## `players.csv`

One row per player assignment on an exported server.

| Column                     | Type    | Description                                                              |
| -------------------------- | ------- | ------------------------------------------------------------------------ |
| `player_id`                | string  | Internal anonymous player identifier for this server.                    |
| `server_id`                | string  | Server/experimental session identifier.                                  |
| `treatment_inequality`     | enum    | Server inequality treatment: `LOW` or `HIGH`.                            |
| `treatment_uncertainty`    | enum    | Server uncertainty treatment: `STABLE` or `UNCERTAIN`.                   |
| `initial_parcel_quality`   | decimal | Quality score of the parcel initially assigned to the player.            |
| `initial_wealth`           | decimal | Starting wealth configured for the server.                               |
| `final_wealth`             | decimal | Player wealth at export time, or final wealth if the server is complete. |
| `productive_capital_final` | decimal | Player productive capital at export time.                                |
| `safe_asset_final`         | decimal | Player safe-asset balance at export time.                                |
| `exited`                   | boolean | Whether the player exited by export time.                                |
| `round_exited`             | integer | Round when the player exited, blank if the player has not exited.        |

## `parcels.csv`

One row per generated land parcel.

| Column            | Type    | Description                                                |
| ----------------- | ------- | ---------------------------------------------------------- |
| `parcel_id`       | string  | Internal parcel identifier.                                |
| `server_id`       | string  | Server that contains the parcel.                           |
| `x`               | integer | Parcel x-coordinate on the server map.                     |
| `y`               | integer | Parcel y-coordinate on the server map.                     |
| `soil`            | decimal | Soil component used in parcel quality generation.          |
| `water`           | decimal | Water component used in parcel quality generation.         |
| `market_access`   | decimal | Market-access component used in parcel quality generation. |
| `risk`            | decimal | Parcel risk component.                                     |
| `quality`         | decimal | Composite parcel quality score.                            |
| `owner_player_id` | string  | Current owning player identifier, blank if unowned.        |

## `decisions.csv`

One row per submitted player action.

| Column             | Type      | Description                                                                                                                                                       |
| ------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `decision_id`      | string    | Internal decision identifier.                                                                                                                                     |
| `server_id`        | string    | Server where the decision was submitted.                                                                                                                          |
| `player_id`        | string    | Player who submitted the decision.                                                                                                                                |
| `round`            | integer   | Round number for the decision.                                                                                                                                    |
| `action_type`      | enum      | Submitted action, such as `PRODUCE`, `PRODUCTIVE_INVESTMENT`, `SAFE_ASSET`, `PUBLIC_CONTRIBUTION`, `INFORMAL_CONTRACT`, `FORMAL_CONTRACT`, `LOBBYING`, or `EXIT`. |
| `amount`           | decimal   | Submitted amount for actions with an amount; zero when not applicable.                                                                                            |
| `target_player_id` | string    | Counterparty player for contract-like actions, blank when not applicable.                                                                                         |
| `created_at`       | timestamp | Submission timestamp.                                                                                                                                             |

## `contracts.csv`

One row per contract created during round resolution.

| Column          | Type    | Description                                              |
| --------------- | ------- | -------------------------------------------------------- |
| `contract_id`   | string  | Internal contract identifier.                            |
| `server_id`     | string  | Server where the contract was created.                   |
| `round`         | integer | Round in which the contract was resolved.                |
| `sender_id`     | string  | Player who offered or sent the contract.                 |
| `receiver_id`   | string  | Counterparty player.                                     |
| `contract_type` | enum    | `FORMAL` or `INFORMAL`.                                  |
| `value`         | decimal | Contract transfer value.                                 |
| `fee`           | decimal | Fee charged for the contract.                            |
| `fulfilled`     | boolean | Whether the contract was fulfilled; blank if unresolved. |
| `defaulted`     | boolean | Whether the contract defaulted; blank if unresolved.     |

## `server_events.csv`

One row per institutional, rule-change, informational, or shock event.

| Column             | Type        | Description                                                                                                                  |
| ------------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `event_id`         | string      | Internal event identifier.                                                                                                   |
| `server_id`        | string      | Server where the event occurred.                                                                                             |
| `round`            | integer     | Round associated with the event.                                                                                             |
| `event_type`       | enum        | Event category, such as `TAX_CHANGE`, `FORMAL_CONTRACT_FEE_CHANGE`, `SHOCK_PROBABILITY_CHANGE`, `RESOURCE_SHOCK`, or `INFO`. |
| `event_value_json` | JSON string | Event payload serialized as JSON.                                                                                            |
| `created_at`       | timestamp   | Event creation timestamp.                                                                                                    |

## `treasury_transactions.csv`

One row per public treasury movement.

| Column           | Type    | Description                                                                                                       |
| ---------------- | ------- | ----------------------------------------------------------------------------------------------------------------- |
| `transaction_id` | string  | Internal treasury transaction identifier.                                                                         |
| `server_id`      | string  | Server where the transaction occurred.                                                                            |
| `player_id`      | string  | Related player, blank for server-level transactions.                                                              |
| `round`          | integer | Related round, blank if not tied to a round.                                                                      |
| `type`           | enum    | Transaction category, such as `CONTRIBUTION`, `TAX`, `FEE`, `FINE`, `PUBLIC_SPENDING`, `PAYOUT`, or `ADJUSTMENT`. |
| `amount`         | decimal | Transaction amount. Positive values increase treasury; negative values decrease it.                               |
| `description`    | string  | Non-personal transaction note or reason code.                                                                     |

## `round_outcomes.csv`

One row per server round with aggregate outcome measures.

| Column                        | Type    | Description                                                                                                  |
| ----------------------------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| `server_id`                   | string  | Server identifier.                                                                                           |
| `round`                       | integer | Round number.                                                                                                |
| `informal_cooperation_rate`   | decimal | Informal contracts created divided by formal plus informal contract decisions in the round.                  |
| `contract_reliability`        | decimal | Fulfilled resolved contracts divided by all resolved contracts in the round.                                 |
| `productive_investment_share` | decimal | Productive-investment spending divided by total investment/public/lobbying/safe-asset spending in the round. |
| `public_contribution_share`   | decimal | Public-contribution spending divided by total investment/public/lobbying/safe-asset spending in the round.   |
| `exit_rate`                   | decimal | Share of players exited by the end of the round.                                                             |
| `safe_asset_share`            | decimal | Safe-asset spending divided by total investment/public/lobbying/safe-asset spending in the round.            |
| `lobbying_share`              | decimal | Lobbying spending divided by total investment/public/lobbying/safe-asset spending in the round.              |
| `treasury`                    | decimal | Cumulative treasury balance implied by exported treasury transactions through the round.                     |
| `active_players`              | integer | Number of players not exited by the end of the round.                                                        |
| `total_output`                | decimal | Total production output stored by the round resolver for the round.                                          |

## `server_summary.csv`

One row per exported server with final treatment and outcome measures.

| Column                              | Type    | Description                                                                                                               |
| ----------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| `server_id`                         | string  | Server identifier.                                                                                                        |
| `inequality_condition`              | enum    | Inequality treatment: `LOW` or `HIGH`.                                                                                    |
| `uncertainty_condition`             | enum    | Uncertainty treatment: `STABLE` or `UNCERTAIN`.                                                                           |
| `random_seed`                       | string  | Server random seed used for reproducible generation and resolution.                                                       |
| `initial_land_gini`                 | decimal | Gini coefficient of initially assigned parcel quality among players.                                                      |
| `final_wealth_gini`                 | decimal | Gini coefficient of final/export-time wealth plus safe assets among players.                                              |
| `final_exit_rate`                   | decimal | Share of players exited by export time.                                                                                   |
| `final_contract_reliability`        | decimal | Contract reliability from the final exported round, or all resolved contracts when no final round aggregate is available. |
| `final_public_contribution_share`   | decimal | Public-contribution spending share from the final exported round.                                                         |
| `final_productive_investment_share` | decimal | Productive-investment spending share from the final exported round.                                                       |
