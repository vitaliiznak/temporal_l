import { Client, Connection } from "@temporalio/client";

const ADDRESS = process.env.TEMPORAL_ADDRESS ?? "localhost:7233";

export const PYTHON_TASK_QUEUE = "hello-world-python";
export const TYPESCRIPT_TASK_QUEUE = "sample-order-fulfill";
export const PYTHON_ORDER_WORKFLOW = "ProcessOrderWorkflow";
export const TYPESCRIPT_ORDER_WORKFLOW = "OrderFulfillWorkflow";
export const DEMO_WORKFLOWS = {
  "1": "DemoWorkflow1",
  "2": "DemoWorkflow2",
  "3": "DemoWorkflow3",
} as const;

export type DemoWorkflowVariant = keyof typeof DEMO_WORKFLOWS;
export type DemoWorkflowName = (typeof DEMO_WORKFLOWS)[DemoWorkflowVariant];

export const DEMO_WORKFLOW_TYPES = Object.values(DEMO_WORKFLOWS);

export function isDemoWorkflow(type: string): type is DemoWorkflowName {
  return (DEMO_WORKFLOW_TYPES as string[]).includes(type);
}

export function isFulfillWorkflow(type: string): boolean {
  return type === TYPESCRIPT_ORDER_WORKFLOW || isDemoWorkflow(type);
}

export type OrderWorker = "python" | "typescript";

export function workerConfig(worker: OrderWorker): {
  taskQueue: string;
  workflow: string;
} {
  if (worker === "typescript") {
    return {
      taskQueue: TYPESCRIPT_TASK_QUEUE,
      workflow: TYPESCRIPT_ORDER_WORKFLOW,
    };
  }
  return {
    taskQueue: PYTHON_TASK_QUEUE,
    workflow: PYTHON_ORDER_WORKFLOW,
  };
}

export function workerFromTaskQueue(taskQueue: string): OrderWorker {
  return taskQueue === TYPESCRIPT_TASK_QUEUE ? "typescript" : "python";
}

let client: Client | undefined;

export async function getTemporalClient(): Promise<Client> {
  if (!client) {
    const connection = await Connection.connect({ address: ADDRESS });
    client = new Client({ connection });
  }
  return client;
}
