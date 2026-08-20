export const FULFILL_CATALOG = [
  { itemName: "Cloudmonster Running Shoe (Men)", itemPrice: 126.99 },
  { itemName: "2002R Sneaker (Men)", itemPrice: 86.99 },
  { itemName: "Pima Cotton T-Shirt", itemPrice: 49.99 },
  { itemName: "Cotton Hoodie", itemPrice: 64.99 },
  { itemName: "High Top Sneaker (Men)", itemPrice: 99.0 },
  { itemName: "Wool Suit", itemPrice: 599.99 },
] as const;

export function formatDollars(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
