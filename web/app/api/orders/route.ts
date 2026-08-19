import { NextResponse } from "next/server";
import {
  getTemporalClient,
  ORDER_WORKFLOW,
  TASK_QUEUE,
} from "@/lib/temporal";

export async function POST(request: Request) {
  const body = await request.json();
  const client = await getTemporalClient();
  const workflowId = `order-${crypto.randomUUID()}`;

  await client.workflow.start(ORDER_WORKFLOW, {
    taskQueue: TASK_QUEUE,
    workflowId,
    args: [
      {
        customer_name: body.customerName,
        email: body.email,
        item: body.item,
        quantity: Number(body.quantity),
        fail_payment: Boolean(body.failPayment),
        fail_fraud: Boolean(body.failFraud),
      },
    ],
  });

  return NextResponse.json({ workflowId });
}

export async function GET() {
  const client = await getTemporalClient();
  const orders = [];
  const seen = new Set<string>();

  for await (const workflow of client.workflow.list({
    query: `WorkflowType="${ORDER_WORKFLOW}"`,
  })) {
    if (seen.has(workflow.workflowId)) {
      continue;
    }
    seen.add(workflow.workflowId);
    orders.push({
      workflowId: workflow.workflowId,
      status: workflow.status.name,
      startTime: workflow.startTime,
    });
    if (orders.length >= 12) {
      break;
    }
  }

  return NextResponse.json({ orders });
}
