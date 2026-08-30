const {
  onDocumentCreated,
  onDocumentUpdated,
} = require("firebase-functions/v2/firestore");
const { notifyAdmins } = require("./notifications");

const LOW_STOCK_THRESHOLD = 3;

const onOrderCreated = onDocumentCreated(
  { region: "us-central1", document: "orders/{orderId}" },
  async (event) => {
    const order = event.data?.data();
    if (!order) {
      return;
    }

    await notifyAdmins({
      type: "new_order",
      title: "Orden nueva (sin pagar)",
      body: `${order.shippingAddress?.fullName || "Cliente"} — $${order.total ?? 0}`,
      data: { orderId: event.params.orderId },
    });
  },
);

const onProductStockChanged = onDocumentUpdated(
  { region: "us-central1", document: "products/{productId}" },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!before || !after) {
      return;
    }

    const beforeFabrics = Array.isArray(before.fabrics) ? before.fabrics : [];
    const afterFabrics = Array.isArray(after.fabrics) ? after.fabrics : [];

    for (const fabric of afterFabrics) {
      const prevFabric = beforeFabrics.find((f) => f.id === fabric.id);
      const crossedThreshold =
        prevFabric &&
        prevFabric.stock > LOW_STOCK_THRESHOLD &&
        fabric.stock <= LOW_STOCK_THRESHOLD;

      if (crossedThreshold) {
        await notifyAdmins({
          type: "low_stock",
          title: "Stock bajo",
          body: `${after.name || "Producto"} — ${fabric.name}: quedan ${fabric.stock}`,
          data: { productId: event.params.productId },
        });
      }
    }
  },
);

module.exports = { onOrderCreated, onProductStockChanged };
