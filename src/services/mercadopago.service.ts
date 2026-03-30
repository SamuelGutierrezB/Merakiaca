import { getAuth } from "firebase/auth";

export interface MPPreferenceResult {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string | null;
}

export interface MPPaymentSyncResult {
  paymentStatus: "pending" | "approved" | "rejected";
  mercadoPagoPaymentId: string | null;
  synced: boolean;
}

const MP_CREATE_PREFERENCE_URL =
  "https://us-central1-merakiaca-3a05a.cloudfunctions.net/mpCreatePreference";
const MP_SYNC_PAYMENT_URL =
  "https://us-central1-merakiaca-3a05a.cloudfunctions.net/mpSyncPaymentStatus";

async function getUserIdToken(): Promise<string> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  return user.getIdToken();
}

/**
 * Solicita al backend la creación de una preferencia de Checkout Pro.
 * El Access Token vive en Firebase Functions y no en el bundle del cliente.
 */
export async function createMercadoPagoPreference(
  orderId: string,
): Promise<MPPreferenceResult> {
  const idToken = await getUserIdToken();

  const response = await fetch(MP_CREATE_PREFERENCE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ orderId }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function syncMercadoPagoPaymentStatus(
  orderId: string,
  paymentId?: string,
): Promise<MPPaymentSyncResult> {
  const idToken = await getUserIdToken();

  const response = await fetch(MP_SYNC_PAYMENT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ orderId, paymentId: paymentId ?? null }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}
