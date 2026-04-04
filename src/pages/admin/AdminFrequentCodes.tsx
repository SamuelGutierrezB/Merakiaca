import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Timestamp } from "firebase/firestore";
import {
  ClipboardDocumentIcon,
  ShareIcon,
  TrashIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import type { FrequentCustomerCode } from "@/types";
import {
  getAllFrequentCustomerCodes,
  createFrequentCustomerCode,
  deleteFrequentCustomerCode,
  toggleFrequentCustomerCodeStatus,
} from "@/services/frequentCustomer.service";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import AdminJoyride from "@/components/admin/AdminJoyride";

export default function AdminFrequentCodes() {
  const navigate = useNavigate();
  const [codes, setCodes] = useState<FrequentCustomerCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [maxUses, setMaxUses] = useState(100);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    codeId: string | null;
    codeName: string | null;
  }>({ isOpen: false, codeId: null, codeName: null });

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    try {
      setIsLoading(true);
      const data = await getAllFrequentCustomerCodes();
      // Ordenar por fecha de creación, más recientes primero
      const sorted = data.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      setCodes(sorted);
    } catch (error) {
      toast.error("Error al cargar códigos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCode.trim()) {
      toast.error("Ingresa un código");
      return;
    }

    if (maxUses < 1) {
      toast.error("Los usos máximos deben ser al menos 1");
      return;
    }

    setIsCreating(true);
    try {
      await createFrequentCustomerCode(newCode, maxUses);
      toast.success("Código creado exitosamente");
      setNewCode("");
      setMaxUses(100);
      setShowCreateForm(false);
      loadCodes();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Error al crear código",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Código copiado al portapapeles");
    } catch (error) {
      toast.error("Error al copiar el código");
    }
  };

  const handleShareCode = async (code: string) => {
    const message = `Codigo de Cliente Frecuente de Merakiaca\n\nCodigo: ${code}\n\nUsa este codigo para dejar resenas sin necesidad de haber comprado el producto.\n\nGracias por ser parte de nuestra comunidad!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Código de Cliente Frecuente - Merakiaca",
          text: message,
        });
      } catch (error) {
        // Error silenciado
      }
    } else {
      // Fallback: copiar al portapapeles
      try {
        await navigator.clipboard.writeText(message);
        toast.success("Mensaje copiado al portapapeles");
      } catch (error) {
        toast.error("Error al compartir");
      }
    }
  };

  const handleShareWhatsApp = (code: string) => {
    const message = `*Codigo de Cliente Frecuente de Merakiaca*\n\n*Codigo:* ${code}\n\nUsa este codigo para dejar resenas sin necesidad de haber comprado el producto.\n\nGracias por ser parte de nuestra comunidad!`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    window.open(whatsappUrl, "_blank");
  };

  const handleDeleteClick = (codeId: string, codeName: string) => {
    setDeleteDialog({ isOpen: true, codeId, codeName });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.codeId) return;

    try {
      await deleteFrequentCustomerCode(deleteDialog.codeId);
      toast.success("Código eliminado");
      loadCodes();
    } catch (error) {
      toast.error("Error al eliminar el código");
    }
  };

  const handleToggleStatus = async (codeId: string, currentStatus: boolean) => {
    try {
      await toggleFrequentCustomerCodeStatus(codeId, !currentStatus);
      toast.success(currentStatus ? "Código desactivado" : "Código activado");
      loadCodes();
    } catch (error) {
      toast.error("Error al cambiar el estado");
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
    return (currentUses / maxUses) * 100;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-50 dark:bg-red-900/300";
    if (percentage >= 70) return "bg-yellow-50 dark:bg-yellow-900/300";
    return "bg-green-50 dark:bg-green-900/300";
  };

  return (
    <>
      <AdminJoyride page="frequent-codes" />
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Botón atrás */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:text-gray-100 transition-colors"
              data-tour="codes-back"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="hidden sm:inline">
                Volver al Panel de Administración
              </span>
            </button>
          </div>

          {/* Header */}
          <div
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            data-tour="codes-header"
          >
            <div>
              <h1
                className="text-3xl font-bold text-gray-800 dark:text-gray-100"
                data-tour="codes-title"
              >
                Códigos de Cliente Frecuente
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Gestiona los códigos para que clientes frecuentes puedan
                comentar productos
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-[#2391C3] hover:bg-[#1A6B8E] text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
              data-tour="codes-create"
            >
              <PlusIcon className="h-5 w-5" />
              Crear Código
            </button>
          </div>

          {/* Formulario de creación */}
          {showCreateForm && (
            <div
              className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
              data-tour="codes-form"
            >
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                Crear Nuevo Código
              </h2>
              <form onSubmit={handleCreateCode} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Código *
                    </label>
                    <input
                      type="text"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                      placeholder="Ej: CLIENTE2024"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2391C3] focus:border-transparent uppercase"
                      maxLength={20}
                      disabled={isCreating}
                      required
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">
                      Máximo 20 caracteres, solo letras y números
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      Usos Máximos *
                    </label>
                    <input
                      type="number"
                      value={maxUses}
                      onChange={(e) =>
                        setMaxUses(parseInt(e.target.value) || 0)
                      }
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#2391C3] focus:border-transparent"
                      disabled={isCreating}
                      required
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">
                      Número de usuarios que pueden usar este código
                    </p>
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
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewCode("");
                      setMaxUses(100);
                    }}
                    className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-700 dark:text-gray-200 px-6 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lista de códigos */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#2391C3] border-t-transparent mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-300 mt-4">Cargando códigos...</p>
            </div>
          ) : codes.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-lg">
                No hay códigos de cliente frecuente aún
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 text-[#2391C3] hover:underline font-medium"
              >
                Crear el primer código →
              </button>
            </div>
          ) : (
            <div
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              data-tour="codes-list"
            >
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
                    {/* Header del código */}
                    <div className="bg-gradient-to-r from-[#2391C3] to-[#1A6B8E] p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-white mb-1">
                            {code.code}
                          </h3>
                          <p className="text-white/80 text-sm">
                            Creado: {formatDate(code.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {code.isActive ? (
                            <span className="flex items-center gap-1 bg-green-50 dark:bg-green-900/300 text-white px-3 py-1 rounded-full text-xs font-semibold">
                              <CheckCircleIcon className="h-4 w-4" />
                              Activo
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 bg-red-50 dark:bg-red-900/300 text-white px-3 py-1 rounded-full text-xs font-semibold">
                              <XCircleIcon className="h-4 w-4" />
                              Inactivo
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cuerpo */}
                    <div className="p-4 space-y-4">
                      {/* Estadísticas */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">Usos:</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-100">
                            {code.currentUses} / {code.maxUses}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${getUsageColor(usagePercentage)}`}
                            style={{ width: `${usagePercentage}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                          {code.usedBy.length} usuario(s) han usado este código
                        </p>
                      </div>

                      {/* Acciones */}
                      <div
                        className="grid grid-cols-3 gap-2"
                        data-tour="codes-actions"
                      >
                        <button
                          onClick={() => handleCopyCode(code.code)}
                          className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg transition-colors text-sm"
                        >
                          <ClipboardDocumentIcon className="h-4 w-4" />
                          Copiar
                        </button>
                        <button
                          onClick={() => handleShareCode(code.code)}
                          className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg transition-colors text-sm"
                        >
                          <ShareIcon className="h-4 w-4" />
                          Compartir
                        </button>
                        <button
                          onClick={() => handleShareWhatsApp(code.code)}
                          className="flex items-center justify-center gap-2 bg-green-100 dark:bg-green-900/40 hover:bg-green-200 dark:hover:bg-green-800/60 text-green-700 dark:text-green-300 px-4 py-2 rounded-lg transition-colors text-sm"
                        >
                          <ChatBubbleLeftRightIcon className="h-4 w-4" />
                          WhatsApp
                        </button>
                        <button
                          onClick={() =>
                            handleToggleStatus(code.id, code.isActive)
                          }
                          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm col-span-2 ${
                            code.isActive
                              ? "bg-yellow-100 dark:bg-yellow-900/40 hover:bg-yellow-200 dark:hover:bg-yellow-800/60 text-yellow-700 dark:text-yellow-300"
                              : "bg-green-100 dark:bg-green-900/40 hover:bg-green-200 dark:hover:bg-green-800/60 text-green-700 dark:text-green-300"
                          }`}
                        >
                          {code.isActive ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          onClick={() => handleDeleteClick(code.id, code.code)}
                          className="flex items-center justify-center gap-2 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-800/60 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg transition-colors text-sm"
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

          {/* Diálogo de confirmación */}
          <ConfirmDialog
            isOpen={deleteDialog.isOpen}
            onClose={() =>
              setDeleteDialog({ isOpen: false, codeId: null, codeName: null })
            }
            onConfirm={confirmDelete}
            title="Eliminar Código"
            message={`¿Estás seguro de eliminar el código "${deleteDialog.codeName}"? Esta acción no se puede deshacer.`}
            confirmText="Eliminar"
            cancelText="Cancelar"
          />
        </div>
      </div>
    </>
  );
}
