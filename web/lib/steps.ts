export const ORDER_STEPS = [
  "received",
  "screening",
  "charging_payment",
  "awaiting_approval",
  "shipping",
  "sending_email",
  "completed",
  "compensating",
  "cancelled",
] as const;

export const STEP_LABELS: Record<string, string> = {
  received: "Order received",
  screening: "Fraud check + inventory (in parallel)",
  charging_payment: "Charging payment",
  awaiting_approval: "Waiting for approval",
  shipping: "Shipping (child workflow)",
  sending_email: "Sending confirmation email",
  completed: "Completed",
  compensating: "Compensating (refund / release stock)",
  cancelled: "Cancelled",
  processing_payment: "Processing payment",
  reserving_inventory: "Reserving inventory",
  delivering: "Delivering order",
  checking_approval: "Checking if approval is required",
};

export const HAPPY_PATH_STEPS = [
  "received",
  "screening",
  "charging_payment",
  "awaiting_approval",
  "shipping",
  "sending_email",
  "completed",
] as const;

export const FULFILL_HAPPY_PATH_STEPS = [
  "processing_payment",
  "reserving_inventory",
  "delivering",
  "completed",
] as const;
