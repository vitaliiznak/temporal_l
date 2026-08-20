import { proxyActivities, defineSignal, defineQuery, setHandler, condition }
    from '@temporalio/workflow';

import type * as activities from '../src/activities';
import type { Order } from '../src/interfaces/order';

const { requireApproval, processPayment, reserveInventory, deliverOrder } = proxyActivities<typeof activities>({
    startToCloseTimeout: '5 seconds',
    retry: { nonRetryableErrorTypes: ['CreditCardExpiredException'] }
});

export const approveOrder = defineSignal('approveOrder');
export const statusQuery = defineQuery<{
    step: string;
    waiting_for_approval: boolean;
}>('status');

export async function OrderFulfillWorkflow(order: Order): Promise<string> {
    let isApproved = false;
    let step = 'checking_approval';
    setHandler(approveOrder, () => { isApproved = true; });
    setHandler(statusQuery, () => ({
        step,
        waiting_for_approval: step === 'awaiting_approval',
    }));

    if (await requireApproval(order)) {
        step = 'awaiting_approval';
        await condition(() => isApproved);
    }

    step = 'processing_payment';
    const paymentResult = await processPayment(order);
    step = 'reserving_inventory';
    const inventoryResult = await reserveInventory(order);
    step = 'delivering';
    const deliveryResult = await deliverOrder(order);
    step = 'completed';
    return `Order fulfilled: ${paymentResult}, ${inventoryResult}, ${deliveryResult}`;
}
