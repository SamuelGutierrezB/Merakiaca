import { Timestamp } from "firebase/firestore";

export interface FabricOption {
  id: string;
  name: string;
  imageUrl: string;
  priceModifier: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  mainImage: string;
  images: string[];
  fabrics: FabricOption[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

export interface ProductFormData {
  name: string;
  description: string;
  basePrice: number;
  category: string;
  isActive: boolean;
}
