import { OrderStatus } from "@/components/OrderStatus";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-12">
      <OrderStatus workflowId={id} />
    </main>
  );
}
