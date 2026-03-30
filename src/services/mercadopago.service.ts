import { httpsCallable } from "firebase/functions";
import { functions } from "@/services/firebase";

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
  const createPreference = httpsCallable<
    { orderId: string },
    MPPreferenceResult
  >(functions, "createMercadoPagoPreference");

  const response = await createPreference({ orderId });
  return response.data;
}
