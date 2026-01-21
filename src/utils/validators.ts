import { z } from "zod";

// Validación para productos
export const productSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z
    .string()
    .min(10, "La descripción debe tener al menos 10 caracteres"),
  basePrice: z.number().min(0, "El precio debe ser mayor a 0"),
  stock: z.number().int().min(0, "El stock debe ser 0 o mayor"),
  category: z.string().min(1, "Selecciona una categoría"),
  isActive: z.boolean(),
});

// Validación para dirección de envío
export const addressSchema = z.object({
  fullName: z.string().min(3, "El nombre completo es requerido"),
  street: z.string().min(5, "La dirección es requerida"),
  city: z.string().min(2, "La ciudad es requerida"),
  state: z.string().min(2, "El estado es requerido"),
  zipCode: z.string().regex(/^\d{5}$/, "Código postal inválido"),
  country: z.string().default("México"),
  phone: z.string().regex(/^\d{10}$/, "Teléfono debe tener 10 dígitos"),
});

// Validación para opciones de tela
export const fabricOptionSchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  priceModifier: z.number(),
  stock: z.number().int().min(0, "El stock debe ser 0 o mayor"),
});

// Validación para categorías
export const categorySchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  description: z.string().min(10, "La descripción es requerida"),
  order: z.number().int().min(0),
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
