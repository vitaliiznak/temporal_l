import asyncio
import uuid

from temporalio.client import Client

from shared import ADDRESS, TASK_QUEUE
from workflows.say_hello import SayHelloWorkflow


async def main() -> None:
    client = await Client.connect(ADDRESS)
    result = await client.execute_workflow(
        SayHelloWorkflow.run,
        "Temporal",
        id=f"say-hello-python-{uuid.uuid4()}",
        task_queue=TASK_QUEUE,
    )
    print("Workflow result:", result)


if __name__ == "__main__":
    asyncio.run(main())
