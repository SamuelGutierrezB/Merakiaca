import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { validateFrequentCustomerCode } from "@/services/frequentCustomer.service";

interface FrequentCustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCodeValidated: (codeId: string, code: string) => void;
}

export default function FrequentCustomerDialog({
  isOpen,
  onClose,
  onCodeValidated,
}: FrequentCustomerDialogProps) {
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast.error("Por favor ingresa un código");
      return;
    }

    setIsValidating(true);

    try {
      const result = await validateFrequentCustomerCode(code);

      if (result.isValid && result.codeId) {
        toast.success("¡Código válido! Ahora puedes comentar");
        onCodeValidated(result.codeId, code.trim().toUpperCase());
        setCode("");
        onClose();
      } else {
        toast.error(result.message || "Código no válido");
      }
    } catch (error) {
      console.error("Error al validar código:", error);
      toast.error("Error al validar el código");
    } finally {
      setIsValidating(false);
    }
  };

  const handleClose = () => {
    setCode("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6 relative">
        {/* Botón cerrar */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 transition-colors"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        {/* Contenido */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Código de Cliente Frecuente
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Ingresa tu código de cliente frecuente para poder comentar este
              producto sin necesidad de haberlo comprado.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="frequentCustomerCode"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
              >
                Código *
              </label>
              <input
                id="frequentCustomerCode"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ej: CLIENTE2024"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2391C3] focus:border-transparent uppercase"
                maxLength={20}
                disabled={isValidating}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isValidating || !code.trim()}
                className="flex-1 bg-[#2391C3] hover:bg-[#1A6B8E] text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isValidating ? "Validando..." : "Validar código"}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={isValidating}
                className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-700 dark:text-gray-200 px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </form>

          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              💡 <strong>¿No tienes un código?</strong> Los códigos de cliente
              frecuente se otorgan a clientes que han realizado compras previas
              en nuestra tienda. Contáctanos para obtener el tuyo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
