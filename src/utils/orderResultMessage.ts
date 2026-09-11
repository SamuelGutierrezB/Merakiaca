export type ResultType = "success" | "failure" | "pending";

const TITLE: Record<ResultType, string> = {
  success: "¡Pago exitoso!",
  failure: "Pago rechazado",
  pending: "Pago en proceso",
};

const DESCRIPTION: Record<ResultType, string> = {
  success:
    "Tu pedido ha sido confirmado. Pronto recibirás noticias por WhatsApp.",
  failure:
    "El pago no pudo completarse. Esto puede pasar, por ejemplo, si la tarjeta está bloqueada o fue rechazada por el banco. Tu compra no se confirmó; puedes intentarlo de nuevo.",
  pending:
    "Tu pago está siendo procesado por Mercado Pago. Te avisaremos cuando se confirme.",
};

export interface ResultMessage {
  title: string;
  description: string;
}

/**
 * MRK-002: si la pantalla de success/pending se carga sin external_reference
 * (ej. el usuario la refresca o entra directo), no tenemos forma de saber si
 * realmente hubo un pago — mostrar un mensaje cauteloso en vez de afirmar
 * "pago exitoso" sin evidencia. failure no necesita este caso especial: su
 * mensaje ya es correcto sin datos (el botón de reintentar ya se deshabilita
 * aparte cuando falta el external_reference).
 */
export function getResultMessage(
  pathType: ResultType,
  hasExternalReference: boolean,
): ResultMessage {
  if (!hasExternalReference && pathType !== "failure") {
    return {
      title: "No pudimos verificar tu pago",
      description:
        'Si acabas de completar una compra, revisa el estado real en "Mis pedidos". Si llegaste aquí sin haber comprado, no se realizó ningún cargo.',
    };
  }

  return { title: TITLE[pathType], description: DESCRIPTION[pathType] };
}
