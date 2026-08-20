"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Order = {
  workflowId: string;
  status: string;
  startTime: string;
  worker?: "python" | "typescript";
};

export function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch("/api/orders")
      .then((response) => (response.ok ? response.json() : { orders: [] }))
      .then((data) => setOrders(data.orders ?? []))
      .catch(() => setOrders([]));
  }, []);

  if (orders.length === 0) {
    return null;
  }

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Recent workflows
      </h2>
      <ul className="space-y-1">
        {orders.map((order) => (
          <li key={order.workflowId}>
            <Link
              href={`/orders/${order.workflowId}`}
              className="flex items-center justify-between rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              <span className="truncate font-mono text-xs">
                {order.workflowId}
              </span>
              <span className="ml-3 shrink-0 text-zinc-600 dark:text-zinc-400">
                {order.worker === "typescript" ? "TS" : "Py"} · {order.status}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
