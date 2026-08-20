import { NextResponse } from "next/server";
import {
  getTemporalClient,
  PYTHON_ORDER_WORKFLOW,
  TYPESCRIPT_ORDER_WORKFLOW,
  workerConfig,
  workerFromTaskQueue,
  type OrderWorker,
} from "@/lib/temporal";
import { FULFILL_CATALOG } from "@/lib/fulfill-catalog";

function parseWorker(value: unknown): OrderWorker {
  return value === "typescript" ? "typescript" : "python";
}

function typescriptOrderArgs(body: {
  item?: string;
  quantity?: number;
  failPayment?: boolean;
  invalidItem?: boolean;
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
        itemPrice: product.itemPrice,
        quantity: Number(body.quantity),
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
  const client = await getTemporalClient();
  const workflowId = `order-${crypto.randomUUID()}`;
  const worker = parseWorker(body.worker);
  const { taskQueue, workflow } = workerConfig(worker);
  const args =
    worker === "typescript"
      ? [typescriptOrderArgs(body)]
      : [
          {
            customer_name: body.customerName,
            email: body.email,
            item: body.item,
            quantity: Number(body.quantity),
            fail_payment: Boolean(body.failPayment),
            fail_fraud: Boolean(body.failFraud),
          },
        ];

  await client.workflow.start(workflow, {
    taskQueue,
    workflowId,
    args,
  });

  return NextResponse.json({ workflowId });
}

export async function GET() {
  const client = await getTemporalClient();
  const orders = [];
  const seen = new Set<string>();

  for await (const workflow of client.workflow.list({
    query: `WorkflowType="${PYTHON_ORDER_WORKFLOW}" OR WorkflowType="${TYPESCRIPT_ORDER_WORKFLOW}"`,
  })) {
    if (seen.has(workflow.workflowId)) {
      continue;
    }
    seen.add(workflow.workflowId);
    orders.push({
      workflowId: workflow.workflowId,
      status: workflow.status.name,
      startTime: workflow.startTime,
      worker: workerFromTaskQueue(workflow.taskQueue),
    });
    if (orders.length >= 12) {
      break;
    }
  }

  return NextResponse.json({ orders });
}
