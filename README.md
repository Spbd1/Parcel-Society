# Parcel Society

Parcel Society is an open-source research software platform for reproducible online behavioral experiments. It is designed for studies in behavioral economics, political economy, social capital, and institutional trust.

The first scientific version asks: **How do initial spatial inequality and institutional uncertainty affect cooperation, investment, public-good contribution, contract reliability, rent-seeking, and exit?**

## What Parcel Society Is

- A minimal online behavioral-game platform for research
- A reproducible environment where participants join small virtual societies called servers
- A TypeScript monorepo foundation for a 10x10 parcel map, 7-round seasons, and 3 action points per player per round
- A project that prioritizes deterministic seeded randomness, clean data exports, Docker deployment, and research data quality

## What Parcel Society Is Not

Parcel Society is not a normal entertainment game and is not a crypto, NFT, or metaverse project. The MVP intentionally excludes crypto, real-money payout logic, chat, elections, political parties, AI agents, complex macro simulation, live multiplayer graphics, inter-server trade, social-network features, and public leaderboards.

## Scientific Motivation

Researchers often need lightweight experimental environments where treatment assignment, participant decisions, and outcomes can be reproduced and audited. Parcel Society focuses on a simple 2x2 design:

1. Low inequality + stable institutions
2. Low inequality + uncertain institutions
3. High inequality + stable institutions
4. High inequality + uncertain institutions

The server is the core unit of randomization because participants share a parcel map, institutional context, and public-good environment.

## MVP Scope

The foundation release provides the monorepo, tooling, documentation skeleton, placeholder web pages, a minimal Prisma setup, shared constants, and engine type placeholders. It does not implement authentication, gameplay, admin workflows, CSV export, or detailed database models yet.

## Tech Stack

- TypeScript
- pnpm workspaces
- Next.js App Router
- React
- Tailwind CSS
- Prisma
- PostgreSQL
- Docker Compose
- Vitest
- ESLint
- Prettier

## Repository Structure

```text
parcel-society/
  apps/
    web/          Next.js TypeScript app
  packages/
    db/           Prisma schema and database client package
    engine/       TypeScript game engine package
    shared/       Shared types, constants, and utilities
  docs/           Research, mechanics, deployment, admin, and ethics notes
```

## Quick Start

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev
```

Open <http://localhost:3000> to view the placeholder web app.

## Docker Start

```bash
docker compose up --build
```

Docker Compose starts PostgreSQL and the Next.js web app.

## Environment Variables

Copy `.env.example` to `.env` and update values as needed.

```bash
DATABASE_URL="postgresql://parcel:parcel_password@localhost:5432/parcel_society?schema=public"
APP_SECRET="replace-with-a-long-random-secret"
ADMIN_EMAIL="admin@example.org"
ADMIN_PASSWORD="replace-with-a-development-password"
NODE_ENV="development"
```

## Development Commands

- `pnpm dev` - run the web app locally
- `pnpm build` - build all workspace packages
- `pnpm lint` - lint all workspace packages
- `pnpm format` - format the repository with Prettier
- `pnpm typecheck` - type-check all workspace packages
- `pnpm test` - run Vitest across workspaces
- `pnpm db:generate` - generate the Prisma client
- `pnpm db:migrate` - run local Prisma migrations
- `pnpm db:studio` - open Prisma Studio
- `pnpm seed` - run the placeholder seed script

## Roadmap

1. Add deterministic server configuration schemas.
2. Implement seeded map generation for low- and high-inequality treatments.
3. Add minimal participant decision storage.
4. Build admin server creation and season controls.
5. Implement round resolution in the engine.
6. Add research-safe CSV exports.
7. Harden deployment, authentication, and audit logging.

## Contributing

Contributions should preserve the scientific MVP scope. Avoid adding entertainment, social, crypto, or complex simulation features unless they are explicitly justified by the research design.

## License

MIT. See [LICENSE](./LICENSE).
