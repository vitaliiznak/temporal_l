import { DEMO_WORKFLOWS, type DemoWorkflowVariant } from "@/lib/temporal";

export type { DemoWorkflowVariant };

export const DEMO_VARIANTS = [
  {
    id: "1" as const,
    workflow: DEMO_WORKFLOWS["1"],
    title: "Happy path",
    file: "demo/workflows1.ts",
    description:
      "Payment, then inventory, then delivery. No signals. Same flow as src/workflows.ts.",
    hasApproval: false,
    hasTimeout: false,
    steps: [
      "processing_payment",
      "reserving_inventory",
      "delivering",
      "completed",
    ],
  },
  {
    id: "2" as const,
    workflow: DEMO_WORKFLOWS["2"],
    title: "Human approval",
    file: "demo/workflows2.ts",
    description:
      "Orders over $10,000 wait on an approveOrder signal before payment.",
    hasApproval: true,
    hasTimeout: false,
    steps: [
      "checking_approval",
      "awaiting_approval",
      "processing_payment",
      "reserving_inventory",
      "delivering",
      "completed",
    ],
  },
  {
    id: "3" as const,
    workflow: DEMO_WORKFLOWS["3"],
    title: "Approval or timeout",
    file: "demo/workflows3.ts",
    description:
      "Same as v2, but the workflow fails after 30 seconds if nobody approves.",
    hasApproval: true,
    hasTimeout: true,
    steps: [
      "checking_approval",
      "awaiting_approval",
      "processing_payment",
      "reserving_inventory",
      "delivering",
      "completed",
    ],
  },
] as const;

export function demoVariantById(id: string) {
  return DEMO_VARIANTS.find((variant) => variant.id === id);
}

export function demoVariantByWorkflow(type: string) {
  return DEMO_VARIANTS.find((variant) => variant.workflow === type);
}

export const APPROVAL_LINE_PRICE = 10001;
