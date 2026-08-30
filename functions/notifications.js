const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

const db = getFirestore();
const ADMIN_NOTIFICATIONS_COLLECTION = "adminNotifications";
const USERS_COLLECTION = "users";

const cleanupInvalidTokens = async (adminsSnap, response, tokens) => {
  const invalidTokens = new Set();

  response.responses.forEach((result, index) => {
    if (
      !result.success &&
      result.error?.code === "messaging/registration-token-not-registered"
    ) {
      invalidTokens.add(tokens[index]);
    }
  });

  if (invalidTokens.size === 0) {
    return;
  }

  await Promise.all(
    adminsSnap.docs.map(async (adminDoc) => {
      const adminTokens = adminDoc.data().fcmTokens || [];
      const tokensToRemove = adminTokens.filter((token) =>
        invalidTokens.has(token),
      );

      if (tokensToRemove.length > 0) {
        await adminDoc.ref.update({
          fcmTokens: FieldValue.arrayRemove(...tokensToRemove),
        });
      }
    }),
  );
};

const notifyAdmins = async ({ type, title, body, data = {} }) => {
  await db.collection(ADMIN_NOTIFICATIONS_COLLECTION).add({
    type,
    title,
    body,
    ...data,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  const adminsSnap = await db
    .collection(USERS_COLLECTION)
    .where("role", "==", "admin")
    .get();

  const tokens = adminsSnap.docs.flatMap((doc) => doc.data().fcmTokens || []);

  if (tokens.length === 0) {
    return;
  }

  const response = await getMessaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    webpush: {
      notification: { icon: "/logo.png" },
    },
    data: Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, String(value)]),
    ),
  });

  await cleanupInvalidTokens(adminsSnap, response, tokens);
};

module.exports = { notifyAdmins, cleanupInvalidTokens };
