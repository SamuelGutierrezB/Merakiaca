import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Timestamp } from "firebase/firestore";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  PlusIcon,
  ShareIcon,
  TrashIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import type { DiscountCode, DiscountCodeType } from "@/types";
import {
  createDiscountCode,
  deleteDiscountCode,
  getAllDiscountCodes,
  toggleDiscountCodeStatus,
} from "@/services/discountCodes.service";
import { formatPrice } from "@/utils/formatters";

export default function AdminDiscountCodes() {
  const navigate = useNavigate();
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    codeId: string | null;
    codeName: string | null;
  }>({ isOpen: false, codeId: null, codeName: null });

  const [newCode, setNewCode] = useState("");
  const [discountType, setDiscountType] =
    useState<DiscountCodeType>("percentage");
  const [discountValue, setDiscountValue] = useState(10);
  const [maxUses, setMaxUses] = useState(100);
  const [maxUsesPerUser, setMaxUsesPerUser] = useState(1);
  const [minPurchaseAmount, setMinPurchaseAmount] = useState<number | "">("");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | "">("");

  const generateSecureCode = (length = 10) => {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const randomValues = new Uint32Array(length);
    globalThis.crypto.getRandomValues(randomValues);

    return Array.from(
      randomValues,
      (value) => alphabet[value % alphabet.length],
    )
      .join("")
      .toUpperCase();
  };

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    try {
      setIsLoading(true);
      const data = await getAllDiscountCodes();
      const sorted = data.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      setCodes(sorted);
    } catch (error) {
      toast.error("Error al cargar codigos de descuento");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setNewCode("");
    setDiscountType("percentage");
    setDiscountValue(10);
    setMaxUses(100);
    setMaxUsesPerUser(1);
    setMinPurchaseAmount("");
    setMaxDiscountAmount("");
    setShowCreateForm(false);
  };

  const handleGenerateCode = () => {
    const generatedCode = generateSecureCode();
    setNewCode(generatedCode);
    toast.success("Código seguro generado");
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCode.trim()) {
      toast.error("Ingresa un codigo");
      return;
    }

    if (maxUses < 1 || maxUsesPerUser < 1) {
      toast.error("Los limites de uso deben ser al menos 1");
      return;
    }

    if (
      discountType === "percentage" &&
      (discountValue <= 0 || discountValue > 100)
    ) {
      toast.error("Para porcentaje, el valor debe estar entre 1 y 100");
      return;
    }

    if (discountType === "fixed_amount" && discountValue <= 0) {
      toast.error("Para monto fijo, el valor debe ser mayor a 0");
      return;
    }

    setIsCreating(true);
    try {
      await createDiscountCode({
        code: newCode,
        type: discountType,
        value: discountValue,
        maxUses,
        maxUsesPerUser,
        minPurchaseAmount:
          typeof minPurchaseAmount === "number" ? minPurchaseAmount : undefined,
        maxDiscountAmount:
          typeof maxDiscountAmount === "number" ? maxDiscountAmount : undefined,
      });
      toast.success("Codigo de descuento creado");
      resetForm();
      loadCodes();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo crear el codigo de descuento",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Codigo copiado");
    } catch (error) {
      toast.error("No se pudo copiar el codigo");
    }
  };

  const handleShareCode = async (code: DiscountCode) => {
    const discountLabel =
      code.type === "percentage"
        ? `${code.value}%`
        : `${formatPrice(code.value)} MXN`;

    const message = `Codigo de descuento Merakiaca\n\nCodigo: ${code.code}\nDescuento: ${discountLabel}\n\nAplicalo en checkout al finalizar tu compra.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Codigo de descuento - Merakiaca",
          text: message,
        });
      } catch (error) {
        // Error silenciado
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(message);
      toast.success("Mensaje copiado para compartir");
    } catch (error) {
      toast.error("No se pudo compartir");
    }
  };

  const handleToggleStatus = async (codeId: string, currentStatus: boolean) => {
    try {
      await toggleDiscountCodeStatus(codeId, !currentStatus);
      toast.success(currentStatus ? "Codigo desactivado" : "Codigo activado");
      loadCodes();
    } catch (error) {
      toast.error("No se pudo cambiar el estado");
    }
  };

  const handleDeleteClick = (codeId: string, codeName: string) => {
    setDeleteDialog({ isOpen: true, codeId, codeName });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.codeId) {
      return;
    }

    try {
      await deleteDiscountCode(deleteDialog.codeId);
      toast.success("Codigo eliminado");
      loadCodes();
    } catch (error) {
      toast.error("No se pudo eliminar el codigo");
    }
  };

  const formatDate = (timestamp: Timestamp | Date | null | undefined) => {
    if (!timestamp) return "N/A";
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return new Intl.DateTimeFormat("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getUsagePercentage = (currentUses: number, maxUses: number) => {
    if (maxUses <= 0) return 0;
    return (currentUses / maxUses) * 100;
  };

  const getDiscountLabel = (code: DiscountCode) => {
    if (code.type === "percentage") {
      return `${code.value}%`;
    }

    return formatPrice(code.value);
  };

  const performanceStats = codes.reduce(
    (accumulator, code) => {
      const validationAttempts = code.validationAttempts || 0;
      const validationSuccesses = code.validationSuccesses || 0;
      const totalRedemptions = code.totalRedemptions || 0;
      const totalDiscountGiven = code.totalDiscountGiven || 0;

      accumulator.activeCodes += code.isActive ? 1 : 0;
      accumulator.percentageCodes += code.type === "percentage" ? 1 : 0;
      accumulator.fixedAmountCodes += code.type === "fixed_amount" ? 1 : 0;
      accumulator.validationAttempts += validationAttempts;
      accumulator.validationSuccesses += validationSuccesses;
      accumulator.totalRedemptions += totalRedemptions;
      accumulator.totalDiscountGiven += totalDiscountGiven;

      return accumulator;
    },
    {
      activeCodes: 0,
      percentageCodes: 0,
      fixedAmountCodes: 0,
      validationAttempts: 0,
      validationSuccesses: 0,
      totalRedemptions: 0,
      totalDiscountGiven: 0,
    },
  );

  const validationSuccessRate =
    performanceStats.validationAttempts > 0
      ? (performanceStats.validationSuccesses /
          performanceStats.validationAttempts) *
        100
      : 0;

  const conversionRate =
    performanceStats.validationSuccesses > 0
      ? (performanceStats.totalRedemptions /
          performanceStats.validationSuccesses) *
        100
      : 0;

  const averageDiscount =
    performanceStats.totalRedemptions > 0
      ? performanceStats.totalDiscountGiven / performanceStats.totalRedemptions
      : 0;

  return (
    <div className="py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span className="hidden sm:inline">
              Volver al Panel de Administración
            </span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              Códigos de Descuento
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Crea, comparte y gestiona descuentos para aplicar en checkout
            </p>
          </div>

          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-[#2391C3] hover:bg-[#1A6B8E] text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Crear Código
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              Nuevo Código de Descuento
            </h2>

            <form onSubmit={handleCreateCode} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Código *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg uppercase"
                      placeholder="Ej: BIENVENIDA10"
                      maxLength={25}
                      disabled={isCreating}
                      required
                    />
                    <button
                      type="button"
                      onClick={handleGenerateCode}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium whitespace-nowrap"
                      disabled={isCreating}
                    >
                      Generar
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Usa aleatoriedad criptográfica para evitar códigos
                    predecibles.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Tipo de descuento *
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) =>
                      setDiscountType(e.target.value as DiscountCodeType)
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                    disabled={isCreating}
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed_amount">Monto fijo (MXN)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Valor *
                  </label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) =>
                      setDiscountValue(Number(e.target.value) || 0)
                    }
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                    disabled={isCreating}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Usos máximos globales *
                  </label>
                  <input
                    type="number"
                    value={maxUses}
                    onChange={(e) => setMaxUses(Number(e.target.value) || 0)}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                    disabled={isCreating}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Usos máximos por usuario *
                  </label>
                  <input
                    type="number"
                    value={maxUsesPerUser}
                    onChange={(e) =>
                      setMaxUsesPerUser(Number(e.target.value) || 0)
                    }
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                    disabled={isCreating}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Compra mínima (opcional)
                  </label>
                  <input
                    type="number"
                    value={minPurchaseAmount}
                    onChange={(e) =>
                      setMinPurchaseAmount(
                        e.target.value ? Number(e.target.value) : "",
                      )
                    }
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                    disabled={isCreating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Tope de descuento (opcional)
                  </label>
                  <input
                    type="number"
                    value={maxDiscountAmount}
                    onChange={(e) =>
                      setMaxDiscountAmount(
                        e.target.value ? Number(e.target.value) : "",
                      )
                    }
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                    disabled={isCreating}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="bg-[#2391C3] hover:bg-[#1A6B8E] text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  {isCreating ? "Creando..." : "Crear Código"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2391C3] border-t-transparent mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-300 mt-4">
              Cargando códigos...
            </p>
          </div>
        ) : codes.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Aún no hay códigos de descuento
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-4 text-[#2391C3] hover:underline font-medium"
            >
              Crear el primer código →
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Códigos activos
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {performanceStats.activeCodes}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  de {codes.length} códigos totales
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tasa de validación
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {validationSuccessRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {performanceStats.validationSuccesses} válidas de {performanceStats.validationAttempts} intentos
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tasa de conversión
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {conversionRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {performanceStats.totalRedemptions} canjes de {performanceStats.validationSuccesses} validaciones exitosas
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Descuento promedio
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {formatPrice(averageDiscount)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatPrice(performanceStats.totalDiscountGiven)} otorgados en total
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {codes.map((code) => {
              const usagePercentage = getUsagePercentage(
                code.currentUses,
                code.maxUses,
              );
              return (
                <div
                  key={code.id}
                  className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-[#2391C3] to-[#1A6B8E] p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-1">
                          {code.code}
                        </h3>
                        <p className="text-white/80 text-sm">
                          Descuento: {getDiscountLabel(code)}
                        </p>
                      </div>
                      {code.isActive ? (
                        <span className="flex items-center gap-1 bg-green-500/80 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          <CheckCircleIcon className="h-4 w-4" />
                          Activo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 bg-red-500/80 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          <XCircleIcon className="h-4 w-4" />
                          Inactivo
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <p className="text-gray-500 dark:text-gray-400">Usos</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {code.currentUses} / {code.maxUses}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <p className="text-gray-500 dark:text-gray-400">
                          Límite por usuario
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {code.maxUsesPerUser || 1}
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-[#2391C3] h-2 rounded-full"
                          style={{
                            width: `${Math.min(usagePercentage, 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Métricas */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Métricas
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2">
                          <p className="text-gray-500 dark:text-gray-400">
                            Intentos
                          </p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {code.validationAttempts || 0}
                          </p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-2">
                          <p className="text-gray-500 dark:text-gray-400">
                            Válidos
                          </p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {code.validationSuccesses || 0}
                          </p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-2">
                          <p className="text-gray-500 dark:text-gray-400">
                            Canjes
                          </p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {code.totalRedemptions || 0}
                          </p>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-2">
                          <p className="text-gray-500 dark:text-gray-400">
                            Descuento otorgado
                          </p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatPrice(code.totalDiscountGiven || 0)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                      {typeof code.minPurchaseAmount === "number" && (
                        <p>
                          Compra mínima: {formatPrice(code.minPurchaseAmount)}
                        </p>
                      )}
                      {typeof code.maxDiscountAmount === "number" && (
                        <p>
                          Tope de descuento:{" "}
                          {formatPrice(code.maxDiscountAmount)}
                        </p>
                      )}
                      <p>Creado: {formatDate(code.createdAt)}</p>
                      <p>Actualizado: {formatDate(code.updatedAt)}</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => handleCopyCode(code.code)}
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm"
                      >
                        <ClipboardDocumentIcon className="h-4 w-4" />
                        Copiar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleShareCode(code)}
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm"
                      >
                        <ShareIcon className="h-4 w-4" />
                        Compartir
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleToggleStatus(code.id, code.isActive)
                        }
                        className="px-3 py-2 bg-[#2391C3] hover:bg-[#1A6B8E] text-white rounded-lg text-sm"
                      >
                        {code.isActive ? "Desactivar" : "Activar"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteClick(code.id, code.code)}
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <ConfirmDialog
          isOpen={deleteDialog.isOpen}
          onClose={() =>
            setDeleteDialog({ isOpen: false, codeId: null, codeName: null })
          }
          onConfirm={confirmDelete}
          title="Eliminar código de descuento"
          message={`¿Seguro que deseas eliminar el código ${deleteDialog.codeName || ""}? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          confirmColor="red"
        />
      </div>
    </div>
  );
}
