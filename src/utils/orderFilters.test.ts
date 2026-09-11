import test from "node:test";
import assert from "node:assert/strict";
import {
  filterOrders,
  getOrderBranchId,
  ordersToCsv,
  DELIVERY_FILTER_VALUE,
} from "./orderFilters.ts";
import type { Order } from "../types/order.types.ts";

function fakeTimestamp(isoDate: string) {
  const date = new Date(isoDate);
  return { toDate: () => date } as unknown as Order["createdAt"];
}

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "order-1",
    userId: "user-1",
    items: [],
    subtotal: 100,
    tax: 0,
    shipping: 0,
    total: 100,
    status: "pending",
    paymentStatus: "pending",
    shippingAddress: {
      fullName: "Juan Perez",
      street: "Calle Falsa 123",
      city: "Guadalajara",
      state: "Jalisco",
      zipCode: "44100",
      country: "México",
      phone: "3312345678",
    },
    paymentMethod: "mercadopago",
    createdAt: fakeTimestamp("2026-06-01T12:00:00Z"),
    updatedAt: fakeTimestamp("2026-06-01T12:00:00Z"),
    ...overrides,
  } as Order;
}

test("getOrderBranchId returns the branch id for a pickup order", () => {
  const order = makeOrder({
    shippingAddress: {
      ...makeOrder().shippingAddress,
      street: "Recolección en sucursal - matriz-juarez",
    },
  });

  assert.equal(getOrderBranchId(order), "matriz-juarez");
});

test("getOrderBranchId returns null for a home-delivery order", () => {
  const order = makeOrder();

  assert.equal(getOrderBranchId(order), null);
});

test("filterOrders returns all orders when no criteria is given", () => {
  const orders = [makeOrder({ id: "a" }), makeOrder({ id: "b" })];

  const result = filterOrders(orders, {});

  assert.equal(result.length, 2);
});

test("filterOrders filters by status", () => {
  const orders = [
    makeOrder({ id: "a", status: "pending" }),
    makeOrder({ id: "b", status: "shipped" }),
  ];

  const result = filterOrders(orders, { status: "shipped" });

  assert.deepEqual(result.map((o) => o.id), ["b"]);
});

test("filterOrders filters by paymentStatus", () => {
  const orders = [
    makeOrder({ id: "a", paymentStatus: "approved" }),
    makeOrder({ id: "b", paymentStatus: "rejected" }),
  ];

  const result = filterOrders(orders, { paymentStatus: "approved" });

  assert.deepEqual(result.map((o) => o.id), ["a"]);
});

test("filterOrders filters by a specific branch id", () => {
  const orders = [
    makeOrder({
      id: "pickup-a",
      shippingAddress: {
        ...makeOrder().shippingAddress,
        street: "Recolección en sucursal - matriz-juarez",
      },
    }),
    makeOrder({
      id: "pickup-b",
      shippingAddress: {
        ...makeOrder().shippingAddress,
        street: "Recolección en sucursal - oblatos",
      },
    }),
  ];

  const result = filterOrders(orders, { branchId: "oblatos" });

  assert.deepEqual(result.map((o) => o.id), ["pickup-b"]);
});

test("filterOrders with DELIVERY_FILTER_VALUE returns only home-delivery orders", () => {
  const orders = [
    makeOrder({ id: "delivery" }), // default street is a real address, not pickup
    makeOrder({
      id: "pickup",
      shippingAddress: {
        ...makeOrder().shippingAddress,
        street: "Recolección en sucursal - matriz-juarez",
      },
    }),
  ];

  const result = filterOrders(orders, { branchId: DELIVERY_FILTER_VALUE });

  assert.deepEqual(result.map((o) => o.id), ["delivery"]);
});

test("filterOrders filters by date range (inclusive)", () => {
  const orders = [
    makeOrder({ id: "early", createdAt: fakeTimestamp("2026-05-01T00:00:00Z") }),
    makeOrder({ id: "middle", createdAt: fakeTimestamp("2026-06-15T00:00:00Z") }),
    makeOrder({ id: "late", createdAt: fakeTimestamp("2026-07-01T00:00:00Z") }),
  ];

  const result = filterOrders(orders, {
    dateFrom: new Date("2026-06-01T00:00:00Z"),
    dateTo: new Date("2026-06-30T23:59:59Z"),
  });

  assert.deepEqual(result.map((o) => o.id), ["middle"]);
});

test("filterOrders search matches customer name case-insensitively", () => {
  const orders = [
    makeOrder({
      id: "a",
      shippingAddress: { ...makeOrder().shippingAddress, fullName: "Maria Lopez" },
    }),
    makeOrder({
      id: "b",
      shippingAddress: { ...makeOrder().shippingAddress, fullName: "Juan Perez" },
    }),
  ];

  const result = filterOrders(orders, { search: "maria" });

  assert.deepEqual(result.map((o) => o.id), ["a"]);
});

test("filterOrders search matches order id", () => {
  const orders = [makeOrder({ id: "pyNmGWSJ" }), makeOrder({ id: "other" })];

  const result = filterOrders(orders, { search: "nmgw" });

  assert.deepEqual(result.map((o) => o.id), ["pyNmGWSJ"]);
});

test("filterOrders combines multiple criteria with AND logic", () => {
  const orders = [
    makeOrder({ id: "match", status: "shipped", paymentStatus: "approved" }),
    makeOrder({ id: "wrong-status", status: "pending", paymentStatus: "approved" }),
    makeOrder({ id: "wrong-payment", status: "shipped", paymentStatus: "pending" }),
  ];

  const result = filterOrders(orders, { status: "shipped", paymentStatus: "approved" });

  assert.deepEqual(result.map((o) => o.id), ["match"]);
});

test("ordersToCsv produces a header row and one row per order", () => {
  const order = makeOrder({ id: "order-1", total: 250 });

  const csv = ordersToCsv([order]);
  const lines = csv.split("\n");

  assert.equal(lines.length, 2);
  assert.match(lines[0], /ID/);
  assert.match(lines[1], /order-1/);
  assert.match(lines[1], /250/);
});

test("ordersToCsv escapes fields containing commas", () => {
  const order = makeOrder({
    shippingAddress: { ...makeOrder().shippingAddress, fullName: "Perez, Juan" },
  });

  const csv = ordersToCsv([order]);

  assert.match(csv, /"Perez, Juan"/);
});
