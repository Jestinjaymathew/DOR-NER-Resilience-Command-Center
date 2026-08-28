# DOR NER Resilience Command Center

Operational command center for simulating, predicting, and responding to logistics disruptions across India's North Eastern Region.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/dor-ner/src/App.tsx` — responsive command center shell, routes, simulation UI, and operational views
- `artifacts/dor-ner/src/index.css` — DOR NER visual system and responsive styles
- `artifacts/api-server/src/lib/dor-data.ts` — deterministic simulated NER operational state and resilience calculations
- `artifacts/api-server/src/routes/dor.ts` — validated dashboard, operations, simulation, and mission endpoints
- `lib/api-spec/openapi.yaml` — source of truth for the generated API client and Zod contracts

## Architecture decisions

- The first prototype uses a deterministic in-memory simulation provider so the end-to-end decision chain remains demonstrable without external data feeds.
- OpenAPI is the single API contract; generated React Query hooks are used by the frontend for all operational reads and mutations.
- Simulation state is shared across dashboard, map, fleet, supply, route, incident, alert, and mission surfaces so actions visibly feed back into the command center.
- Every synthetic operational value is surfaced in a DEMO / SIMULATION DATA context.

## Product

DOR NER provides a regional command center, map-based risk intelligence, route comparison, fleet tracking, supply risk monitoring, incident command, actionable alerts, emergency mission creation, field mode, analytics, multilingual-ready settings, and a one-click Manipur rainfall disruption demonstration.

## User preferences

No additional project-specific preferences recorded.

## Gotchas

- The web artifact's Vite config requires `PORT` and `BASE_PATH`; managed workflows provide them. Direct builds need `PORT=5173 BASE_PATH=/ pnpm --filter @workspace/dor-ner run build`.
- After changing `lib/api-spec/openapi.yaml`, regenerate the client with `pnpm --filter @workspace/api-spec run codegen`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
