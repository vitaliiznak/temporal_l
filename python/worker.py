import asyncio

from temporalio.client import Client
from temporalio.worker import Worker

from activities.email import send_confirmation_email
from activities.fraud import check_fraud
from activities.greet import greet
from activities.inventory import release_inventory, reserve_inventory
from activities.payment import charge_payment, refund_payment
from activities.shipping import create_shipping_label, dispatch_shipment
from shared import ADDRESS, TASK_QUEUE
from workflows.process_order import ProcessOrderWorkflow
from workflows.say_hello import SayHelloWorkflow
from workflows.ship_order import ShipOrderWorkflow


async def main() -> None:
    client = await Client.connect(ADDRESS)
    worker = Worker(
        client,
        task_queue=TASK_QUEUE,
        workflows=[SayHelloWorkflow, ProcessOrderWorkflow, ShipOrderWorkflow],
        activities=[
            greet,
            check_fraud,
            reserve_inventory,
            release_inventory,
            charge_payment,
            refund_payment,
            send_confirmation_email,
            create_shipping_label,
            dispatch_shipment,
        ],
    )
    print(f"Python worker polling {TASK_QUEUE}")
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
