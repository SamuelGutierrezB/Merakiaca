import type { Order, OrderStatus, PaymentStatus } from "../types/order.types.ts";

/** Prefijo con el que Checkout.tsx codifica el branchId dentro de shippingAddress.street
 * cuando la orden es de recolección en sucursal (ver src/pages/Checkout.tsx). */
const PICKUP_PREFIX = "Recolección en sucursal - ";

/** Valor sentinela para filtrar solo órdenes de envío a domicilio (sin sucursal). */
export const DELIVERY_FILTER_VALUE = "__delivery__";

export function getOrderBranchId(order: Order): string | null {
  const street = order.shippingAddress?.street ?? "";
  if (!street.startsWith(PICKUP_PREFIX)) return null;
  const branchId = street.slice(PICKUP_PREFIX.length).trim();
  return branchId || null;
}

export interface OrderFilterCriteria {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  /** id de sucursal real, o DELIVERY_FILTER_VALUE para envío a domicilio */
  branchId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

function matchesBranch(order: Order, branchId: string): boolean {
  const orderBranchId = getOrderBranchId(order);
  if (branchId === DELIVERY_FILTER_VALUE) {
    return orderBranchId === null;
  }
  return orderBranchId === branchId;
}

function matchesDateRange(order: Order, dateFrom?: Date, dateTo?: Date): boolean {
  if (!dateFrom && !dateTo) return true;
  const createdAt = order.createdAt?.toDate?.() ?? null;
  if (!createdAt) return false;
  if (dateFrom && createdAt < dateFrom) return false;
  if (dateTo && createdAt > dateTo) return false;
  return true;
}

function matchesSearch(order: Order, search: string): boolean {
  const term = search.trim().toLowerCase();
  if (!term) return true;
  const name = order.shippingAddress?.fullName?.toLowerCase() ?? "";
  const id = order.id?.toLowerCase() ?? "";
  return name.includes(term) || id.includes(term);
}

export function filterOrders(orders: Order[], criteria: OrderFilterCriteria): Order[] {
  return orders.filter((order) => {
    if (criteria.status && order.status !== criteria.status) return false;
    if (criteria.paymentStatus && order.paymentStatus !== criteria.paymentStatus) return false;
    if (criteria.branchId && !matchesBranch(order, criteria.branchId)) return false;
    if (!matchesDateRange(order, criteria.dateFrom, criteria.dateTo)) return false;
    if (criteria.search && !matchesSearch(order, criteria.search)) return false;
    return true;
  });
}

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function ordersToCsv(orders: Order[]): string {
  const headers = [
    "ID",
    "Cliente",
    "Estado",
    "Estado de pago",
    "Total",
    "Fecha",
    "Entrega",
  ];

  const rows = orders.map((order) => {
    const branchId = getOrderBranchId(order);
    const createdAt = order.createdAt?.toDate?.();
    return [
      order.id,
      order.shippingAddress?.fullName ?? "",
      order.status,
      order.paymentStatus,
      String(order.total),
      createdAt ? createdAt.toISOString() : "",
      branchId ? `Recolección (${branchId})` : "Envío a domicilio",
    ];
  });

  return [headers, ...rows]
    .map((row) => row.map((cell) => escapeCsvCell(String(cell))).join(","))
    .join("\n");
}
