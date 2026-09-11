const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateValidatedOrderItems } = require("./pricing");

function makeProduct({
  id = "prod-1",
  basePrice = 100,
  fabrics = [{ id: "fab-1", priceModifier: 0 }],
  isActive = true,
} = {}) {
  return { id, basePrice, fabrics, isActive };
}

test("computes unit price from product basePrice + fabric priceModifier, ignoring client unitPrice", () => {
  const productsById = new Map([
    ["prod-1", makeProduct({ basePrice: 250, fabrics: [{ id: "fab-1", priceModifier: 20 }] })],
  ]);
  const items = [
    { productId: "prod-1", fabricId: "fab-1", quantity: 2, unitPrice: 0.01 },
  ];

  const result = calculateValidatedOrderItems(items, productsById);

  assert.equal(result.items[0].unitPrice, 270);
  assert.equal(result.items[0].totalPrice, 540);
  assert.equal(result.subtotal, 540);
});

test("sums totalPrice across multiple items into subtotal", () => {
  const productsById = new Map([
    ["prod-1", makeProduct({ id: "prod-1", basePrice: 100 })],
    ["prod-2", makeProduct({ id: "prod-2", basePrice: 50, fabrics: [{ id: "fab-2", priceModifier: 5 }] })],
  ]);
  const items = [
    { productId: "prod-1", fabricId: "fab-1", quantity: 1, unitPrice: 999 },
    { productId: "prod-2", fabricId: "fab-2", quantity: 3, unitPrice: 999 },
  ];

  const result = calculateValidatedOrderItems(items, productsById);

  // prod-1: 100 * 1 = 100; prod-2: 55 * 3 = 165; subtotal = 265
  assert.equal(result.subtotal, 265);
});

test("throws when the order references a product that does not exist", () => {
  const productsById = new Map();
  const items = [{ productId: "ghost", fabricId: "fab-1", quantity: 1, unitPrice: 1 }];

  assert.throws(
    () => calculateValidatedOrderItems(items, productsById),
    /product not found/i,
  );
});

test("throws when the order references a fabric that does not exist on the product", () => {
  const productsById = new Map([["prod-1", makeProduct()]]);
  const items = [{ productId: "prod-1", fabricId: "ghost-fabric", quantity: 1, unitPrice: 1 }];

  assert.throws(
    () => calculateValidatedOrderItems(items, productsById),
    /fabric not found/i,
  );
});

test("throws when quantity is not a positive integer", () => {
  const productsById = new Map([["prod-1", makeProduct()]]);
  const items = [{ productId: "prod-1", fabricId: "fab-1", quantity: 0, unitPrice: 1 }];

  assert.throws(
    () => calculateValidatedOrderItems(items, productsById),
    /quantity/i,
  );
});

test("throws when order has no items", () => {
  assert.throws(
    () => calculateValidatedOrderItems([], new Map()),
    /no valid items/i,
  );
});

test("rounds unit price and totalPrice to 2 decimals", () => {
  const productsById = new Map([
    ["prod-1", makeProduct({ basePrice: 33.333, fabrics: [{ id: "fab-1", priceModifier: 0.001 }] })],
  ]);
  const items = [{ productId: "prod-1", fabricId: "fab-1", quantity: 3, unitPrice: 1 }];

  const result = calculateValidatedOrderItems(items, productsById);

  assert.equal(result.items[0].unitPrice, 33.33);
  assert.equal(result.items[0].totalPrice, 99.99);
});
