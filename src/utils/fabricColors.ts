import type { FabricOption } from "@/types";

/**
 * Colores base predefinidos que siempre estarán disponibles
 */
export const BASE_FABRIC_COLORS: Omit<FabricOption, "id" | "stock">[] = [
  {
    name: "Azul Rey",
    imageUrl: "#1E40AF", // Color hexadecimal como placeholder
    priceModifier: 0,
  },
  {
    name: "Rosa Palo",
    imageUrl: "#CD1969",
    priceModifier: 0,
  },
  {
    name: "Negro",
    imageUrl: "#000000",
    priceModifier: 0,
  },
];

/**
 * Verifica si una tela es un color base (por el formato de imageUrl)
 */
export const isBaseColor = (imageUrl: string): boolean => {
  return imageUrl.startsWith("#");
};

/**
 * Genera un ID único para una opción de tela
 */
export const generateFabricId = (): string => {
  return `fabric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
