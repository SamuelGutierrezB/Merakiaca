const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { HttpsError, onCall } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

initializeApp();

const db = getFirestore();
const mercadoPagoAccessToken = defineSecret("MERCADOPAGO_ACCESS_TOKEN");
const DEFAULT_SITE_URL = "https://merakiaca-3a05a.web.app";
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "https://merakiaca-3a05a.web.app",
  "https://merakiaca-3a05a.firebaseapp.com",
]);

const buildBackUrls = (originHeader) => {
  const siteUrl =
    typeof originHeader === "string" && ALLOWED_ORIGINS.has(originHeader)
      ? originHeader
      : DEFAULT_SITE_URL;

  return {
    success: `${siteUrl}/orden/success`,
    failure: `${siteUrl}/orden/failure`,
    pending: `${siteUrl}/orden/pending`,
  };
};

exports.createMercadoPagoPreference = onCall(
  {
    region: "us-central1",
    secrets: [mercadoPagoAccessToken],
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
    }

    const orderId = request.data?.orderId;
    if (typeof orderId !== "string" || !orderId.trim()) {
      throw new HttpsError("invalid-argument", "orderId es obligatorio.");
    }

    const orderRef = db.collection("orders").doc(orderId);
    const orderSnapshot = await orderRef.get();

    if (!orderSnapshot.exists) {
      throw new HttpsError("not-found", "La orden no existe.");
    }

    const order = orderSnapshot.data();
    if (!order || order.userId !== request.auth.uid) {
      throw new HttpsError(
        "permission-denied",
        "No tienes acceso a esta orden.",
      );
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
      throw new HttpsError(
        "failed-precondition",
        "La orden no tiene productos válidos.",
      );
    }

    const accessToken = mercadoPagoAccessToken.value();
    if (!accessToken) {
      throw new HttpsError(
        "failed-precondition",
        "No hay credenciales de Mercado Pago configuradas.",
      );
    }

    const response = await fetch(
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
          back_urls: buildBackUrls(request.rawRequest.headers.origin),
          auto_return: "approved",
          statement_descriptor: "MERAKIACA",
          expires: false,
          payer:
            typeof request.auth.token.email === "string"
              ? { email: request.auth.token.email }
              : undefined,
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new HttpsError(
        "internal",
        `Mercado Pago rechazó la preferencia: ${errorBody.message || response.statusText}`,
      );
    }

    const preference = await response.json();

    await orderRef.update({
      mercadoPagoPreferenceId: preference.id,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point ?? null,
    };
  },
);
