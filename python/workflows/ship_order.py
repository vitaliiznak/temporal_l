from datetime import timedelta

from temporalio import workflow

with workflow.unsafe.imports_passed_through():
    from activities.shipping import create_shipping_label, dispatch_shipment


@workflow.defn
class ShipOrderWorkflow:
    @workflow.run
    async def run(self, item: str, quantity: int) -> dict:
        timeout = timedelta(seconds=30)
        tracking = await workflow.execute_activity(
            create_shipping_label,
            args=[item, quantity],
            start_to_close_timeout=timeout,
        )
        dispatched = await workflow.execute_activity(
            dispatch_shipment,
            tracking,
            start_to_close_timeout=timeout,
        )
        return {"tracking": tracking, "dispatched": dispatched}
