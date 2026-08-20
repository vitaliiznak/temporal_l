# Temporal learning

One local Temporal server, a Next.js app that starts workflows, and workers in Python or TypeScript.

The TypeScript package is a copy of [temporal-order-fulfill-demo](https://github.com/temporal-sa/temporal-order-fulfill-demo): `OrderFulfillWorkflow` in `typescript/src/workflows.ts` is payment → inventory → delivery. Scenario variants live in `typescript/demo/` and are meant to be copied into `workflows.ts`, same as that repo.

```
temporal_l/
  web/          Next.js app (the starter)
  python/       Worker + ProcessOrderWorkflow saga
  typescript/   temporal-order-fulfill-demo
```

## Run it

**1. Temporal server**

```bash
temporal server start-dev
```

- Server: `localhost:7233`
- Web UI: http://localhost:8233

**2. Python worker** (optional)

```bash
cd python
uv run worker.py
```

**3. TypeScript worker**

```bash
cd typescript
npm install
npm run start.watch
```

**4. Next.js app**

```bash
cd web
npm run dev
```

Open http://localhost:3000 and pick a worker.

### TypeScript (order-fulfill demo)

Task queue: `sample-order-fulfill`.

1. Happy path — `src/workflows.ts` / `demo/workflows1.ts`
2. API downtime — uncomment inventory retry in `src/activities.ts`
3. Expired card — set expiry to `12/23` in `src/starter.ts`, or use the app checkbox
4. Human in the loop — copy `demo/workflows2.ts` over `src/workflows.ts`, send `approveOrder`
5. Approve or expire — copy `demo/workflows3.ts` over `src/workflows.ts`
6. Invalid items — `npm run workflow -- --numOrders 50 --invalidPercentage 20`, then uncomment the `@@@` fix in `src/api.ts`

```bash
cd typescript
npm run workflow
```

### Python saga

Fraud + inventory in parallel, payment, 20s shipment-approval signal, `ShipOrderWorkflow` child, compensation on failure.
