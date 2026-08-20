"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { demoVariantByWorkflow } from "@/lib/demo-workflows";
import { STEP_LABELS } from "@/lib/steps";

type DemoState = {
  workflowId: string;
  workflowType?: string;
  variantId?: string | null;
  status: string;
  step: string | null;
  waitingForApproval: boolean;
  result: { summary?: string } | string | null;
  error: string | null;
};

export function DemoWorkflowStatus({ workflowId }: { workflowId: string }) {
  const [state, setState] = useState<DemoState | null>(null);
  const [signaling, setSignaling] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const response = await fetch(`/api/demo/orders/${workflowId}`, {
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

  async function approve() {
    setSignaling(true);
    await fetch(`/api/demo/orders/${workflowId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
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

  const variant = demoVariantByWorkflow(state.workflowType ?? "");
  const done =
    state.status === "COMPLETED" ||
    state.status === "FAILED" ||
    state.status === "TIMED_OUT";
  const current = state.step ?? variant?.steps[0] ?? "processing_payment";
  const steps = (variant?.steps ?? [
    "processing_payment",
    "reserving_inventory",
    "delivering",
    "completed",
  ]).filter(
    (step) =>
      step !== "awaiting_approval" ||
      state.waitingForApproval ||
      current === "awaiting_approval",
  );
  const summary =
    typeof state.result === "string"
      ? state.result
      : state.result?.summary ?? null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {state.status}
          {state.workflowType ? ` · ${state.workflowType}` : ""}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
          {variant ? `${variant.id}. ${variant.title}` : "Demo workflow"}
        </h1>
        {variant ? (
          <p className="mt-1 font-mono text-xs text-zinc-600 dark:text-zinc-400">
            typescript/{variant.file}
          </p>
        ) : null}
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
              {STEP_LABELS[step] ?? step}
            </li>
          );
        })}
      </ol>

      {state.waitingForApproval && state.status === "RUNNING" ? (
        <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-950/40">
          <p className="text-sm text-amber-950 dark:text-amber-100">
            Workflow is blocked on the{" "}
            <code className="font-mono text-xs">approveOrder</code> signal.
            {variant?.hasTimeout
              ? " If you wait 30 seconds it fails with Approval timed out."
              : " It will wait until you approve."}
          </p>
          <button
            type="button"
            disabled={signaling}
            onClick={approve}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
          >
            Send approveOrder
          </button>
        </div>
      ) : null}

      {summary ? (
        <div className="rounded-lg border border-zinc-300 bg-white p-4 text-sm dark:border-zinc-600 dark:bg-zinc-900">
          <p className="font-medium text-zinc-950 dark:text-white">{summary}</p>
        </div>
      ) : null}

      {state.error ? (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-200">
          {state.error}
        </p>
      ) : null}

      <Link
        href="/demo"
        className="inline-block text-sm text-zinc-700 underline dark:text-zinc-300"
      >
        Start another demo workflow
      </Link>
    </div>
  );
}
