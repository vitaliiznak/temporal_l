"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CATALOG, formatCents } from "@/lib/catalog";
import { FULFILL_CATALOG, formatDollars } from "@/lib/fulfill-catalog";

const fieldLabel = "text-sm font-medium text-zinc-800 dark:text-zinc-200";
const fieldInput =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-zinc-400 placeholder:text-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:ring-zinc-500";

export function OrderForm() {
  const router = useRouter();
  const [item, setItem] = useState(CATALOG[0].id);
  const [fulfillItem, setFulfillItem] = useState(FULFILL_CATALOG[0].itemName);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [worker, setWorker] = useState<"python" | "typescript">("typescript");
  const [failPayment, setFailPayment] = useState(false);
  const [failFraud, setFailFraud] = useState(false);
  const [invalidItem, setInvalidItem] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const pythonProduct = CATALOG.find((entry) => entry.id === item) ?? CATALOG[0];
  const fulfillProduct =
    FULFILL_CATALOG.find((entry) => entry.itemName === fulfillItem) ??
    FULFILL_CATALOG[0];
  const total =
    worker === "typescript"
      ? formatDollars(fulfillProduct.itemPrice * quantity)
      : formatCents(pythonProduct.priceCents * quantity);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName,
        email,
        item: worker === "typescript" ? fulfillItem : item,
        quantity,
        worker,
        failPayment,
        failFraud,
        invalidItem,
      }),
    });

    if (!response.ok) {
      setError("Could not start the order workflow. Is Temporal running?");
      setPending(false);
      return;
    }

    const { workflowId } = await response.json();
    router.push(`/orders/${workflowId}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <fieldset className="space-y-2">
        <legend className={fieldLabel}>Worker</legend>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { id: "typescript", label: "TypeScript" },
              { id: "python", label: "Python" },
            ] as const
          ).map((option) => {
            const selected = worker === option.id;
            return (
              <label
                key={option.id}
                className={`flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm ${
                  selected
                    ? "border-zinc-900 bg-zinc-100 font-medium text-zinc-950 dark:border-sky-400 dark:bg-zinc-800 dark:text-white"
                    : "border-zinc-300 bg-white text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                }`}
              >
                <input
                  type="radio"
                  name="worker"
                  value={option.id}
                  checked={selected}
                  onChange={() => {
                    setWorker(option.id);
                    setQuantity(1);
                  }}
                  className="sr-only"
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      {worker === "typescript" ? (
        <>
          <label className="block space-y-1">
            <span className={fieldLabel}>Product</span>
            <select
              value={fulfillItem}
              onChange={(event) => setFulfillItem(event.target.value)}
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
            <span className="block text-xs text-zinc-500 dark:text-zinc-400">
              Orders over $10,000 wait for an <code>approveOrder</code> signal
              (or fail after 30s).
            </span>
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
        </>
      ) : (
        <>
          <fieldset className="space-y-2">
            <legend className={fieldLabel}>Product</legend>
            <div className="grid gap-2">
              {CATALOG.map((productOption) => {
                const selected = item === productOption.id;
                return (
                  <label
                    key={productOption.id}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 ${
                      selected
                        ? "border-zinc-900 bg-zinc-100 text-zinc-950 dark:border-sky-400 dark:bg-zinc-800 dark:text-white"
                        : "border-zinc-300 bg-white text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="item"
                        value={productOption.id}
                        checked={selected}
                        onChange={() => setItem(productOption.id)}
                      />
                      {productOption.name}
                    </span>
                    <span
                      className={`text-sm ${
                        selected
                          ? "text-zinc-700 dark:text-zinc-200"
                          : "text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      {formatCents(productOption.priceCents)}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <label className="block space-y-1">
            <span className={fieldLabel}>Quantity</span>
            <input
              type="number"
              min={1}
              max={9}
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
              className={fieldInput}
            />
          </label>

          <label className="block space-y-1">
            <span className={fieldLabel}>Name</span>
            <input
              required
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              className={fieldInput}
            />
          </label>

          <label className="block space-y-1">
            <span className={fieldLabel}>Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldInput}
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={failFraud}
              onChange={(event) => setFailFraud(event.target.checked)}
            />
            Simulate fraud failure (saga: release stock)
          </label>

          <label className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={failPayment}
              onChange={(event) => setFailPayment(event.target.checked)}
            />
            Simulate payment failure (saga: release stock)
          </label>
        </>
      )}

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Total {total}
        </p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          {pending ? "Starting workflow…" : "Place order"}
        </button>
      </div>

      {error ? (
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
      ) : null}
    </form>
  );
}
