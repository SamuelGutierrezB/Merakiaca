import test from "node:test";
import assert from "node:assert/strict";
import { formatPaymentMethodLabel } from "./paymentMethod.ts";

test("formats known payment types with a human-readable Spanish label", () => {
  assert.equal(formatPaymentMethodLabel("credit_card", "visa"), "Tarjeta de crédito (visa)");
  assert.equal(formatPaymentMethodLabel("debit_card", "master"), "Tarjeta de débito (master)");
  assert.equal(formatPaymentMethodLabel("ticket", "oxxo"), "Efectivo (oxxo)");
  assert.equal(formatPaymentMethodLabel("bank_transfer", "spei"), "Transferencia (spei)");
  assert.equal(formatPaymentMethodLabel("account_money", "account_money"), "Dinero en cuenta de Mercado Pago");
});

test("falls back to the raw paymentMethodId when paymentTypeId is unknown", () => {
  assert.equal(formatPaymentMethodLabel("some_new_type", "some_method"), "some_method");
});

test("falls back to the raw paymentTypeId when paymentMethodId is missing", () => {
  assert.equal(formatPaymentMethodLabel("some_new_type", undefined), "some_new_type");
});

test("returns null when there is no payment method info at all", () => {
  assert.equal(formatPaymentMethodLabel(undefined, undefined), null);
});
