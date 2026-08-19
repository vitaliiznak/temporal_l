import asyncio
from datetime import timedelta

from temporalio import workflow
from temporalio.common import RetryPolicy

with workflow.unsafe.imports_passed_through():
    from activities.email import send_confirmation_email
    from activities.fraud import check_fraud
    from activities.inventory import release_inventory, reserve_inventory
    from activities.payment import charge_payment, refund_payment
    from shared import CATALOG

from workflows.ship_order import ShipOrderWorkflow

APPROVAL_TIMEOUT = timedelta(seconds=20)
ACTIVITY_TIMEOUT = timedelta(seconds=30)
NO_RETRY = RetryPolicy(maximum_attempts=1)


@workflow.defn
class ProcessOrderWorkflow:
    def __init__(self) -> None:
        self._step = "received"
        self._approved = False
        self._cancelled = False
        self._cancel_reason = ""
        self._reserved = False
        self._charged = False
        self._item = ""
        self._quantity = 0
        self._total_cents = 0
        self._tracking = ""
        self._outcome = "in_progress"

    @workflow.query
    def current_step(self) -> str:
        return self._step

    @workflow.query
    def status(self) -> dict:
        return {
            "step": self._step,
            "waiting_for_approval": self._step == "awaiting_approval",
            "outcome": self._outcome,
            "tracking": self._tracking,
            "cancel_reason": self._cancel_reason,
        }

    @workflow.signal
    def approve_shipment(self) -> None:
        self._approved = True

    @workflow.signal
    def cancel_order(self, reason: str = "customer") -> None:
        self._cancelled = True
        self._cancel_reason = reason

    @workflow.run
    async def run(self, order: dict) -> dict:
        self._item = order["item"]
        self._quantity = int(order["quantity"])
        product = CATALOG[self._item]
        email = order["email"]

        self._step = "screening"
        reserved, fraud = await asyncio.gather(
            workflow.execute_activity(
                reserve_inventory,
                args=[self._item, self._quantity],
                start_to_close_timeout=ACTIVITY_TIMEOUT,
            ),
            workflow.execute_activity(
                check_fraud,
                args=[email, bool(order.get("fail_fraud", False))],
                start_to_close_timeout=ACTIVITY_TIMEOUT,
                retry_policy=NO_RETRY,
            ),
            return_exceptions=True,
        )
        if not isinstance(reserved, BaseException):
            self._reserved = True
        if isinstance(reserved, BaseException) or isinstance(fraud, BaseException):
            reason = "inventory_failed" if isinstance(reserved, BaseException) else "fraud"
            return await self._compensate(order, product, reason)

        if self._cancelled:
            return await self._compensate(order, product, self._cancel_reason or "customer")

        self._step = "charging_payment"
        try:
            self._total_cents = await workflow.execute_activity(
                charge_payment,
                args=[self._item, self._quantity, bool(order.get("fail_payment", False))],
                start_to_close_timeout=ACTIVITY_TIMEOUT,
                retry_policy=NO_RETRY,
            )
            self._charged = True
        except Exception:
            return await self._compensate(order, product, "payment_declined")

        if self._cancelled:
            return await self._compensate(order, product, self._cancel_reason or "customer")

        self._step = "awaiting_approval"
        try:
            await workflow.wait_condition(
                lambda: self._approved or self._cancelled,
                timeout=APPROVAL_TIMEOUT,
            )
        except TimeoutError:
            self._approved = True

        if self._cancelled or not self._approved:
            return await self._compensate(order, product, self._cancel_reason or "rejected")

        self._step = "shipping"
        shipment = await workflow.execute_child_workflow(
            ShipOrderWorkflow.run,
            args=[self._item, self._quantity],
            id=f"{workflow.info().workflow_id}-ship",
        )
        self._tracking = shipment["tracking"]

        summary = (
            f"{self._quantity} × {product['name']} — "
            f"${self._total_cents / 100:.2f} — {self._tracking}"
        )
        self._step = "sending_email"
        emailed = await workflow.execute_activity(
            send_confirmation_email,
            args=[email, summary],
            start_to_close_timeout=ACTIVITY_TIMEOUT,
        )

        self._step = "completed"
        self._outcome = "completed"
        return {
            "outcome": "completed",
            "customer_name": order["customer_name"],
            "item": product["name"],
            "quantity": self._quantity,
            "total_cents": self._total_cents,
            "tracking": self._tracking,
            "emailed": emailed,
            "summary": summary,
        }

    async def _compensate(self, order: dict, product: dict, reason: str) -> dict:
        self._step = "compensating"
        self._cancel_reason = reason
        if self._charged:
            await workflow.execute_activity(
                refund_payment,
                self._total_cents,
                start_to_close_timeout=ACTIVITY_TIMEOUT,
            )
            self._charged = False
        if self._reserved:
            await workflow.execute_activity(
                release_inventory,
                args=[self._item, self._quantity],
                start_to_close_timeout=ACTIVITY_TIMEOUT,
            )
            self._reserved = False
        self._step = "cancelled"
        self._outcome = "cancelled"
        return {
            "outcome": "cancelled",
            "reason": reason,
            "customer_name": order["customer_name"],
            "item": product["name"],
            "quantity": self._quantity,
            "total_cents": self._total_cents,
            "summary": f"Cancelled ({reason})",
        }
