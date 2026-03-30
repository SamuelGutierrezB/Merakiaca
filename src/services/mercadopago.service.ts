/**
 * Servicio de Mercado Pago — integración Checkout Pro.
 *
 * NOTA DE SEGURIDAD: La creación de preferencias usa el Access Token que
 * queda embebido en el bundle del cliente (variable VITE_). Esto es aceptable
 * para proyectos pequeños, pero en producción de alto tráfico se recomienda
 * mover esta llamada a una Firebase Cloud Function para no exponer el token.
 */

const MP_ACCESS_TOKEN = import.meta.env.VITE_MERCADOPAGO_ACCESS_TOKEN as string;
const MP_SUCCESS_URL = import.meta.env.VITE_MERCADOPAGO_SUCCESS_URL as string;
const MP_FAILURE_URL = import.meta.env.VITE_MERCADOPAGO_FAILURE_URL as string;
const MP_PENDING_URL = import.meta.env.VITE_MERCADOPAGO_PENDING_URL as string;

export interface MPPreferenceItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  currency_id: string;
}

export interface MPPreferenceResult {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

/**
 * Crea una preferencia de Checkout Pro en Mercado Pago.
 * Devuelve `init_point` (producción) y `sandbox_init_point` (pruebas).
 */
export async function createMercadoPagoPreference(
  orderId: string,
  items: MPPreferenceItem[],
  payerEmail?: string,
): Promise<MPPreferenceResult> {
  const body: Record<string, unknown> = {
    items,
    external_reference: orderId,
    back_urls: {
      success: MP_SUCCESS_URL,
      failure: MP_FAILURE_URL,
      pending: MP_PENDING_URL,
    },
    auto_return: "approved",
    statement_descriptor: "Merakiaca",
    expires: false,
  };

  if (payerEmail) {
    body.payer = { email: payerEmail };
  }

  const response = await fetch(
    "https://api.mercadopago.com/checkout/preferences",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(
      `Error al crear preferencia de pago: ${err.message ?? response.statusText}`,
    );
  }

  return response.json() as Promise<MPPreferenceResult>;
}
