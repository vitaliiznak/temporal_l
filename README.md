# Temporal learning

One local Temporal server, a Next.js app that starts workflows, and a Python worker that runs them.

```
temporal_l/
  web/          Next.js app (the starter)
  python/       Worker + workflows + activities
  typescript/   Separate hello-world worker
```

Place an order in the app. That only starts `ProcessOrderWorkflow`. The Python worker then runs a saga:

1. Fraud check and inventory reservation **in parallel**
2. Charge payment
3. Wait for a shipment **signal** (or auto-approve after 20s)
4. Run `ShipOrderWorkflow` as a **child workflow** (label + dispatch)
5. Send a confirmation email

If fraud/payment fails or you cancel, it **compensates**: refund (if charged) and release inventory.

Each activity waits ~1.5s so you can watch progress in the app and in the Temporal UI.

## Run it

Three terminals, leave all three running.

**1. Temporal server**

```bash
temporal server start-dev
```

- Server: `localhost:7233`
- Web UI: http://localhost:8233

**2. Python worker**

```bash
cd python
uv run worker.py
```

**3. Next.js app**

```bash
cd web
npm run dev
```

Open http://localhost:3000, submit an order, and watch the steps update. On the status page you can **approve shipment** or **cancel**. Check the fraud/payment boxes to see compensation.

`starter.py` is the same idea as the Next.js API route, just from the command line.

## TypeScript hello-world

```bash
cd typescript
npm run start.watch
npm run workflow
```
