import { NextResponse } from "next/server";
import { getTemporalClient } from "@/lib/temporal";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const client = await getTemporalClient();
  const handle = client.workflow.getHandle(id);
  const description = await handle.describe();
  const status = description.status.name;

  let step: string | null = null;
  let waitingForApproval = false;
  let outcome: string | null = null;
  let tracking: string | null = null;
  let result: unknown = null;
  let error: string | null = null;

  if (status === "RUNNING") {
    try {
      const details = await handle.query("status");
      step = details.step;
      waitingForApproval = Boolean(details.waiting_for_approval);
      outcome = details.outcome;
      tracking = details.tracking || null;
    } catch {
      step = "received";
    }
  } else if (status === "COMPLETED") {
    result = await handle.result();
    const completed = result as { outcome?: string; tracking?: string };
    step = completed.outcome === "cancelled" ? "cancelled" : "completed";
    outcome = completed.outcome ?? "completed";
    tracking = completed.tracking ?? null;
  } else if (status === "FAILED") {
    try {
      await handle.result();
    } catch (err) {
      error = err instanceof Error ? err.message : "Workflow failed";
    }
  }

  return NextResponse.json({
    workflowId: id,
    status,
    step,
    waitingForApproval,
    outcome,
    tracking,
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

  if (body.action === "approve") {
    await handle.signal("approve_shipment");
  } else if (body.action === "cancel") {
    await handle.signal("cancel_order", "customer");
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
