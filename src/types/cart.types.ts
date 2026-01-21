import { Timestamp } from "firebase/firestore";

export interface CartItem {
  productId: string;
  productName: string;
  productImage: string;
  fabricId: string;
  fabricName: string;
  quantity: number;
  priceAtAdd: number;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  updatedAt: Timestamp;
}

export interface CartStore {
  items: CartItem[];
  loading: boolean;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string, fabricId: string) => void;
  updateQuantity: (
    productId: string,
    fabricId: string,
    quantity: number,
  ) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}
