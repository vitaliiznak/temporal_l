import asyncio

from temporalio import activity

from shared import CATALOG


@activity.defn
async def reserve_inventory(item: str, quantity: int) -> str:
    await asyncio.sleep(1.5)
    product = CATALOG[item]
    activity.logger.info("Reserved %s x %s", quantity, product["name"])
    return f"Reserved {quantity} × {product['name']}"


@activity.defn
async def release_inventory(item: str, quantity: int) -> str:
    await asyncio.sleep(1.2)
    product = CATALOG[item]
    activity.logger.info("Released %s x %s", quantity, product["name"])
    return f"Released {quantity} × {product['name']}"
