import { useState, useId, useRef } from "react";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { uploadProductImage } from "@/services/storage.service";
import toast from "react-hot-toast";

interface ImageUploadProps {
  productId?: string;
  onImageUploaded: (imageUrl: string) => void;
  multiple?: boolean;
  label?: string;
  clearAfterUpload?: boolean;
}

export default function ImageUpload({
  productId,
  onImageUploaded,
  multiple = false,
  label = "Subir imagen",
  clearAfterUpload = false,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const file = files[0];

      // Validar tipo de archivo
      if (!file.type.startsWith("image/")) {
        toast.error("Por favor selecciona una imagen válida");
        return;
      }

      // Preview local
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Subir a Firebase Storage
      const imageUrl = await uploadProductImage(file, productId);
      onImageUploaded(imageUrl);
      toast.success("Imagen subida exitosamente");

      // Limpiar input y preview si se solicita (útil para galería de imágenes)
      if (clearAfterUpload) {
        setPreview(null);
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      }
    } catch (error) {
      console.error("Error al subir imagen:", error);
      toast.error("Error al subir la imagen");
      setPreview(null);
      // Limpiar input en caso de error
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } finally {
      setIsUploading(false);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
        {label}
      </label>

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
          />
          <button
            type="button"
            onClick={clearPreview}
            className="absolute top-2 right-2 bg-red-50 dark:bg-red-900/300 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-[#2391C3] transition-colors">
          <div className="space-y-2 text-center">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <div className="flex text-sm text-gray-600 dark:text-gray-300">
              <label
                htmlFor={inputId}
                className="relative cursor-pointer bg-white dark:bg-gray-900 rounded-md font-medium text-[#2391C3] hover:text-[#1A6B8E] focus-within:outline-none"
              >
                <span>Seleccionar archivo</span>
                <input
                  id={inputId}
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  multiple={multiple}
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="sr-only"
                />
              </label>
              <p className="pl-1">o arrastra aquí</p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
              PNG, JPG, WebP. La imagen se comprime automaticamente antes de
              subir.
            </p>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#2391C3] border-t-transparent"></div>
          <span className="ml-3 text-sm text-gray-600 dark:text-gray-300">
            Subiendo imagen...
          </span>
        </div>
      )}
    </div>
  );
}
