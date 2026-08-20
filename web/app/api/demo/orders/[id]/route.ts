import { NextResponse } from "next/server";
import { demoVariantByWorkflow } from "@/lib/demo-workflows";
import { getTemporalClient, isDemoWorkflow } from "@/lib/temporal";

type StatusDetails = {
  step?: string;
  waiting_for_approval?: boolean;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const client = await getTemporalClient();
  const handle = client.workflow.getHandle(id);
  const description = await handle.describe();
  const status = description.status.name;
  const workflowType = description.type;
  const variant = demoVariantByWorkflow(workflowType);

  let step: string | null = null;
  let waitingForApproval = false;
  let result: unknown = null;
  let error: string | null = null;

  if (status === "RUNNING") {
    try {
      const details = (await handle.query("status")) as StatusDetails;
      step = details.step ?? variant?.steps[0] ?? "processing_payment";
      waitingForApproval = Boolean(details.waiting_for_approval);
    } catch {
      step = variant?.steps[0] ?? "processing_payment";
      waitingForApproval = Boolean(variant?.hasApproval);
    }
  } else if (status === "COMPLETED") {
    result = await handle.result();
    if (typeof result === "string") {
      result = { summary: result };
    }
    step = "completed";
  } else if (status === "FAILED" || status === "TIMED_OUT") {
    try {
      await handle.result();
    } catch (err) {
      error = err instanceof Error ? err.message : "Workflow failed";
    }
  }

  return NextResponse.json({
    workflowId: id,
    workflowType,
    variantId: variant?.id ?? null,
    status,
    step,
    waitingForApproval,
    result,
    error,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const client = await getTemporalClient();
  const handle = client.workflow.getHandle(id);
  const description = await handle.describe();

  if (!isDemoWorkflow(description.type)) {
    return NextResponse.json(
      { error: "Not a TypeScript demo workflow" },
      { status: 400 },
    );
  }

  if (body.action !== "approve") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  await handle.signal("approveOrder");
  return NextResponse.json({ ok: true });
}
