const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const round2 = (value) => Math.round(value * 100) / 100;

/**
 * Recalcula precios de una orden a partir del catalogo real (products), ignorando
 * cualquier unitPrice/total que haya mandado el cliente. Esta es la unica fuente de
 * verdad para lo que se le cobra a un cliente via Mercado Pago (ver MRK-012).
 *
 * @param {Array<{productId: string, fabricId: string, quantity: number}>} items
 * @param {Map<string, {basePrice: number, fabrics: Array<{id: string, priceModifier: number}>}>} productsById
 * @returns {{items: Array<{productId: string, fabricId: string, quantity: number, unitPrice: number, totalPrice: number}>, subtotal: number}}
 */
function calculateValidatedOrderItems(items, productsById) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Order has no valid items");
  }

  const validatedItems = items.map((item) => {
    const product = productsById.get(item.productId);
    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }

    const fabric = (product.fabrics || []).find((f) => f.id === item.fabricId);
    if (!fabric) {
      throw new Error(`Fabric not found: ${item.fabricId} (product ${item.productId})`);
    }

    const quantity = toSafeNumber(item.quantity, 0);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(`Invalid quantity for product ${item.productId}: ${item.quantity}`);
    }

    const unitPrice = round2(
      toSafeNumber(product.basePrice, 0) + toSafeNumber(fabric.priceModifier, 0),
    );
    const totalPrice = round2(unitPrice * quantity);

    return {
      productId: item.productId,
      fabricId: item.fabricId,
      quantity,
      unitPrice,
      totalPrice,
    };
  });

  const subtotal = round2(
    validatedItems.reduce((sum, item) => sum + item.totalPrice, 0),
  );

  return { items: validatedItems, subtotal };
}

module.exports = { calculateValidatedOrderItems };
