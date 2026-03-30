import { getAuth } from "firebase/auth";

export interface MPPreferenceResult {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string | null;
}

/**
 * Solicita al backend la creación de una preferencia de Checkout Pro.
 * El Access Token vive en Firebase Functions y no en el bundle del cliente.
 */
export async function createMercadoPagoPreference(
  orderId: string,
): Promise<MPPreferenceResult> {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Usuario no autenticado");
  }

  // Get Firebase Auth token
  const idToken = await user.getIdToken();

  const response = await fetch(
    "https://us-central1-merakiaca-3a05a.cloudfunctions.net/mpCreatePreference",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ orderId }),
    },
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}
