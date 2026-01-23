export interface WishlistItem {
  productId: string;
  addedAt: Date;
}

export interface Wishlist {
  userId: string;
  items: WishlistItem[];
  updatedAt: Date;
}
