import asyncio

from temporalio import activity
from temporalio.exceptions import ApplicationError


@activity.defn
async def check_fraud(email: str, fail: bool) -> str:
    await asyncio.sleep(1.5)
    if fail:
        raise ApplicationError("Fraud check failed", non_retryable=True)
    activity.logger.info("Fraud check passed for %s", email)
    return f"Fraud check passed for {email}"
