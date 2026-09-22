import type { Product } from "./product";

export type WishlistItem = {
  product: Product | null;
  addedAt?: string;
};

export type Wishlist = {
  _id?: string | null;
  user?: string;
  items: WishlistItem[];
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type WishlistApiResponse = {
  success: boolean;
  message?: string;
  count?: number;
  wishlist?: Wishlist;
};

export type WishlistCheckApiResponse = {
  success: boolean;
  message?: string;
  productId?: string;
  isWishlisted: boolean;
};
