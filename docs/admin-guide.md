# Admin Guide

This guide describes the intended administrator workflow for local pilots and research sessions.

## Local setup

```bash
cp .env.example .env
docker compose up -d postgres
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm seed:demo
pnpm dev
```

Open <http://localhost:3000/admin/login> and sign in with the local demo credentials unless you changed `.env`.

## Demo credentials

```text
Email: admin@example.com
Password: changeme
```

Use these only for local development. Change `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `APP_SECRET`, and `NEXTAUTH_SECRET` for shared environments.

## Admin workflow

1. Review or create server configuration.
2. Assign the inequality and uncertainty treatment.
3. Generate the parcel map from the configuration.
4. Start the season.
5. Monitor players, parcels, rounds, contracts, events, and analytics.
6. Resolve rounds after decisions are submitted.
7. Export data at the end of the session.
8. Archive servers that should no longer accept participant activity.

## Server configuration

Keep configuration files under version control when they are part of a pilot or release artifact. Record seeds, treatment labels, player limits, and round settings so the session can be reproduced.

## Participant support

Administrators should prepare study-specific consent, instructions, recruitment text, and debriefing outside the app. Avoid changing participant-facing wording during a live session unless the change is logged as a protocol deviation.

## Data exports

Use the admin export pages or API endpoints to download ZIP files. Store exports with the commit SHA, configuration files, analysis scripts, and any preregistration material.

## Operational checklist

Before a session:

- Confirm database connectivity through `/api/health`.
- Confirm the correct `.env` values are loaded.
- Confirm demo credentials are not used in shared environments.
- Run a short pilot with synthetic or test participants.
- Verify exports open in the analysis environment.

After a session:

- Export data promptly.
- Back up the database if the session must be preserved.
- Archive completed servers.
- Record any incidents, interruptions, or deviations.

## Security reminders

- Use strong administrator credentials.
- Do not expose PostgreSQL to the public internet.
- Use HTTPS for any non-local session.
- Do not collect direct identifiers unless a study protocol requires them outside Parcel Society.
