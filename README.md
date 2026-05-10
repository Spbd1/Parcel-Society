# Parcel Society

Parcel Society is an open-source research platform for reproducible online behavioral experiments. It lets researchers run small virtual societies where participants make repeated decisions about production, investment, public goods, contracts, lobbying, and exit under controlled institutional and inequality conditions.

The project is intentionally simple: it is research software, not an entertainment game, crypto project, social network, or full-featured survey platform.

## Research motivation

Many studies in behavioral economics, political economy, sociology, and institutional trust need environments where participants interact under transparent rules and where treatment assignment, decisions, and outcomes can be audited after the session. Parcel Society provides a lightweight TypeScript foundation for those studies.

The initial research design asks:

> How do initial spatial inequality and institutional uncertainty affect cooperation, investment, public-good contribution, contract reliability, rent-seeking, and exit?

The core treatment design is a 2x2 experiment:

| Inequality | Institutions | Description                                                                    |
| ---------- | ------------ | ------------------------------------------------------------------------------ |
| Low        | Stable       | Similar initial parcel opportunities and predictable institutions.             |
| Low        | Uncertain    | Similar initial parcel opportunities and controlled institutional uncertainty. |
| High       | Stable       | Unequal initial parcel opportunities and predictable institutions.             |
| High       | Uncertain    | Unequal initial parcel opportunities and controlled institutional uncertainty. |

Servers are the unit of treatment assignment because participants share a map, treasury, rounds, and institutional environment.

## Screenshots

Screenshots are not committed yet. Add release screenshots to `docs/images/` as the public demo stabilizes.

Suggested placeholders:

- `docs/images/home.png` — public landing page.
- `docs/images/admin-dashboard.png` — admin overview.
- `docs/images/server-map.png` — 10x10 parcel map.
- `docs/images/export-flow.png` — research export workflow.

## Quick start

Requirements:

- Node.js 22 or newer
- pnpm 10.28.1 or compatible via Corepack
- PostgreSQL 16, either local or through Docker Compose

```bash
corepack enable
pnpm install
cp .env.example .env
docker compose up -d postgres
pnpm db:generate
pnpm db:migrate
pnpm seed:demo
pnpm dev
```

Open <http://localhost:3000> for the participant landing page. Open <http://localhost:3000/admin> for the admin dashboard; the browser will prompt for HTTP Basic Auth using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`.

## Docker start

For local Docker development, the default Compose path now builds the app, waits for PostgreSQL, runs Prisma migrations, seeds demo data, and starts the web container:

```bash
cp .env.example .env
docker compose up --build
```

If you only start PostgreSQL through Docker and run the app on your host, use the explicit local test path:

```bash
docker compose up -d postgres
pnpm db:migrate
pnpm seed:demo
pnpm dev
```

For the production-oriented Compose file:

```bash
cp .env.example .env
# Edit .env before any shared deployment.
docker compose -f docker-compose.prod.yml up --build
```

In another terminal, apply migrations if needed:

```bash
docker compose -f docker-compose.prod.yml --profile tools run --rm migrate
```

## Demo credentials

The demo seed uses these local-only credentials by default:

```text
Email: admin@example.com
Password: changeme
```

Do not use demo credentials in shared, hosted, classroom, pilot, or production environments. Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `APP_SECRET`, `NEXTAUTH_SECRET`, and database credentials in `.env` before deployment.

## Architecture

Parcel Society is a pnpm workspace with a small set of focused packages:

```text
apps/web/              Next.js App Router application and API routes
packages/db/           Prisma schema, database client, and seed scripts
packages/engine/       Deterministic game logic, validation, scoring, and simulations
packages/shared/       Shared constants, types, and server configuration helpers
packages/analysis/     Lightweight export-analysis helper scripts
docs/                  Research, operations, ethics, and deployment documentation
configs/               Example server and pilot configuration files
deploy/                Deployment support files such as Nginx examples
```

Runtime flow:

1. Researchers configure and create treatment servers.
2. Participants join a server, complete checks, and play seven rounds.
3. The engine resolves submitted decisions with seeded randomness.
4. Admin pages summarize maps, players, rounds, contracts, events, and analytics.
5. Research-safe ZIP/CSV exports support reproducible analysis outside the app.

## Research design

The current study design uses seven-round seasons, three action points per participant per round, 10x10 parcel maps, and fixed formal/informal contract fees. Initial parcel quality operationalizes inequality, while stable versus uncertain institutional conditions affect the reliability and predictability of rules or shocks.

Confirmatory analysis should be preregistered before real data collection. The included analysis helper is descriptive and intended for pilots, diagnostics, and transparent release artifacts. See:

- [`docs/research-design.md`](docs/research-design.md)
- [`docs/game-mechanics.md`](docs/game-mechanics.md)
- [`docs/analysis-plan.md`](docs/analysis-plan.md)
- [`docs/ethics.md`](docs/ethics.md)

## Data exports

Administrators can export research-safe ZIP files. Admin endpoints are protected by Basic Auth and exports omit emails, passwords, IP addresses, tokens, and authentication credentials:

- `GET /api/admin/servers/:serverId/export.zip` for one server.
- `GET /api/admin/export/all.zip` for all servers.

Exports are normalized CSV files and intentionally omit emails, names, IP addresses, authentication data, and direct personal identifiers. See [`docs/data-dictionary.md`](docs/data-dictionary.md) for tables, columns, and derived measures.

## Development commands

```bash
pnpm install       # install workspace dependencies
pnpm dev           # run the web app locally
pnpm typecheck     # type-check all packages
pnpm lint          # lint all packages
pnpm test          # run Vitest tests
pnpm build         # build all packages
pnpm format        # format Markdown, TypeScript, and config files
pnpm db:generate   # generate Prisma client
pnpm db:migrate    # run local Prisma migrations
pnpm seed          # seed admin and treatment servers
pnpm seed:demo     # seed deterministic demo data
```

## Roadmap

- Stabilize public demo screenshots and release assets.
- Expand pilot documentation with exact recruitment and session procedures.
- Add more export validation and reproducibility checks.
- Add preregistration templates for confirmatory studies.
- Improve admin ergonomics without expanding the research design unnecessarily.
- Keep mechanics simple, auditable, deterministic where appropriate, and easy to explain to participants.

## Contributing

Contributions are welcome when they keep the project stable, research-oriented, and easy to audit. Start with [`CONTRIBUTING.md`](CONTRIBUTING.md), open an issue for substantial changes, and avoid adding mechanics or features without a clear study-design reason.

Good first contributions include documentation improvements, test coverage, validation edge cases, export checks, and small UI accessibility fixes.

## License

Parcel Society is released under the MIT License. See [`LICENSE`](LICENSE).
