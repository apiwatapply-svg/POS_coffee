export type Discount = {
  type: "fixed" | "percentage";
  value: number;
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateItemTotal(input: { basePrice: number; modifierTotal: number; quantity: number }) {
  return roundMoney((input.basePrice + input.modifierTotal) * input.quantity);
}

export function calculateOrderTotals(input: {
  items: Array<{ totalPrice: number }>;
  discount: Discount;
  vatRate: number;
  serviceChargeRate: number;
}) {
  const subtotal = roundMoney(input.items.reduce((sum, item) => sum + item.totalPrice, 0));
  const discountAmount =
    input.discount.type === "percentage"
      ? roundMoney(subtotal * (input.discount.value / 100))
      : roundMoney(input.discount.value);
  const taxableBase = roundMoney(Math.max(subtotal - discountAmount, 0));
  const vatAmount = roundMoney(taxableBase * (input.vatRate / 100));
  const serviceChargeAmount = roundMoney(taxableBase * (input.serviceChargeRate / 100));
  const totalAmount = roundMoney(taxableBase + vatAmount + serviceChargeAmount);

  return {
    subtotal,
    discountAmount,
    taxableBase,
    vatAmount,
    serviceChargeAmount,
    totalAmount,
  };
}

export function calculateChange(input: { totalAmount: number; receivedAmount: number }) {
  return roundMoney(input.receivedAmount - input.totalAmount);
}

