/* =========================================================
   API
========================================================= */

const RAW_API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:5000";

const API_URL =
  RAW_API_URL.replace(/\/api$/i, "");

/* =========================================================
   GUEST WISHLIST

   sessionStorage:
   - refresh par rahega
   - login hone tak rahega
   - browser/tab close hone par remove
========================================================= */

const GUEST_WISHLIST_KEY =
  "hivrasoft_pending_wishlist_v1";

/* =========================================================
   TYPES
========================================================= */

export type AddToCartPayload = {
  productId: string;
  colorId: string;
  sizeId: string;
  quantity: number;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  count?: number;

  [key: string]: unknown;
};

export type PendingWishlistSyncResult = {
  synced: number;
  remaining: number;
};

/* =========================================================
   JSON
========================================================= */

async function safeJson(
  response: Response
): Promise<ApiResponse> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

/* =========================================================
   LOGIN MODAL
========================================================= */

export function requestStoreLogin() {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.dispatchEvent(
    new Event(
      "hivrasoft-auth-required"
    )
  );
}

/* =========================================================
   AUTH CHECK
========================================================= */

export async function checkLoggedIn(): Promise<boolean> {
  try {
    const response =
      await fetch(
        `${API_URL}/api/auth/me`,
        {
          method: "GET",

          credentials:
            "include",

          cache:
            "no-store",

          headers: {
            Accept:
              "application/json",
          },
        }
      );

    return response.ok;
  } catch {
    return false;
  }
}

/* =========================================================
   READ GUEST WISHLIST
========================================================= */

export function getPendingWishlistIds(): string[] {
  if (
    typeof window ===
    "undefined"
  ) {
    return [];
  }

  try {
    const raw =
      window.sessionStorage.getItem(
        GUEST_WISHLIST_KEY
      );

    if (
      !raw
    ) {
      return [];
    }

    const parsed =
      JSON.parse(raw);

    if (
      !Array.isArray(parsed)
    ) {
      return [];
    }

    return Array.from(
      new Set(
        parsed
          .map(
            (value) =>
              String(value || "")
                .trim()
          )
          .filter(Boolean)
      )
    );
  } catch {
    return [];
  }
}

/* =========================================================
   SAVE ARRAY
========================================================= */

function savePendingWishlistIds(
  ids: string[]
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  const unique =
    Array.from(
      new Set(
        ids
          .map(
            (id) =>
              String(id || "")
                .trim()
          )
          .filter(Boolean)
      )
    );

  try {
    if (
      unique.length ===
      0
    ) {
      window.sessionStorage.removeItem(
        GUEST_WISHLIST_KEY
      );
    } else {
      window.sessionStorage.setItem(
        GUEST_WISHLIST_KEY,
        JSON.stringify(
          unique
        )
      );
    }
  } catch {
    // sessionStorage unavailable
  }

  window.dispatchEvent(
    new Event(
      "hivrasoft-pending-wishlist-updated"
    )
  );
}

/* =========================================================
   CHECK GUEST ITEM
========================================================= */

export function isPendingWishlistProduct(
  productId: string
): boolean {
  return getPendingWishlistIds().includes(
    String(
      productId || ""
    )
  );
}

/* =========================================================
   ADD GUEST ITEM
========================================================= */

export function addPendingWishlistProduct(
  productId: string
) {
  const id =
    String(
      productId || ""
    ).trim();

  if (
    !id
  ) {
    return;
  }

  const ids =
    getPendingWishlistIds();

  if (
    ids.includes(id)
  ) {
    return;
  }

  savePendingWishlistIds([
    ...ids,
    id,
  ]);
}

/* =========================================================
   REMOVE GUEST ITEM
========================================================= */

export function removePendingWishlistProduct(
  productId: string
) {
  const id =
    String(
      productId || ""
    );

  savePendingWishlistIds(
    getPendingWishlistIds().filter(
      (item) =>
        item !== id
    )
  );
}

/* =========================================================
   TOGGLE GUEST ITEM
========================================================= */

export function togglePendingWishlistProduct(
  productId: string
): boolean {
  const id =
    String(
      productId || ""
    ).trim();

  if (
    !id
  ) {
    return false;
  }

  const exists =
    isPendingWishlistProduct(
      id
    );

  if (
    exists
  ) {
    removePendingWishlistProduct(
      id
    );

    return false;
  }

  addPendingWishlistProduct(
    id
  );

  return true;
}

/* =========================================================
   ADD BACKEND WISHLIST
========================================================= */

export async function addProductToWishlist(
  productId: string
): Promise<ApiResponse> {
  const response =
    await fetch(
      `${API_URL}/api/wishlist`,
      {
        method: "POST",

        credentials:
          "include",

        headers: {
          Accept:
            "application/json",

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            productId,
          }),
      }
    );

  const data =
    await safeJson(
      response
    );

  if (
    response.status === 401 ||
    response.status === 403
  ) {
    throw new Error(
      "Please log in first."
    );
  }

  /*
   * Already wishlist me hai.
   * Error mat maano.
   */

  if (
    response.status === 409
  ) {
    return data;
  }

  if (
    !response.ok
  ) {
    throw new Error(
      typeof data.message ===
        "string"
        ? data.message
        : "Unable to add product to wishlist."
    );
  }

  return data;
}

/* =========================================================
   REMOVE BACKEND WISHLIST
========================================================= */

export async function removeProductFromWishlist(
  productId: string
): Promise<ApiResponse> {
  const response =
    await fetch(
      `${API_URL}/api/wishlist/${encodeURIComponent(
        productId
      )}`,
      {
        method:
          "DELETE",

        credentials:
          "include",

        headers: {
          Accept:
            "application/json",
        },
      }
    );

  const data =
    await safeJson(
      response
    );

  if (
    response.status === 401 ||
    response.status === 403
  ) {
    throw new Error(
      "Please log in first."
    );
  }

  if (
    !response.ok
  ) {
    throw new Error(
      typeof data.message ===
        "string"
        ? data.message
        : "Unable to remove product from wishlist."
    );
  }

  return data;
}

/* =========================================================
   CHECK BACKEND WISHLIST
========================================================= */

export async function checkProductWishlist(
  productId: string
): Promise<boolean> {
  try {
    const response =
      await fetch(
        `${API_URL}/api/wishlist/check/${encodeURIComponent(
          productId
        )}`,
        {
          method:
            "GET",

          credentials:
            "include",

          cache:
            "no-store",

          headers: {
            Accept:
              "application/json",
          },
        }
      );

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      return false;
    }

    if (
      !response.ok
    ) {
      return false;
    }

    const data: any =
      await safeJson(
        response
      );

    return Boolean(
      data?.inWishlist ??
        data?.isWishlisted ??
        data?.wishlisted ??
        data?.exists ??
        data?.data
          ?.inWishlist ??
        data?.data
          ?.isWishlisted ??
        data?.data
          ?.wishlisted ??
        data?.data
          ?.exists ??
        false
    );
  } catch {
    return false;
  }
}

/* =========================================================
   SYNC TEMP WISHLIST AFTER LOGIN

   Guest:
   [product1, product2]

   Login successful
        ↓

   POST /api/wishlist
   POST /api/wishlist

        ↓

   sessionStorage clear
========================================================= */

export async function syncPendingWishlist(): Promise<PendingWishlistSyncResult> {
  const pending =
    getPendingWishlistIds();

  if (
    pending.length ===
    0
  ) {
    return {
      synced: 0,
      remaining: 0,
    };
  }

  const loggedIn =
    await checkLoggedIn();

  if (
    !loggedIn
  ) {
    return {
      synced: 0,
      remaining:
        pending.length,
    };
  }

  const remaining:
    string[] = [];

  let synced = 0;

  for (
    const productId of pending
  ) {
    try {
      await addProductToWishlist(
        productId
      );

      synced += 1;
    } catch (
      error
    ) {
      /*
       * Agar auth expired ho gaya,
       * remaining products cache me rakho.
       */

      if (
        error instanceof Error &&
        error.message ===
          "Please log in first."
      ) {
        remaining.push(
          productId
        );

        continue;
      }

      /*
       * Network/server error =>
       * ID delete nahi karenge.
       */

      remaining.push(
        productId
      );
    }
  }

  savePendingWishlistIds(
    remaining
  );

  if (
    synced > 0
  ) {
    notifyWishlistUpdated();
  }

  return {
    synced,
    remaining:
      remaining.length,
  };
}

/* =========================================================
   CART
   NO GUEST CACHE.
========================================================= */

export async function addProductToCart(
  payload: AddToCartPayload
): Promise<ApiResponse> {
  const response =
    await fetch(
      `${API_URL}/api/cart`,
      {
        method:
          "POST",

        credentials:
          "include",

        headers: {
          Accept:
            "application/json",

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            productId:
              payload.productId,

            colorId:
              payload.colorId,

            sizeId:
              payload.sizeId,

            quantity:
              payload.quantity,
          }),
      }
    );

  const data =
    await safeJson(
      response
    );

  if (
    response.status === 401 ||
    response.status === 403
  ) {
    throw new Error(
      "Please log in first."
    );
  }

  if (
    !response.ok
  ) {
    throw new Error(
      typeof data.message ===
        "string"
        ? data.message
        : "Unable to add product to cart."
    );
  }

  return data;
}

/* =========================================================
   CART COUNT
========================================================= */

export async function getCartCount(): Promise<number> {
  try {
    const response =
      await fetch(
        `${API_URL}/api/cart/count`,
        {
          method:
            "GET",

          credentials:
            "include",

          cache:
            "no-store",

          headers: {
            Accept:
              "application/json",
          },
        }
      );

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      return 0;
    }

    if (
      !response.ok
    ) {
      return 0;
    }

    const data =
      await safeJson(
        response
      );

    const count =
      Number(
        data.count || 0
      );

    return Number.isFinite(
      count
    )
      ? count
      : 0;
  } catch {
    return 0;
  }
}

/* =========================================================
   EVENTS
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

export function notifyCartUpdated() {
  if (
    typeof window !==
    "undefined"
  ) {
    window.dispatchEvent(
      new Event(
        "hivrasoft-cart-updated"
      )
    );
  }
}