import { apiFetch } from "./api";
import type {
  Wishlist,
  WishlistApiResponse,
  WishlistCheckApiResponse,
} from "@/types/wishlist";

const EMPTY_WISHLIST: Wishlist = {
  items: [],
};

function notifyWishlistUpdated(wishlist?: Wishlist) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("hivrasoft-wishlist-updated", {
        detail: { count: wishlist?.items.length },
      }),
    );
  }
}

function requireWishlist(response: WishlistApiResponse): Wishlist {
  return response.wishlist || EMPTY_WISHLIST;
}

export async function getWishlist() {
  const response = await apiFetch<WishlistApiResponse>("/api/wishlist");
  return requireWishlist(response);
}

export async function addToWishlist(
  productId: string,
  variant?: { colorId?: string | null; sizeId?: string | null },
) {
  const response = await apiFetch<WishlistApiResponse>("/api/wishlist", {
    method: "POST",
    body: { productId, ...(variant || {}) },
  });
  const wishlist = requireWishlist(response);
  notifyWishlistUpdated(wishlist);
  return wishlist;
}

export async function removeFromWishlist(productId: string) {
  const response = await apiFetch<WishlistApiResponse>(
    `/api/wishlist/${encodeURIComponent(productId)}`,
    { method: "DELETE" },
  );
  const wishlist = requireWishlist(response);
  notifyWishlistUpdated(wishlist);
  return wishlist;
}

export async function clearWishlist() {
  const response = await apiFetch<WishlistApiResponse>("/api/wishlist", {
    method: "DELETE",
  });
  const wishlist = requireWishlist(response);
  notifyWishlistUpdated(wishlist);
  return wishlist;
}

export async function isWishlisted(productId: string) {
  const response = await apiFetch<WishlistCheckApiResponse>(
    `/api/wishlist/check/${encodeURIComponent(productId)}`,
  );
  return Boolean(response.isWishlisted);
}
