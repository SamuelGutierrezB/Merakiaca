import type { FabricOption } from "@/types";

export const ROSA_COLOR_NAME = "Rosa";
export const ROSA_COLOR_HEX = "#CD1969";

const LEGACY_ROSA_PALO_NAME = "rosa palo";
const LEGACY_ROSA_PALO_HEX = "#F9A8D4";

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
    name: ROSA_COLOR_NAME,
    imageUrl: ROSA_COLOR_HEX,
    priceModifier: 0,
  },
  {
    name: "Negro",
    imageUrl: "#000000",
    priceModifier: 0,
  },
];

const normalizeHex = (value: string): string => value.trim().toUpperCase();

/**
 * Compatibilidad con productos legacy que guardaron "Rosa Palo" o su hex anterior.
 */
export const normalizeFabricOption = (fabric: FabricOption): FabricOption => {
  const normalizedName = fabric.name.trim().toLowerCase();
  const normalizedHex = normalizeHex(fabric.imageUrl);

  const shouldMigrateRosa =
    normalizedName === LEGACY_ROSA_PALO_NAME ||
    normalizedHex === LEGACY_ROSA_PALO_HEX;

  if (!shouldMigrateRosa) {
    return fabric;
  }

  return {
    ...fabric,
    name: ROSA_COLOR_NAME,
    imageUrl: ROSA_COLOR_HEX,
  };
};

export const normalizeFabricOptions = (
  fabrics: FabricOption[],
): FabricOption[] => fabrics.map(normalizeFabricOption);

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
