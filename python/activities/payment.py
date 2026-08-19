import asyncio

from temporalio import activity
from temporalio.exceptions import ApplicationError

from shared import CATALOG


@activity.defn
async def charge_payment(item: str, quantity: int, fail: bool) -> int:
    await asyncio.sleep(1.5)
    if fail:
        raise ApplicationError("Payment declined", non_retryable=True)
    total = CATALOG[item]["price_cents"] * quantity
    activity.logger.info("Charged %s cents", total)
    return total


@activity.defn
async def refund_payment(total_cents: int) -> str:
    await asyncio.sleep(1.2)
    activity.logger.info("Refunded %s cents", total_cents)
    return f"Refunded ${total_cents / 100:.2f}"
