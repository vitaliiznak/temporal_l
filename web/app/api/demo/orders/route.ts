import { NextResponse } from "next/server";
import { FULFILL_CATALOG } from "@/lib/fulfill-catalog";
import { APPROVAL_LINE_PRICE, demoVariantById } from "@/lib/demo-workflows";
import {
  DEMO_WORKFLOW_TYPES,
  TYPESCRIPT_TASK_QUEUE,
  getTemporalClient,
} from "@/lib/temporal";

function buildOrder(body: {
  item?: string;
  quantity?: number;
  failPayment?: boolean;
  invalidItem?: boolean;
  requireApproval?: boolean;
}) {
  const product =
    FULFILL_CATALOG.find((entry) => entry.itemName === body.item) ??
    FULFILL_CATALOG[0];
  const itemName = body.invalidItem
    ? `${product.itemName}@@@`
    : product.itemName;
  return {
    items: [
      {
        itemName,
        itemPrice: body.requireApproval
          ? APPROVAL_LINE_PRICE
          : product.itemPrice,
        quantity: Number(body.quantity) || 1,
      },
    ],
    payment: {
      creditCard: {
        number: "5678 1234 5678 1234",
        expiration: body.failPayment ? "12/23" : "12/26",
      },
    },
  };
}

export async function POST(request: Request) {
  const body = await request.json();
  const variant = demoVariantById(String(body.variant ?? "1"));
  if (!variant) {
    return NextResponse.json({ error: "Unknown demo variant" }, { status: 400 });
  }

  const client = await getTemporalClient();
  const workflowId = `demo-${variant.id}-${crypto.randomUUID()}`;

  await client.workflow.start(variant.workflow, {
    taskQueue: TYPESCRIPT_TASK_QUEUE,
    workflowId,
    args: [buildOrder(body)],
  });

  return NextResponse.json({ workflowId, workflow: variant.workflow });
}

export async function GET() {
  const client = await getTemporalClient();
  const orders = [];
  const seen = new Set<string>();
  const query = DEMO_WORKFLOW_TYPES.map(
    (type) => `WorkflowType="${type}"`,
  ).join(" OR ");

  for await (const workflow of client.workflow.list({ query })) {
    if (seen.has(workflow.workflowId)) {
      continue;
    }
    seen.add(workflow.workflowId);
    orders.push({
      workflowId: workflow.workflowId,
      status: workflow.status.name,
      startTime: workflow.startTime,
      workflowType: workflow.type,
    });
    if (orders.length >= 12) {
      break;
    }
  }

  return NextResponse.json({ orders });
}
