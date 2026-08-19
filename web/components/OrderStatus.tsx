"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCents } from "@/lib/catalog";
import { HAPPY_PATH_STEPS, STEP_LABELS } from "@/lib/steps";

type OrderResult = {
  outcome?: string;
  reason?: string;
  customer_name: string;
  item: string;
  quantity: number;
  total_cents: number;
  summary: string;
  emailed?: string;
  tracking?: string;
};

type OrderState = {
  workflowId: string;
  status: string;
  step: string | null;
  waitingForApproval: boolean;
  outcome: string | null;
  tracking: string | null;
  result: OrderResult | null;
  error: string | null;
};

export function OrderStatus({ workflowId }: { workflowId: string }) {
  const [state, setState] = useState<OrderState | null>(null);
  const [signaling, setSignaling] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const response = await fetch(`/api/orders/${workflowId}`, {
        cache: "no-store",
      });
      if (!response.ok || cancelled) {
        return;
      }
      setState(await response.json());
    }

    load();
    const timer = setInterval(load, 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [workflowId]);

  async function signal(action: "approve" | "cancel") {
    setSignaling(true);
    await fetch(`/api/orders/${workflowId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setSignaling(false);
  }

  if (!state) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Loading workflow…
      </p>
    );
  }

  const cancelled = state.step === "cancelled" || state.step === "compensating";
  const done =
    state.status === "COMPLETED" ||
    state.status === "FAILED" ||
    state.step === "cancelled";
  const current = state.step ?? "received";
  const steps = cancelled
    ? ([
        "received",
        "screening",
        "charging_payment",
        "compensating",
        "cancelled",
      ] as const)
    : HAPPY_PATH_STEPS;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {state.status}
          {state.outcome ? ` · ${state.outcome}` : ""}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
          Order status
        </h1>
        <p className="mt-1 font-mono text-xs text-zinc-600 dark:text-zinc-400">
          {workflowId}
        </p>
      </div>

      <ol className="space-y-2">
        {steps.map((step) => {
          const reached =
            steps.indexOf(step) <=
            steps.indexOf(current as (typeof steps)[number]);
          const active = step === current && !done;
          return (
            <li
              key={step}
              className={`rounded-lg border px-3 py-2 text-sm ${
                active
                  ? "border-zinc-900 bg-zinc-100 font-medium text-zinc-950 dark:border-sky-400 dark:bg-zinc-800 dark:text-white"
                  : reached
                    ? "border-zinc-300 bg-white text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                    : "border-zinc-200 text-zinc-400 dark:border-zinc-800 dark:text-zinc-500"
              }`}
            >
              {STEP_LABELS[step]}
            </li>
          );
        })}
      </ol>

      {state.waitingForApproval ? (
        <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-950/40">
          <p className="text-sm text-amber-950 dark:text-amber-100">
            Workflow is blocked on a <strong>signal</strong>. Approve shipment,
            or wait 20s and it auto-approves. Cancel runs the saga
            compensation.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={signaling}
              onClick={() => signal("approve")}
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
            >
              Approve shipment
            </button>
            <button
              type="button"
              disabled={signaling}
              onClick={() => signal("cancel")}
              className="rounded-lg border border-zinc-400 bg-white px-3 py-2 text-sm text-zinc-900 disabled:opacity-50 dark:border-zinc-500 dark:bg-transparent dark:text-zinc-100"
            >
              Cancel order
            </button>
          </div>
        </div>
      ) : null}

      {state.result ? (
        <div className="rounded-lg border border-zinc-300 bg-white p-4 text-sm dark:border-zinc-600 dark:bg-zinc-900">
          <p className="font-medium text-zinc-950 dark:text-white">
            {state.result.summary}
          </p>
          {state.result.emailed ? (
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              {state.result.emailed}
              {state.result.total_cents
                ? ` · ${formatCents(state.result.total_cents)}`
                : ""}
            </p>
          ) : null}
        </div>
      ) : null}

      {state.error ? (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-200">
          {state.error}
        </p>
      ) : null}

      <Link
        href="/"
        className="inline-block text-sm text-zinc-700 underline dark:text-zinc-300"
      >
        Place another order
      </Link>
    </div>
  );
}
