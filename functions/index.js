const { initializeApp } = require("firebase-admin/app");
const {
  getFirestore,
  FieldValue,
  Timestamp,
} = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const cors = require("cors");

initializeApp();

const { onOrderCreated, onProductStockChanged } = require("./triggers");
const { notifyAdmins } = require("./notifications");

exports.onOrderCreated = onOrderCreated;
exports.onProductStockChanged = onProductStockChanged;

const db = getFirestore();
const mercadoPagoAccessToken = defineSecret("MERCADOPAGO_ACCESS_TOKEN");
const DEFAULT_SITE_URL = "https://merakiaca.com";
const WEBHOOK_URL =
  "https://us-central1-merakiaca-3a05a.cloudfunctions.net/mpWebhook";
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "https://merakiaca.com",
  "https://www.merakiaca.com",
  "https://merakiaca-3a05a.web.app",
  "https://merakiaca-3a05a.firebaseapp.com",
]);
const ALLOWED_MP_BACK_URL_ORIGINS = new Set([
  "https://merakiaca.com",
  "https://www.merakiaca.com",
  "https://merakiaca-3a05a.web.app",
  "https://merakiaca-3a05a.firebaseapp.com",
]);
const PRODUCTS_COLLECTION = "products";
const ORDERS_COLLECTION = "orders";

// CORS middleware
const corsMiddleware = cors({
  origin: Array.from(ALLOWED_ORIGINS),
  credentials: true,
  methods: ["POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

const buildBackUrls = (originHeader) => {
  const siteUrl =
    typeof originHeader === "string" &&
    ALLOWED_MP_BACK_URL_ORIGINS.has(originHeader)
      ? originHeader
      : DEFAULT_SITE_URL;

  return {
    success: `${siteUrl}/orden/success`,
    failure: `${siteUrl}/orden/failure`,
    pending: `${siteUrl}/orden/pending`,
  };
};

const mapMercadoPagoStatus = (status) => {
  const normalizedStatus =
    typeof status === "string" ? status.toLowerCase() : "pending";

  if (normalizedStatus === "approved") {
    return "approved";
  }

  if (normalizedStatus === "rejected" || normalizedStatus === "cancelled") {
    return "rejected";
  }

  return "pending";
};

const reduceProductFabricStock = async (productId, fabricId, quantity) => {
  const productRef = db.collection(PRODUCTS_COLLECTION).doc(productId);
  const productSnapshot = await productRef.get();

  if (!productSnapshot.exists) {
    throw new Error(`Producto no encontrado: ${productId}`);
  }

  const product = productSnapshot.data();
  const fabrics = Array.isArray(product.fabrics) ? product.fabrics : [];
  const updatedFabrics = fabrics.map((fabric) => {
    if (fabric.id === fabricId) {
      return {
        ...fabric,
        stock: Math.max(0, Number(fabric.stock || 0) - quantity),
      };
    }

    return fabric;
  });

  await productRef.update({
    fabrics: updatedFabrics,
    updatedAt: FieldValue.serverTimestamp(),
  });
};

const applyOrderPaymentUpdate = async ({
  orderId,
  mercadoPagoPaymentId,
  mercadoPagoStatus,
  note,
}) => {
  const orderRef = db.collection(ORDERS_COLLECTION).doc(orderId);
  let shouldReduceStock = false;
  let orderItems = [];
  const paymentStatus = mapMercadoPagoStatus(mercadoPagoStatus);
  let paymentStatusChanged = false;
  let orderForNotification = null;

  await db.runTransaction(async (transaction) => {
    const orderSnapshot = await transaction.get(orderRef);

    if (!orderSnapshot.exists) {
      throw new Error("La orden no existe.");
    }

    const order = orderSnapshot.data();
    const now = Timestamp.now();
    const updateData = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (
      mercadoPagoPaymentId &&
      order.mercadoPagoPaymentId !== mercadoPagoPaymentId
    ) {
      updateData.mercadoPagoPaymentId = mercadoPagoPaymentId;
    }

    if (order.paymentStatus !== paymentStatus) {
      updateData.paymentStatus = paymentStatus;
      updateData.paymentStatusHistory = FieldValue.arrayUnion({
        paymentStatus,
        changedAt: now,
        changedBy: "mercadopago-webhook",
        note: note || null,
      });
      paymentStatusChanged = true;
      orderForNotification = order;
    }

    if (paymentStatus === "approved" && !order.paymentApprovedAt) {
      updateData.paymentApprovedAt = now;

      if (order.status !== "processing") {
        updateData.status = "processing";
        updateData.statusHistory = FieldValue.arrayUnion({
          status: "processing",
          changedAt: now,
          changedBy: "mercadopago-webhook",
          note: "Estado actualizado automáticamente al aprobar el pago",
        });
      }

      shouldReduceStock = true;
      orderItems = Array.isArray(order.items) ? order.items : [];
    }

    if (Object.keys(updateData).length > 1) {
      transaction.update(orderRef, updateData);
    }
  });

  if (shouldReduceStock) {
    for (const item of orderItems) {
      await reduceProductFabricStock(
        item.productId,
        item.fabricId,
        item.quantity,
      );
    }
  }

  if (paymentStatusChanged && orderForNotification) {
    const customerName =
      orderForNotification.shippingAddress?.fullName || "Cliente";

    try {
      if (paymentStatus === "approved") {
        await notifyAdmins({
          type: "sale",
          title: "Nueva venta \u{1F389}",
          body: `$${toSafeNumber(orderForNotification.total, 0)} — ${customerName}`,
          data: { orderId },
        });
      } else if (paymentStatus === "rejected") {
        await notifyAdmins({
          type: "payment_rejected",
          title: "Pago rechazado",
          body: `Orden de ${customerName} — pago rechazado`,
          data: { orderId },
        });
      }
    } catch (error) {
      console.error("Error in applyOrderPaymentUpdate notifyAdmins:", error);
    }
  }

  return { paymentStatus, stockReduced: shouldReduceStock };
};

const fetchMercadoPagoPayment = async (paymentId, accessToken) => {
  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.message || `Mercado Pago error ${response.status}`,
    );
  }

  return response.json();
};

const extractPaymentIdFromNotification = (req) => {
  const queryPaymentId =
    req.query?.id || req.query?.["data.id"] || req.query?.data?.id;

  if (queryPaymentId) {
    return String(queryPaymentId);
  }

  if (req.body?.data?.id) {
    return String(req.body.data.id);
  }

  if (req.body?.id) {
    return String(req.body.id);
  }

  if (typeof req.body?.resource === "string") {
    const match = req.body.resource.match(/payments\/(\d+)/i);
    if (match) {
      return match[1];
    }
  }

  return null;
};

/**
 * Autentica con Firebase Auth usando el Authorization header.
 */
const verifyIdToken = async (authHeaderValue) => {
  if (!authHeaderValue || !authHeaderValue.startsWith("Bearer ")) {
    throw new Error("No token provided");
  }
  const token = authHeaderValue.slice(7);
  const decodedToken = await getAuth().verifyIdToken(token);
  return decodedToken;
};

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

exports.mpCreatePreference = onRequest(
  { region: "us-central1", secrets: [mercadoPagoAccessToken] },
  (req, res) => {
    corsMiddleware(req, res, async () => {
      try {
        if (req.method === "OPTIONS") {
          return res.status(204).send("");
        }

        if (req.method !== "POST") {
          return res.status(405).json({ error: "Method not allowed" });
        }

        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        let uid;
        try {
          const decodedToken = await verifyIdToken(authHeader);
          uid = decodedToken.uid;
        } catch (err) {
          return res.status(401).json({ error: "Invalid token" });
        }

        const { orderId } = req.body;
        if (typeof orderId !== "string" || !orderId.trim()) {
          return res.status(400).json({ error: "orderId is required" });
        }

        const orderRef = db.collection(ORDERS_COLLECTION).doc(orderId);
        const orderSnapshot = await orderRef.get();

        if (!orderSnapshot.exists) {
          return res.status(404).json({ error: "Order not found" });
        }

        const order = orderSnapshot.data();
        if (!order || order.userId !== uid) {
          return res.status(403).json({ error: "Access denied" });
        }

        const rawItems = Array.isArray(order.items) ? order.items : [];
        if (rawItems.length === 0) {
          return res.status(400).json({ error: "Order has no valid items" });
        }

        const orderTotal = toSafeNumber(order.total, null);
        if (orderTotal === null || orderTotal <= 0) {
          return res
            .status(400)
            .json({ error: "El monto de la orden no es valido para pagar" });
        }

        const shipping = toSafeNumber(order.shipping, 0);
        const tax = toSafeNumber(order.tax, 0);

        // Lo que deben sumar los items de producto: total menos envio e impuestos
        // (que se agregan como items aparte). Aqui es donde se refleja cualquier
        // descuento aplicado a la orden, ya que order.total ya lo tiene restado.
        const productsTarget = Math.max(0, orderTotal - shipping - tax);
        const productsRawSum = rawItems.reduce(
          (sum, item) =>
            sum + toSafeNumber(item.unitPrice, 0) * toSafeNumber(item.quantity, 0),
          0,
        );
        const scale = productsRawSum > 0 ? productsTarget / productsRawSum : 1;

        const items = rawItems.map((item) => {
          const quantity = toSafeNumber(item.quantity, 0);
          const unitPrice =
            quantity > 0
              ? Math.round(toSafeNumber(item.unitPrice, 0) * scale * 100) / 100
              : 0;
          return {
            id: item.productId,
            title: `${item.productName} - ${item.fabricName}`,
            quantity,
            unit_price: unitPrice,
            currency_id: "MXN",
          };
        });

        // Corregir el redondeo acumulado en el ultimo item para que la suma sea exacta
        const itemsSum = items.reduce(
          (sum, item) => sum + item.unit_price * item.quantity,
          0,
        );
        const roundingDelta = Math.round((productsTarget - itemsSum) * 100) / 100;
        const lastItem = items[items.length - 1];
        if (roundingDelta !== 0 && lastItem.quantity > 0) {
          lastItem.unit_price = Math.max(
            0,
            Math.round(
              (lastItem.unit_price + roundingDelta / lastItem.quantity) * 100,
            ) / 100,
          );
        }

        if (shipping > 0) {
          items.push({
            id: "shipping",
            title: "Envio",
            quantity: 1,
            unit_price: Math.round(shipping * 100) / 100,
            currency_id: "MXN",
          });
        }

        if (tax > 0) {
          items.push({
            id: "tax",
            title: "Impuestos",
            quantity: 1,
            unit_price: Math.round(tax * 100) / 100,
            currency_id: "MXN",
          });
        }

        const accessToken = mercadoPagoAccessToken.value();
        if (!accessToken) {
          return res
            .status(500)
            .json({ error: "MP credentials not configured" });
        }

        const mpResponse = await fetch(
          "https://api.mercadopago.com/checkout/preferences",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              items,
              external_reference: orderId,
              back_urls: buildBackUrls(req.headers.origin),
              notification_url: WEBHOOK_URL,
              auto_return: "approved",
              statement_descriptor: "MERAKIACA",
              expires: false,
              payer:
                typeof order.customerEmail === "string"
                  ? { email: order.customerEmail }
                  : undefined,
            }),
          },
        );

        if (!mpResponse.ok) {
          const errorBody = await mpResponse.json().catch(() => ({}));
          return res.status(400).json({
            error: `Mercado Pago rejected preference: ${errorBody.message || mpResponse.statusText}`,
          });
        }

        const preference = await mpResponse.json();

        await orderRef.update({
          mercadoPagoPreferenceId: preference.id,
          updatedAt: FieldValue.serverTimestamp(),
        });

        return res.status(200).json({
          preferenceId: preference.id,
          initPoint: preference.init_point,
          sandboxInitPoint: preference.sandbox_init_point ?? null,
        });
      } catch (error) {
        console.error("Error in mpCreatePreference:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
    });
  },
);

exports.mpSyncPaymentStatus = onRequest(
  { region: "us-central1", secrets: [mercadoPagoAccessToken] },
  (req, res) => {
    corsMiddleware(req, res, async () => {
      try {
        if (req.method === "OPTIONS") {
          return res.status(204).send("");
        }

        if (req.method !== "POST") {
          return res.status(405).json({ error: "Method not allowed" });
        }

        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const decodedToken = await verifyIdToken(authHeader);
        const { orderId, paymentId } = req.body || {};

        if (typeof orderId !== "string" || !orderId.trim()) {
          return res.status(400).json({ error: "orderId is required" });
        }

        const orderRef = db.collection(ORDERS_COLLECTION).doc(orderId);
        const orderSnapshot = await orderRef.get();

        if (!orderSnapshot.exists) {
          return res.status(404).json({ error: "Order not found" });
        }

        const order = orderSnapshot.data();
        if (!order || order.userId !== decodedToken.uid) {
          return res.status(403).json({ error: "Access denied" });
        }

        const resolvedPaymentId =
          (typeof paymentId === "string" && paymentId.trim()) ||
          order.mercadoPagoPaymentId;

        if (!resolvedPaymentId) {
          return res.status(200).json({
            paymentStatus: order.paymentStatus || "pending",
            mercadoPagoPaymentId: order.mercadoPagoPaymentId || null,
            synced: false,
          });
        }

        const accessToken = mercadoPagoAccessToken.value();
        const payment = await fetchMercadoPagoPayment(
          resolvedPaymentId,
          accessToken,
        );

        if (String(payment.external_reference || "") !== orderId) {
          return res
            .status(400)
            .json({ error: "Payment does not belong to order" });
        }

        const result = await applyOrderPaymentUpdate({
          orderId,
          mercadoPagoPaymentId: String(payment.id),
          mercadoPagoStatus: payment.status,
          note: "Sincronizado desde el redirect del cliente",
        });

        return res.status(200).json({
          paymentStatus: result.paymentStatus,
          mercadoPagoPaymentId: String(payment.id),
          synced: true,
        });
      } catch (error) {
        console.error("Error in mpSyncPaymentStatus:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
    });
  },
);

exports.mpWebhook = onRequest(
  { region: "us-central1", secrets: [mercadoPagoAccessToken] },
  async (req, res) => {
    try {
      if (req.method !== "POST" && req.method !== "GET") {
        return res.status(405).send("Method not allowed");
      }

      const paymentId = extractPaymentIdFromNotification(req);
      if (!paymentId) {
        return res.status(200).json({ received: true, ignored: true });
      }

      const accessToken = mercadoPagoAccessToken.value();
      const payment = await fetchMercadoPagoPayment(paymentId, accessToken);
      const orderId =
        typeof payment.external_reference === "string"
          ? payment.external_reference.trim()
          : "";

      if (!orderId) {
        return res.status(200).json({ received: true, ignored: true });
      }

      const result = await applyOrderPaymentUpdate({
        orderId,
        mercadoPagoPaymentId: String(payment.id),
        mercadoPagoStatus: payment.status,
        note: "Actualizado desde webhook de Mercado Pago",
      });

      return res.status(200).json({
        received: true,
        orderId,
        paymentStatus: result.paymentStatus,
      });
    } catch (error) {
      console.error("Error in mpWebhook:", error);
      return res.status(500).json({ received: false });
    }
  },
);

exports.applyOrderPaymentUpdate = applyOrderPaymentUpdate;
