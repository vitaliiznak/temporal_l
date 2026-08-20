import { proxyActivities, defineQuery, setHandler }
    from '@temporalio/workflow';

import type * as activities from '../src/activities';
import type { Order } from '../src/interfaces/order';

const { processPayment, reserveInventory, deliverOrder } = proxyActivities<typeof activities>({
    startToCloseTimeout: '5 seconds',
    retry: { nonRetryableErrorTypes: ['CreditCardExpiredException'] }
});

export const statusQuery = defineQuery<{
    step: string;
    waiting_for_approval: boolean;
}>('status');

export async function OrderFulfillWorkflow(order: Order): Promise<string> {
    let step = 'processing_payment';
    setHandler(statusQuery, () => ({ step, waiting_for_approval: false }));

    const paymentResult = await processPayment(order);
    step = 'reserving_inventory';
    const inventoryResult = await reserveInventory(order);
    step = 'delivering';
    const deliveryResult = await deliverOrder(order);
    step = 'completed';
    return `Order fulfilled: ${paymentResult}, ${inventoryResult}, ${deliveryResult}`;
}
