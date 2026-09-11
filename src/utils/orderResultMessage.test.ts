import test from "node:test";
import assert from "node:assert/strict";
import { getResultMessage } from "./orderResultMessage.ts";

test("returns the normal success message when there is an external reference", () => {
  const result = getResultMessage("success", true);

  assert.equal(result.title, "¡Pago exitoso!");
});

test("returns a cautious message for success without an external reference", () => {
  const result = getResultMessage("success", false);

  assert.notEqual(result.title, "¡Pago exitoso!");
  assert.match(result.title, /no pudimos verificar/i);
});

test("returns a cautious message for pending without an external reference", () => {
  const result = getResultMessage("pending", false);

  assert.notEqual(result.title, "Pago en proceso");
  assert.match(result.title, /no pudimos verificar/i);
});

test("keeps the normal failure message even without an external reference (retry button is disabled separately)", () => {
  const result = getResultMessage("failure", false);

  assert.equal(result.title, "Pago rechazado");
});
