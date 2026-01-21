import { useState, useId } from "react";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { uploadProductImage } from "@/services/storage.service";
import toast from "react-hot-toast";

interface ImageUploadProps {
  productId?: string;
  onImageUploaded: (imageUrl: string) => void;
  multiple?: boolean;
  label?: string;
}

export default function ImageUpload({
  productId,
  onImageUploaded,
  multiple = false,
  label = "Subir imagen",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputId = useId();

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

      // Validar tamaño (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imagen no debe superar los 5MB");
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
    } catch (error) {
      console.error("Error al subir imagen:", error);
      toast.error("Error al subir la imagen");
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const clearPreview = () => {
    setPreview(null);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border border-gray-300"
          />
          <button
            type="button"
            onClick={clearPreview}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-[#2391C3] transition-colors">
          <div className="space-y-2 text-center">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor={inputId}
                className="relative cursor-pointer bg-white rounded-md font-medium text-[#2391C3] hover:text-[#1A6B8E] focus-within:outline-none"
              >
                <span>Seleccionar archivo</span>
                <input
                  id={inputId}
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
            <p className="text-xs text-gray-500">PNG, JPG, WebP hasta 5MB</p>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#2391C3] border-t-transparent"></div>
          <span className="ml-3 text-sm text-gray-600">Subiendo imagen...</span>
        </div>
      )}
    </div>
  );
}
