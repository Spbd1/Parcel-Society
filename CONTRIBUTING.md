# Contributing to Parcel Society

Thank you for helping improve Parcel Society. Contributions should keep the project simple, stable, and research-oriented.

## Set up locally

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

Open <http://localhost:3000> for the app and <http://localhost:3000/admin/login> for the admin area.

## Branch naming

Use short, descriptive branch names:

- `docs/readme-release-polish`
- `fix/export-empty-contracts`
- `test/round-resolver-edge-cases`
- `chore/update-dependencies`

Avoid vague names such as `changes`, `misc`, or `final`.

## Coding style

- Use TypeScript for application and package code.
- Keep mechanics deterministic where the research design requires reproducibility.
- Prefer small functions with explicit types at package boundaries.
- Do not add gameplay mechanics without a research-design justification.
- Keep participant-facing language clear and consistent.
- Never commit `.env`, database dumps, participant data, or private credentials.
- Run formatting before submitting broad Markdown or TypeScript edits.

## Tests and checks

Run these before opening a pull request:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

When changing database schema or seed behavior, also run:

```bash
pnpm db:generate
pnpm db:migrate
pnpm seed:demo
```

When changing Docker or deployment files, test the relevant Compose file:

```bash
docker compose up --build
docker compose -f docker-compose.prod.yml up --build
```

## Opening issues

Use the GitHub issue templates when possible:

- Bug reports should include reproduction steps, expected behavior, actual behavior, and logs or screenshots.
- Feature requests should explain the research or maintenance reason for the change.
- Research questions should state the construct, proposed measurement, and expected export fields.

Please do not file issues containing private participant data, credentials, or unpublished study data.

## Good first issues

Good first contributions usually have low design risk:

- Improve documentation clarity.
- Add tests for validation and engine edge cases.
- Improve accessibility labels and keyboard navigation.
- Add export consistency checks.
- Improve error messages without changing behavior.
- Add screenshots or diagrams to `docs/images/`.

For larger changes, open an issue first so maintainers can discuss scope and research implications.
