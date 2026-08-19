import asyncio

from temporalio import activity


@activity.defn
async def send_confirmation_email(email: str, summary: str) -> str:
    await asyncio.sleep(1.5)
    activity.logger.info("Sent confirmation to %s: %s", email, summary)
    return f"Confirmation sent to {email}"
