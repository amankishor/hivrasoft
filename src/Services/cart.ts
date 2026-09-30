import {
  ApiError,
  apiFetch,
  requestLogin,
} from "@/lib/api";

/* =========================================================
   TYPES
========================================================= */

export type CartImage =
  | string
  | {
      url?: string;
      publicId?: string;
      isDefault?: boolean;
    };

export type CartProduct = {
  _id?: string;
  id?: string;

  name?: string;
  nameProduct?: string;

  slug?: string;
  slugProduct?: string;

  price?: number;
  showPrice?: number;

  originalPrice?: number;
  compareAtPrice?: number;

  stock?: number;

  mainImages?: CartImage[];

  status?: string;
  isActive?: boolean;
};

export type CartColor = {
  _id?: string;
  id?: string;

  name?: string;
  nameColor?: string;

  slug?: string;
  slugColor?: string;

  nameProduct?: string;
  slugProduct?: string;

  showPrice?: number;
  originalPrice?: number;

  hex?: string;

  images?: CartImage[];

  isActive?: boolean;
};

export type CartSize = {
  _id?: string;
  id?: string;

  size?: string;
  name?: string;

  sku?: string;

  stock?: number;

  showPrice?: number;
  originalPrice?: number;

  isActive?: boolean;
};

export type CartItem = {
  _id: string;

  product:
    | string
    | CartProduct;

  colorId?: string;
  sizeId?: string;

  selectedColor?: CartColor;
  selectedSize?: CartSize;

  quantity: number;

  unitPrice: number;
  subtotal: number;

  availableStock?: number;
  available?: boolean;

  addedAt?: string;
};

export type CartData = {
  _id?: string;

  user?: string;

  items: CartItem[];

  totalItems: number;

  subtotal: number;
};

export type CartResponse = {
  success: boolean;

  message?: string;

  count?: number;

  cart: CartData;
};

export type CartCountResponse = {
  success: boolean;
  count: number;
};

export type AddToCartInput = {
  productId: string;

  colorId: string;

  sizeId: string;

  quantity: number;
};

/* =========================================================
   AUTH ERROR
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
   ADD TO CART
========================================================= */

export async function addToCart(
  input: AddToCartInput
): Promise<CartResponse> {
  try {
    return await apiFetch<CartResponse>(
      "/api/cart",
      {
        method: "POST",

        body: {
          productId:
            input.productId,

          colorId:
            input.colorId,

          sizeId:
            input.sizeId,

          quantity:
            input.quantity,
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
   GET CART
========================================================= */

export async function getCart(): Promise<CartResponse> {
  try {
    return await apiFetch<CartResponse>(
      "/api/cart",
      {
        method: "GET",
      }
    );
  } catch (error) {
    return handleApiError(
      error
    );
  }
}

/* =========================================================
   CART COUNT
========================================================= */

export async function getCartCount(): Promise<number> {
  try {
    const response =
      await apiFetch<CartCountResponse>(
        "/api/cart/count",
        {
          method: "GET",
        }
      );

    return Number(
      response.count || 0
    );
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 401 ||
        error.status === 403)
    ) {
      return 0;
    }

    console.error(
      "[CART COUNT]",
      error
    );

    return 0;
  }
}

/* =========================================================
   UPDATE QUANTITY
========================================================= */

export async function updateCartItemQuantity(
  cartItemId: string,
  quantity: number
): Promise<CartResponse> {
  try {
    return await apiFetch<CartResponse>(
      `/api/cart/${encodeURIComponent(
        cartItemId
      )}`,
      {
        method: "PATCH",

        body: {
          quantity,
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
   REMOVE ITEM
========================================================= */

export async function removeCartItem(
  cartItemId: string
): Promise<unknown> {
  try {
    return await apiFetch(
      `/api/cart/${encodeURIComponent(
        cartItemId
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
   CLEAR CART
========================================================= */

export async function clearCart(): Promise<unknown> {
  try {
    return await apiFetch(
      "/api/cart",
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
   REFRESH HEADER BADGE
========================================================= */

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