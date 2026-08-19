import asyncio
import uuid

from temporalio import activity


@activity.defn
async def create_shipping_label(item: str, quantity: int) -> str:
    await asyncio.sleep(1.2)
    tracking = f"TRK-{uuid.uuid4().hex[:8].upper()}"
    activity.logger.info("Created label %s for %s x %s", tracking, quantity, item)
    return tracking


@activity.defn
async def dispatch_shipment(tracking: str) -> str:
    await asyncio.sleep(1.2)
    activity.logger.info("Dispatched shipment %s", tracking)
    return f"Dispatched {tracking}"
