// Script temporal para crear un código de cliente frecuente de prueba
const admin = require("firebase-admin");

// Inicializar Firebase Admin
const serviceAccount = require("../firebase-admin-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function createTestCode() {
  try {
    console.log("🔄 Creando código de cliente frecuente de prueba...");

    const docRef = await db.collection("frequentCustomerCodes").add({
      code: "CLIENTE2024",
      isActive: true,
      maxUses: 100,
      currentUses: 0,
      usedBy: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("✅ Código creado exitosamente!");
    console.log("📋 ID del documento:", docRef.id);
    console.log("🎫 Código: CLIENTE2024");
    console.log("");
    console.log("Ahora puedes:");
    console.log("1. Ir a /admin/codigos-frecuentes para ver el código");
    console.log(
      '2. Probar en un producto: /productos/[id] → "Comenta con código de cliente frecuente"',
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error al crear código:", error);
    process.exit(1);
  }
}

createTestCode();
