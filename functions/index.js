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
const DISCOUNT_CODES_COLLECTION = "discountCodes";
const DISCOUNT_REDEMPTIONS_COLLECTION = "discountRedemptions";

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

const calculateDiscountAmount = ({ codeDoc, subtotal }) => {
  const type = codeDoc.type;
  const value = toSafeNumber(codeDoc.value, 0);
  const minPurchaseAmount = toSafeNumber(codeDoc.minPurchaseAmount, 0);
  const maxDiscountAmount = toSafeNumber(codeDoc.maxDiscountAmount, 0);

  if (minPurchaseAmount > 0 && subtotal < minPurchaseAmount) {
    return {
      ok: false,
      message: `Compra minima de ${minPurchaseAmount} requerida para este codigo`,
    };
  }

  let rawDiscount = 0;
  if (type === "percentage") {
    rawDiscount = (subtotal * value) / 100;
    if (maxDiscountAmount > 0) {
      rawDiscount = Math.min(rawDiscount, maxDiscountAmount);
    }
  } else if (type === "fixed_amount") {
    rawDiscount = value;
  } else {
    return { ok: false, message: "Tipo de descuento no valido" };
  }

  const discountAmount = Math.max(0, Math.min(rawDiscount, subtotal));
  const totalAfterDiscount = Math.max(0, subtotal - discountAmount);

  return {
    ok: true,
    discountAmount,
    totalAfterDiscount,
  };
};

exports.validateDiscountCode = onRequest(
  { region: "us-central1" },
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

        let decodedToken;
        try {
          decodedToken = await verifyIdToken(authHeader);
        } catch (err) {
          return res.status(401).json({ error: "Invalid token" });
        }

        const normalizedCode = String(req.body?.code || "")
          .trim()
          .toUpperCase();
        const subtotal = toSafeNumber(req.body?.subtotal, NaN);

        if (!normalizedCode) {
          return res.status(400).json({ error: "code is required" });
        }

        if (!Number.isFinite(subtotal) || subtotal < 0) {
          return res.status(400).json({ error: "subtotal must be valid" });
        }

        const codeSnapshot = await db
          .collection(DISCOUNT_CODES_COLLECTION)
          .where("code", "==", normalizedCode)
          .limit(1)
          .get();

        if (codeSnapshot.empty) {
          return res.status(404).json({ error: "Codigo no valido" });
        }

        const codeDocRef = codeSnapshot.docs[0];
        const codeDoc = codeDocRef.data();
        const now = Date.now();

        if (!codeDoc.isActive) {
          return res
            .status(400)
            .json({ error: "Este codigo esta desactivado" });
        }

        const startsAtMillis = codeDoc.startsAt?.toMillis?.();
        const endsAtMillis = codeDoc.endsAt?.toMillis?.();

        if (startsAtMillis && now < startsAtMillis) {
          return res
            .status(400)
            .json({ error: "Este codigo aun no esta disponible" });
        }

        if (endsAtMillis && now > endsAtMillis) {
          return res.status(400).json({ error: "Este codigo ya expiro" });
        }

        const maxUses = toSafeNumber(codeDoc.maxUses, 0);
        const currentUses = toSafeNumber(codeDoc.currentUses, 0);
        if (maxUses > 0 && currentUses >= maxUses) {
          return res
            .status(400)
            .json({ error: "Este codigo alcanzo su limite de usos" });
        }

        const maxUsesPerUser = toSafeNumber(codeDoc.maxUsesPerUser, 0);
        if (maxUsesPerUser > 0) {
          const userRedeemsSnapshot = await db
            .collection(DISCOUNT_REDEMPTIONS_COLLECTION)
            .where("codeId", "==", codeDocRef.id)
            .where("userId", "==", decodedToken.uid)
            .limit(maxUsesPerUser)
            .get();

          if (userRedeemsSnapshot.size >= maxUsesPerUser) {
            return res
              .status(400)
              .json({ error: "Ya alcanzaste el limite de uso de este codigo" });
          }
        }

        const calculation = calculateDiscountAmount({ codeDoc, subtotal });
        if (!calculation.ok) {
          return res.status(400).json({ error: calculation.message });
        }

        return res.status(200).json({
          codeId: codeDocRef.id,
          code: codeDoc.code,
          type: codeDoc.type,
          value: toSafeNumber(codeDoc.value, 0),
          discountAmount: calculation.discountAmount,
          subtotal,
          totalAfterDiscount: calculation.totalAfterDiscount,
        });
      } catch (error) {
        console.error("Error in validateDiscountCode:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
    });
  },
);

exports.applyDiscountCode = onRequest({ region: "us-central1" }, (req, res) => {
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

      let decodedToken;
      try {
        decodedToken = await verifyIdToken(authHeader);
      } catch (err) {
        return res.status(401).json({ error: "Invalid token" });
      }

      const { orderId, code, discountAmount, totalAfterDiscount } =
        req.body || {};

      if (typeof orderId !== "string" || !orderId.trim()) {
        return res.status(400).json({ error: "orderId is required" });
      }

      if (typeof code !== "string" || !code.trim()) {
        return res.status(400).json({ error: "code is required" });
      }

      const normalizedCode = code.trim().toUpperCase();
      const discountAmountNum = toSafeNumber(discountAmount, NaN);
      const totalAfterDiscountNum = toSafeNumber(totalAfterDiscount, NaN);

      if (!Number.isFinite(discountAmountNum) || discountAmountNum < 0) {
        return res.status(400).json({ error: "Invalid discountAmount" });
      }

      if (
        !Number.isFinite(totalAfterDiscountNum) ||
        totalAfterDiscountNum < 0
      ) {
        return res.status(400).json({ error: "Invalid totalAfterDiscount" });
      }

      const orderRef = db.collection(ORDERS_COLLECTION).doc(orderId);
      const orderSnapshot = await orderRef.get();

      if (!orderSnapshot.exists) {
        return res.status(404).json({ error: "Order not found" });
      }

      const order = orderSnapshot.data();
      if (order.userId !== decodedToken.uid) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (order.discountCode) {
        return res.status(400).json({
          error: "El descuento ya fue aplicado a esta orden",
        });
      }

      const codeSnapshot = await db
        .collection(DISCOUNT_CODES_COLLECTION)
        .where("code", "==", normalizedCode)
        .limit(1)
        .get();

      if (codeSnapshot.empty) {
        return res.status(404).json({ error: "Codigo no valido" });
      }

      const codeDocRef = codeSnapshot.docs[0];
      const codeDocData = codeDocRef.data();
      const now = Date.now();

      if (!codeDocData.isActive) {
        return res.status(400).json({ error: "Este codigo esta desactivado" });
      }

      const startsAtMillis = codeDocData.startsAt?.toMillis?.();
      const endsAtMillis = codeDocData.endsAt?.toMillis?.();

      if (startsAtMillis && now < startsAtMillis) {
        return res.status(400).json({
          error: "Este codigo aun no esta disponible",
        });
      }

      if (endsAtMillis && now > endsAtMillis) {
        return res.status(400).json({ error: "Este codigo ya expiro" });
      }

      const maxUses = toSafeNumber(codeDocData.maxUses, 0);
      const currentUses = toSafeNumber(codeDocData.currentUses, 0);
      if (maxUses > 0 && currentUses >= maxUses) {
        return res.status(400).json({
          error: "Este codigo alcanzo su limite de usos",
        });
      }

      const maxUsesPerUser = toSafeNumber(codeDocData.maxUsesPerUser, 0);

      let redeemResult = null;
      await db.runTransaction(async (transaction) => {
        const codeSnapshot2 = await transaction.get(codeDocRef);
        const codeData = codeSnapshot2.data();

        const currentUsesInTx = toSafeNumber(codeData.currentUses, 0);
        if (maxUses > 0 && currentUsesInTx >= maxUses) {
          throw new Error(
            "Este codigo alcanzo su limite de usos (verificacion final)",
          );
        }

        if (maxUsesPerUser > 0) {
          const userRedeemsSnapshot = await db
            .collection(DISCOUNT_REDEMPTIONS_COLLECTION)
            .where("codeId", "==", codeDocRef.id)
            .where("userId", "==", decodedToken.uid)
            .get();

          if (userRedeemsSnapshot.size >= maxUsesPerUser) {
            throw new Error(
              "Ya alcanzaste el limite de uso de este codigo (verificacion final)",
            );
          }
        }

        const incrementedUses = currentUsesInTx + 1;
        transaction.update(codeDocRef, {
          currentUses: incrementedUses,
          updatedAt: Timestamp.now(),
        });

        const redemptionRef = db
          .collection(DISCOUNT_REDEMPTIONS_COLLECTION)
          .doc();
        transaction.set(redemptionRef, {
          codeId: codeDocRef.id,
          code: normalizedCode,
          userId: decodedToken.uid,
          orderId,
          discountAmount: discountAmountNum,
          totalAfterDiscount: totalAfterDiscountNum,
          createdAt: Timestamp.now(),
        });

        redeemResult = {
          redemptionId: redemptionRef.id,
          codeId: codeDocRef.id,
          incrementedUses,
        };
      });

      return res.status(200).json({
        success: true,
        message: "Descuento aplicado exitosamente",
        redemptionId: redeemResult.redemptionId,
        incrementedUses: redeemResult.incrementedUses,
      });
    } catch (error) {
      console.error("Error in applyDiscountCode:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Internal server error";
      return res
        .status(
          errorMessage.includes("limite") || errorMessage.includes("expirado")
            ? 400
            : 500,
        )
        .json({ error: errorMessage });
    }
  });
});

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

        const items = Array.isArray(order.items)
          ? order.items.map((item) => ({
              id: item.productId,
              title: `${item.productName} - ${item.fabricName}`,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              currency_id: "MXN",
            }))
          : [];

        if (items.length === 0) {
          return res.status(400).json({ error: "Order has no valid items" });
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
