import { useState, useEffect, useCallback } from "react";
import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import type { Review } from "@/types";
import { useAuthStore } from "@/store/authStore";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
  getProductReviews,
  getUserProductReviews,
  createReview,
  deleteReview,
  getProductRating,
} from "@/services/reviews.service";
import { getUserOrders } from "@/services/orders.service";

interface ProductReviewsProps {
  productId: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [isLoadingPermission, setIsLoadingPermission] = useState(true);
  const [productRating, setProductRating] = useState({ average: 0, count: 0 });
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    reviewId: string | null;
  }>({ isOpen: false, reviewId: null });
  const { user } = useAuthStore();

  const loadReviews = useCallback(async () => {
    try {
      const data = await getProductReviews(productId);
      setReviews(data);
    } catch (error) {
      console.error("Error al cargar reseñas:", error);
    }
  }, [productId]);

  const loadUserReviews = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getUserProductReviews(user.uid, productId);
      setUserReviews(data);
    } catch (error) {
      console.error("Error al cargar reseñas del usuario:", error);
    }
  }, [user, productId]);

  const loadProductRating = useCallback(async () => {
    try {
      const data = await getProductRating(productId);
      setProductRating(data);
    } catch (error) {
      console.error("Error al cargar calificación:", error);
    }
  }, [productId]);

  const checkUserCanReview = useCallback(async () => {
    if (!user) {
      setCanReview(false);
      setIsLoadingPermission(false);
      return;
    }

    try {
      setIsLoadingPermission(true);

      // Verificar si el usuario ya tiene 3 reseñas para este producto
      const userReviewsData = await getUserProductReviews(user.uid, productId);
      if (userReviewsData.length >= 3) {
        setCanReview(false);
        setIsLoadingPermission(false);
        return;
      }

      // Verificar si el usuario ha comprado este producto
      const orders = await getUserOrders(user.uid);
      const hasPurchased = orders.some((order) =>
        order.items.some((item) => item.productId === productId),
      );

      setCanReview(hasPurchased);
    } catch (error) {
      console.error("Error al verificar permisos:", error);
      setCanReview(false);
    } finally {
      setIsLoadingPermission(false);
    }
  }, [user, productId]);

  useEffect(() => {
    loadReviews();
    loadProductRating();
    if (user) {
      checkUserCanReview();
      loadUserReviews();
    } else {
      setIsLoadingPermission(false);
    }
  }, [
    productId,
    user,
    loadReviews,
    loadProductRating,
    checkUserCanReview,
    loadUserReviews,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Debes iniciar sesión para dejar una reseña");
      return;
    }

    if (rating === 0) {
      toast.error("Selecciona una calificación");
      return;
    }

    if (comment.trim().length < 10) {
      toast.error("El comentario debe tener al menos 10 caracteres");
      return;
    }

    if (userReviews.length >= 3) {
      toast.error(
        "Ya has alcanzado el límite de 3 comentarios para este producto",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await createReview(productId, user.uid, user.displayName || "Usuario", {
        rating,
        comment: comment.trim(),
      });

      toast.success("¡Reseña publicada exitosamente!");
      setRating(0);
      setComment("");
      loadReviews();
      loadUserReviews();
      loadProductRating();
      checkUserCanReview();
    } catch (error) {
      console.error("Error al crear reseña:", error);
      toast.error("Error al publicar la reseña");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = (reviewId: string) => {
    setDeleteDialog({ isOpen: true, reviewId });
  };

  const confirmDeleteReview = async () => {
    if (!deleteDialog.reviewId) return;

    try {
      await deleteReview(deleteDialog.reviewId);
      toast.success("Reseña eliminada");
      loadReviews();
      loadUserReviews();
      loadProductRating();
      checkUserCanReview();
    } catch (error) {
      console.error("Error al eliminar reseña:", error);
      toast.error("Error al eliminar la reseña");
    }
  };

  const renderStars = (
    currentRating: number,
    interactive: boolean = false,
    size: string = "h-6 w-6",
  ) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = interactive
            ? star <= (hoveredRating || rating)
            : star <= currentRating;

          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && setRating(star)}
              onMouseEnter={() => interactive && setHoveredRating(star)}
              onMouseLeave={() => interactive && setHoveredRating(0)}
              className={
                interactive
                  ? "cursor-pointer transition-transform hover:scale-110"
                  : ""
              }
            >
              {isFilled ? (
                <StarIcon className={`${size} text-yellow-400`} />
              ) : (
                <StarOutlineIcon className={`${size} text-gray-300`} />
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const formatDate = (timestamp: { toDate: () => Date }) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Resumen de calificación */}
      <div className="border-t pt-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">
          Opiniones de clientes
        </h3>
        {productRating.count > 0 && (
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              {renderStars(productRating.average, false, "h-5 w-5")}
              <span className="text-lg font-semibold text-gray-700">
                {productRating.average.toFixed(1)}
              </span>
            </div>
            <span className="text-gray-500">
              ({productRating.count}{" "}
              {productRating.count === 1 ? "reseña" : "reseñas"})
            </span>
          </div>
        )}
      </div>

      {/* Formulario para agregar reseña */}
      {user && (
        <div className="bg-gray-50 p-6 rounded-lg">
          {isLoadingPermission ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#2391C3] border-t-transparent mx-auto"></div>
            </div>
          ) : canReview && userReviews.length < 3 ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800">
                Escribe una reseña
              </h4>
              <p className="text-sm text-gray-600">
                Has escrito {userReviews.length} de 3 reseñas permitidas para
                este producto
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calificación *
                </label>
                {renderStars(rating, true)}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comentario *
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2391C3] focus:border-transparent"
                  placeholder="Comparte tu experiencia con este producto..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {comment.length}/500 caracteres
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="bg-[#2391C3] hover:bg-[#1A6B8E] text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Publicando..." : "Publicar reseña"}
              </button>
            </form>
          ) : userReviews.length >= 3 ? (
            <div className="text-center py-4">
              <p className="text-gray-600">
                Ya has alcanzado el límite de 3 comentarios para este producto
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600">
                Debes comprar este producto para poder dejar una reseña
              </p>
            </div>
          )}
        </div>
      )}

      {!user && (
        <div className="bg-blue-50 p-6 rounded-lg text-center">
          <p className="text-gray-700">
            <a
              href="/login"
              className="text-[#2391C3] hover:underline font-semibold"
            >
              Inicia sesión
            </a>{" "}
            para dejar una reseña
          </p>
        </div>
      )}

      {/* Lista de reseñas */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Aún no hay reseñas para este producto. ¡Sé el primero en opinar!
          </p>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="border border-gray-200 rounded-lg p-4 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {renderStars(review.rating, false, "h-4 w-4")}
                  </div>
                  <p className="font-semibold text-gray-800">
                    {review.userName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(review.createdAt)}
                  </p>
                </div>
                {user && user.uid === review.userId && (
                  <button
                    onClick={() => handleDeleteReview(review.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Eliminar
                  </button>
                )}
              </div>
              <p className="text-gray-700">{review.comment}</p>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, reviewId: null })}
        onConfirm={confirmDeleteReview}
        title="Eliminar Reseña"
        message="¿Estás seguro de eliminar esta reseña? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
}
