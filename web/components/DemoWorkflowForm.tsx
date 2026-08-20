"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  APPROVAL_LINE_PRICE,
  DEMO_VARIANTS,
  type DemoWorkflowVariant,
} from "@/lib/demo-workflows";
import { FULFILL_CATALOG, formatDollars } from "@/lib/fulfill-catalog";

const fieldLabel = "text-sm font-medium text-zinc-800 dark:text-zinc-200";
const fieldInput =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 placeholder:text-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:ring-zinc-500";

export function DemoWorkflowForm() {
  const router = useRouter();
  const [variant, setVariant] = useState<DemoWorkflowVariant>("1");
  const [item, setItem] = useState(FULFILL_CATALOG[0].itemName);
  const [quantity, setQuantity] = useState(1);
  const [failPayment, setFailPayment] = useState(false);
  const [invalidItem, setInvalidItem] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const selected = DEMO_VARIANTS.find((entry) => entry.id === variant)!;
  const product =
    FULFILL_CATALOG.find((entry) => entry.itemName === item) ??
    FULFILL_CATALOG[0];
  const unitPrice = requireApproval ? APPROVAL_LINE_PRICE : product.itemPrice;
  const total = formatDollars(unitPrice * quantity);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const response = await fetch("/api/demo/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        variant,
        item,
        quantity,
        failPayment,
        invalidItem,
        requireApproval,
      }),
    });

    if (!response.ok) {
      setError(
        "Could not start the demo workflow. Is Temporal and the TypeScript worker running?",
      );
      setPending(false);
      return;
    }

    const { workflowId } = await response.json();
    router.push(`/demo/${workflowId}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <fieldset className="space-y-2">
        <legend className={fieldLabel}>Demo variant</legend>
        <div className="grid gap-2">
          {DEMO_VARIANTS.map((option) => {
            const active = variant === option.id;
            return (
              <label
                key={option.id}
                className={`cursor-pointer rounded-lg border px-3 py-3 ${
                  active
                    ? "border-zinc-900 bg-zinc-100 dark:border-sky-400 dark:bg-zinc-800"
                    : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-950"
                }`}
              >
                <span className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="variant"
                    value={option.id}
                    checked={active}
                    onChange={() => {
                      setVariant(option.id);
                      setRequireApproval(option.hasApproval);
                    }}
                    className="mt-1"
                  />
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-sm font-medium text-zinc-950 dark:text-white">
                        {option.id}. {option.title}
                      </span>
                      <code className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        {option.file}
                      </code>
                    </span>
                    <span className="mt-1 block text-sm text-zinc-600 dark:text-zinc-400">
                      {option.description}
                    </span>
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className="block space-y-1">
        <span className={fieldLabel}>Product</span>
        <select
          value={item}
          onChange={(event) => setItem(event.target.value)}
          className={fieldInput}
        >
          {FULFILL_CATALOG.map((productOption) => (
            <option
              key={productOption.itemName}
              value={productOption.itemName}
            >
              {productOption.itemName} ({formatDollars(productOption.itemPrice)})
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className={fieldLabel}>Quantity</span>
        <input
          type="number"
          min={1}
          max={1000}
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value))}
          className={fieldInput}
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
        <input
          type="checkbox"
          checked={failPayment}
          onChange={(event) => setFailPayment(event.target.checked)}
        />
        Expired credit card (12/23, non-retryable)
      </label>

      <label className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
        <input
          type="checkbox"
          checked={invalidItem}
          onChange={(event) => setInvalidItem(event.target.checked)}
        />
        Invalid item name (append @@@)
      </label>

      {selected.hasApproval ? (
        <label className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
          <input
            type="checkbox"
            checked={requireApproval}
            onChange={(event) => setRequireApproval(event.target.checked)}
          />
          Force order over $10,000 (triggers{" "}
          <code className="font-mono text-xs">requireApproval</code>
          {selected.hasTimeout ? ", 30s timeout" : ""})
        </label>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Total {total}
        </p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          {pending ? "Starting workflow…" : `Start ${selected.workflow}`}
        </button>
      </div>

      {error ? (
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
      ) : null}
    </form>
  );
}
