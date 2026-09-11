/** Mapeo de payment_type_id de Mercado Pago a una etiqueta legible en español. */
const TYPE_LABELS: Record<string, string> = {
  credit_card: "Tarjeta de crédito",
  debit_card: "Tarjeta de débito",
  ticket: "Efectivo",
  bank_transfer: "Transferencia",
};

/** account_money no lleva el paymentMethodId como sufijo util (es siempre "account_money") */
const FULL_LABELS: Record<string, string> = {
  account_money: "Dinero en cuenta de Mercado Pago",
};

export function formatPaymentMethodLabel(
  paymentTypeId: string | undefined,
  paymentMethodId: string | undefined,
): string | null {
  if (!paymentTypeId && !paymentMethodId) return null;

  if (paymentTypeId && FULL_LABELS[paymentTypeId]) {
    return FULL_LABELS[paymentTypeId];
  }

  if (paymentTypeId && TYPE_LABELS[paymentTypeId]) {
    return paymentMethodId
      ? `${TYPE_LABELS[paymentTypeId]} (${paymentMethodId})`
      : TYPE_LABELS[paymentTypeId];
  }

  return paymentMethodId || paymentTypeId || null;
}
