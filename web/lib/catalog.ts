export const CATALOG = [
  { id: "mug", name: "Temporal mug", priceCents: 2400 },
  { id: "hoodie", name: "Workflow hoodie", priceCents: 6800 },
  { id: "socks", name: "Activity socks", priceCents: 1200 },
] as const;

export type ProductId = (typeof CATALOG)[number]["id"];

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
