# Ethics

Parcel Society is research software and should be used with an approved study protocol when human participants are involved. This document is not legal or institutional review advice; it is a practical checklist for keeping the project privacy-preserving and participant-respecting.

## Principles

- Collect the minimum data needed for the research question.
- Use anonymous participant identifiers in the application and exports.
- Keep consent, recruitment, compensation, and debriefing materials study-specific and reviewable.
- Avoid deceptive mechanics unless explicitly approved by the relevant review process.
- Prefer transparent, simple rules that participants can understand.
- Do not add chat, social feeds, or direct identifiers without a strong protocol reason.

## Data minimization

The application should avoid storing names, raw IP addresses, unnecessary contact details, or free-text participant content. Research exports should contain internal player identifiers and analysis variables only.

## Consent and debriefing

Researchers using Parcel Society should provide participant-facing materials that explain:

- The study purpose at the level approved by the protocol.
- Expected time commitment.
- Risks and benefits.
- Data collected by the application.
- Whether participation is anonymous or confidential.
- Withdrawal and contact procedures.
- Debriefing information after completion when appropriate.

## Compensation

The application does not implement real-money payout logic. If compensation or bonuses are used, calculate and administer them through a reviewed external process and avoid storing unnecessary payment identifiers in Parcel Society.

## Risk management

Potential risks include misunderstanding the game, frustration from unequal initial conditions, privacy leakage from small groups, and accidental disclosure through exports. Mitigations include clear instructions, comprehension checks, minimal data collection, secure deployment, and careful aggregation in publications.

## Publication and sharing

When sharing data, remove direct identifiers, review small-cell disclosure risk, include codebooks, and document all exclusions or transformations. Public releases should favor synthetic demo data unless the study protocol and consent allow broader data sharing.
