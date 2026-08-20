import Link from "next/link";
import { DemoWorkflowForm } from "@/components/DemoWorkflowForm";
import { RecentDemoWorkflows } from "@/components/RecentDemoWorkflows";

export default function DemoPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-10 px-6 py-12">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          TypeScript worker · typescript/demo/
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
          Order-fulfill demo workflows
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          Runs the three progressive{" "}
          <code className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-xs text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
            OrderFulfillWorkflow
          </code>{" "}
          variants as{" "}
          <code className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-xs text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
            DemoWorkflow1
          </code>
          –
          <code className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-xs text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
            DemoWorkflow3
          </code>
          . Restart the TypeScript worker after changing files in{" "}
          <code className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-xs text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
            typescript/demo/
          </code>
          .
        </p>
        <p className="mt-3 text-sm">
          <Link
            href="/"
            className="text-zinc-700 underline dark:text-zinc-300"
          >
            Back to the shop
          </Link>
        </p>
      </div>
      <DemoWorkflowForm />
      <RecentDemoWorkflows />
    </main>
  );
}
