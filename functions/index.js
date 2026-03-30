const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { HttpsError, onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const cors = require("cors");

initializeApp();

const db = getFirestore();
const mercadoPagoAccessToken = defineSecret("MERCADOPAGO_ACCESS_TOKEN");
const DEFAULT_SITE_URL = "https://merakiaca-3a05a.web.app";
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "https://merakiaca-3a05a.web.app",
  "https://merakiaca-3a05a.firebaseapp.com",
]);

// CORS middleware
const corsMiddleware = cors({
  origin: Array.from(ALLOWED_ORIGINS),
  credentials: true,
  methods: ["POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

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

/**
 * Autentica con Firebase Auth usando el Authorization header
 */
const verifyIdToken = async (authHeaderValue) => {
  if (!authHeaderValue || !authHeaderValue.startsWith("Bearer ")) {
    throw new Error("No token provided");
  }
  const token = authHeaderValue.slice(7); // Remove "Bearer "
  const { getAuth } = require("firebase-admin/auth");
  const decodedToken = await getAuth().verifyIdToken(token);
  return decodedToken;
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

        // Verify Auth token
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

        // Get order from Firestore
        const orderRef = db.collection("orders").doc(orderId);
        const orderSnapshot = await orderRef.get();

        if (!orderSnapshot.exists) {
          return res.status(404).json({ error: "Order not found" });
        }

        const order = orderSnapshot.data();
        if (!order || order.userId !== uid) {
          return res.status(403).json({ error: "Access denied" });
        }

        // Build items array
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

        // Create preference in Mercado Pago
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

        // Save preference ID to order
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
        console.error("Error in createMercadoPagoPreference:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
    });
  },
);
