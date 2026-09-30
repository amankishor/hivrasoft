import {
  ApiError,
  apiFetch,
  requestLogin,
} from "@/lib/api";

/* =========================================================
   TYPES
========================================================= */

export type WishlistImage =
  | string
  | {
      url?: string;
      isDefault?: boolean;
    };

export type WishlistProduct = {
  _id?: string;
  id?: string;

  name?: string;
  nameProduct?: string;

  slug?: string;
  slugProduct?: string;

  showPrice?: number;
  originalPrice?: number;

  price?: number;
  compareAtPrice?: number;

  mainImages?: WishlistImage[];

  colors?: Array<{
    _id?: string;

    nameColor?: string;

    nameProduct?: string;
    slugProduct?: string;

    showPrice?: number;
    originalPrice?: number;

    isDefault?: boolean;

    images?: WishlistImage[];
  }>;
};

export type WishlistItem = {
  _id?: string;

  product?:
    | string
    | WishlistProduct;

  productId?:
    | string
    | WishlistProduct;

  addedAt?: string;
};

/* =========================================================
   API ERROR
========================================================= */

function handleApiError(
  error: unknown
): never {
  if (
    error instanceof ApiError &&
    (error.status === 401 ||
      error.status === 403)
  ) {
    requestLogin();
  }

  throw error;
}

/* =========================================================
   EXTRACT ITEMS

   GET wishlist response exact shape
   change ho to bhi common shapes handle honge.
========================================================= */

export function extractWishlistItems(
  data: any
): WishlistItem[] {
  if (
    Array.isArray(data)
  ) {
    return data;
  }

  if (
    Array.isArray(
      data?.items
    )
  ) {
    return data.items;
  }

  if (
    Array.isArray(
      data?.wishlist
    )
  ) {
    return data.wishlist;
  }

  if (
    Array.isArray(
      data?.wishlist?.items
    )
  ) {
    return data.wishlist.items;
  }

  if (
    Array.isArray(
      data?.data
    )
  ) {
    return data.data;
  }

  if (
    Array.isArray(
      data?.data?.items
    )
  ) {
    return data.data.items;
  }

  if (
    Array.isArray(
      data?.data?.wishlist
    )
  ) {
    return data.data.wishlist;
  }

  if (
    Array.isArray(
      data?.data?.wishlist?.items
    )
  ) {
    return data.data.wishlist.items;
  }

  return [];
}

/* =========================================================
   PRODUCT ID
========================================================= */

export function getWishlistProductId(
  item: WishlistItem
): string {
  const source =
    item.product ??
    item.productId;

  if (
    typeof source ===
    "string"
  ) {
    return source;
  }

  return String(
    source?._id ||
      source?.id ||
      ""
  );
}

/* =========================================================
   GET WISHLIST
========================================================= */

export async function getWishlist(): Promise<
  WishlistItem[]
> {
  try {
    const data =
      await apiFetch<any>(
        "/api/wishlist",
        {
          method: "GET",
        }
      );

    return extractWishlistItems(
      data
    );
  } catch (error) {
    return handleApiError(
      error
    );
  }
}

/* =========================================================
   CHECK
========================================================= */

export async function checkWishlist(
  productId: string
): Promise<boolean> {
  try {
    const response =
      await apiFetch<any>(
        `/api/wishlist/check/${encodeURIComponent(
          productId
        )}`,
        {
          method: "GET",
        }
      );

    return Boolean(
      response?.inWishlist ??
        response?.isWishlisted ??
        response?.wishlisted ??
        response?.exists ??
        response?.data
          ?.inWishlist ??
        response?.data
          ?.isWishlisted ??
        response?.data
          ?.exists ??
        false
    );
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 401 ||
        error.status === 403)
    ) {
      return false;
    }

    throw error;
  }
}

/* =========================================================
   ADD
========================================================= */

export async function addToWishlist(
  productId: string
): Promise<unknown> {
  try {
    return await apiFetch(
      "/api/wishlist",
      {
        method: "POST",

        body: {
          productId,
        },
      }
    );
  } catch (error) {
    return handleApiError(
      error
    );
  }
}

/* =========================================================
   REMOVE
========================================================= */

export async function removeFromWishlist(
  productId: string
): Promise<unknown> {
  try {
    return await apiFetch(
      `/api/wishlist/${encodeURIComponent(
        productId
      )}`,
      {
        method: "DELETE",
      }
    );
  } catch (error) {
    return handleApiError(
      error
    );
  }
}

/* =========================================================
   CLEAR
========================================================= */

export async function clearWishlist(): Promise<unknown> {
  try {
    return await apiFetch(
      "/api/wishlist",
      {
        method: "DELETE",
      }
    );
  } catch (error) {
    return handleApiError(
      error
    );
  }
}

/* =========================================================
   EVENT
========================================================= */

export function notifyWishlistUpdated() {
  if (
    typeof window !==
    "undefined"
  ) {
    window.dispatchEvent(
      new Event(
        "hivrasoft-wishlist-updated"
      )
    );
  }
}