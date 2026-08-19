import { OrderForm } from "@/components/OrderForm";
import { RecentOrders } from "@/components/RecentOrders";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-10 px-6 py-12">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Next.js app → Temporal → Python worker
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
          Place an order
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          Submitting this form starts{" "}
          <code className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-xs text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
            ProcessOrderWorkflow
          </code>
          . The Python worker runs a saga: parallel fraud + inventory, payment,
          a 20s shipment-approval <em>signal</em>, then a{" "}
          <code className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-xs text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
            ShipOrderWorkflow
          </code>{" "}
          child workflow. Failures refund and release stock.
        </p>
      </div>
      <OrderForm />
      <RecentOrders />
    </main>
  );
}
