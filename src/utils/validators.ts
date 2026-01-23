import { z } from "zod";

// Validación para productos
export const productSchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(150, "El nombre es demasiado largo"),
  description: z
    .string()
    .min(10, "La descripción debe tener al menos 10 caracteres")
    .max(1000, "La descripción es demasiado larga"),
  basePrice: z
    .number()
    .min(0.01, "El precio debe ser mayor a 0")
    .max(999999, "El precio es demasiado alto"),
  category: z.string().min(1, "Selecciona al menos una categoría"), // Mantener por compatibilidad
  categories: z
    .array(z.string())
    .min(1, "Selecciona al menos una categoría")
    .optional(),
  isActive: z.boolean(),
});

// Validación para dirección de envío
export const addressSchema = z.object({
  fullName: z
    .string()
    .min(3, "El nombre completo es requerido")
    .max(100, "El nombre es demasiado largo")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras"),
  street: z
    .string()
    .min(5, "La dirección es requerida")
    .max(200, "La dirección es demasiado larga"),
  city: z
    .string()
    .min(2, "La ciudad es requerida")
    .max(50, "El nombre de la ciudad es demasiado largo")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "La ciudad solo puede contener letras"),
  state: z
    .string()
    .min(2, "El estado es requerido")
    .max(50, "El nombre del estado es demasiado largo")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El estado solo puede contener letras"),
  zipCode: z
    .string()
    .min(4, "Código postal inválido")
    .max(10, "Código postal inválido")
    .regex(/^\d{4,10}$/, "Código postal debe contener solo números"),
  country: z.string().default("México"),
  phone: z
    .string()
    .min(10, "El teléfono debe tener al menos 10 dígitos")
    .regex(/^[0-9\s\-\+\(\)]+$/, "Teléfono inválido")
    .transform((val) => val.replace(/[\s\-\(\)]/g, ""))
    .refine((val) => val.length >= 10, "Debe contener al menos 10 dígitos"),
});

// Validación para opciones de tela
export const fabricOptionSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre es requerido")
    .max(100, "El nombre es demasiado largo"),
  priceModifier: z
    .number()
    .min(-9999, "El modificador es demasiado bajo")
    .max(9999, "El modificador es demasiado alto"),
  stock: z
    .number()
    .int("El stock debe ser un número entero")
    .min(0, "El stock debe ser 0 o mayor")
    .max(99999, "El stock es demasiado alto"),
});

// Validación para categorías
export const categorySchema = z.object({
  name: z
    .string()
    .min(2, "El nombre es requerido")
    .max(100, "El nombre es demasiado largo")
    .regex(
      /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/,
      "El nombre contiene caracteres no válidos",
    ),
  description: z
    .string()
    .min(10, "La descripción es requerida")
    .max(500, "La descripción es demasiado larga"),
  order: z
    .number()
    .int("El orden debe ser un número entero")
    .min(0, "El orden debe ser 0 o mayor"),
});

// Validación de email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validación de teléfono mexicano
export const isValidMexicanPhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};
