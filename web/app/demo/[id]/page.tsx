import { DemoWorkflowStatus } from "@/components/DemoWorkflowStatus";

export default async function DemoWorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-12">
      <DemoWorkflowStatus workflowId={id} />
    </main>
  );
}
