"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Header from "@/src/components/Header/Header";

import {
  checkLoggedIn,
  notifyCartUpdated,
  requestStoreLogin,
} from "@/src/Services/storeActions";

/* =========================================================
   API
========================================================= */

const RAW_API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(
    /\/+$/,
    ""
  ) || "http://localhost:5000";

const API_URL =
  RAW_API_URL.replace(
    /\/api$/i,
    ""
  );

/* =========================================================
   TYPES
========================================================= */

type CartImage = {
  url?: string;
};

type CartProduct = {
  _id?: string;

  id?: string;

  name?: string;

  nameProduct?: string;

  slug?: string;

  slugProduct?: string;

  mainImages?: CartImage[];

  images?: CartImage[];
};

type CartColor = {
  _id?: string;

  id?: string;

  name?: string;

  nameColor?: string;

  slug?: string;

  slugColor?: string;

  images?: CartImage[];
};

type CartSize = {
  _id?: string;

  id?: string;

  size?: string;

  name?: string;

  stock?: number;
};

type CartItem = {
  _id?: string;

  id?: string;

  product?:
    | string
    | CartProduct;

  selectedColor?: CartColor;

  color?: CartColor;

  selectedSize?: CartSize;

  size?: CartSize;

  quantity?: number;

  unitPrice?: number;

  subtotal?: number;

  availableStock?: number;

  available?: boolean;
};

type CartState = {
  items: CartItem[];

  totalItems: number;

  subtotal: number;
};

/* =========================================================
   JSON
========================================================= */

async function readJson(
  response: Response
): Promise<any> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

/* =========================================================
   CART RESPONSE
========================================================= */

function extractCart(
  data: any
): CartState {
  const cart =
    data?.cart ||
    data?.data?.cart ||
    data?.data ||
    {};

  return {
    items:
      Array.isArray(
        cart?.items
      )
        ? cart.items
        : [],

    totalItems:
      Number(
        cart?.totalItems ??
          data?.count ??
          0
      ) || 0,

    subtotal:
      Number(
        cart?.subtotal ??
          0
      ) || 0,
  };
}

/* =========================================================
   ITEM ID
========================================================= */

function getCartItemId(
  item: CartItem
): string {
  return String(
    item._id ||
      item.id ||
      ""
  ).trim();
}

/* =========================================================
   IMAGE
========================================================= */

function getCartItemImage(
  item: CartItem
): string {
  const color =
    item.selectedColor ||
    item.color;

  const colorImage =
    color?.images?.find(
      (image) =>
        Boolean(
          image.url
        )
    )?.url;

  if (colorImage) {
    return colorImage;
  }

  if (
    typeof item.product !==
      "string" &&
    item.product
  ) {
    const product =
      item.product;

    const mainImage =
      product.mainImages?.find(
        (image) =>
          Boolean(
            image.url
          )
      )?.url;

    if (mainImage) {
      return mainImage;
    }

    const image =
      product.images?.find(
        (value) =>
          Boolean(
            value.url
          )
      )?.url;

    if (image) {
      return image;
    }
  }

  return "";
}

/* =========================================================
   PRODUCT NAME
========================================================= */

function getProductName(
  item: CartItem
): string {
  if (
    !item.product ||
    typeof item.product ===
      "string"
  ) {
    return "Product";
  }

  return (
    item.product.nameProduct ||
    item.product.name ||
    "Product"
  );
}

/* =========================================================
   PRODUCT SLUG
========================================================= */

function getProductSlug(
  item: CartItem
): string {
  if (
    !item.product ||
    typeof item.product ===
      "string"
  ) {
    return "";
  }

  return (
    item.product.slugProduct ||
    item.product.slug ||
    ""
  );
}

/* =========================================================
   CART PAGE
========================================================= */

export default function CartPage() {
  const [
    cart,
    setCart,
  ] =
    useState<CartState>({
      items: [],

      totalItems: 0,

      subtotal: 0,
    });

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    busyId,
    setBusyId,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    message,
    setMessage,
  ] =
    useState<string>("");

  /* =======================================================
     LOAD CART

     GET /api/cart
  ======================================================= */

  const loadCart =
    useCallback(
      async () => {
        setLoading(true);

        setMessage("");

        try {
          const loggedIn =
            await checkLoggedIn();

          if (!loggedIn) {
            requestStoreLogin();

            setCart({
              items: [],

              totalItems: 0,

              subtotal: 0,
            });

            return;
          }

          const response =
            await fetch(
              `${API_URL}/api/cart`,
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

          const data =
            await readJson(
              response
            );

          if (!response.ok) {
            throw new Error(
              data?.message ||
                "Unable to load cart."
            );
          }

          setCart(
            extractCart(
              data
            )
          );
        } catch (error) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to load cart."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    void loadCart();

    const refresh = () => {
      void loadCart();
    };

    window.addEventListener(
      "hivrasoft-cart-updated",
      refresh
    );

    return () => {
      window.removeEventListener(
        "hivrasoft-cart-updated",
        refresh
      );
    };
  }, [
    loadCart,
  ]);

  /* =======================================================
     UPDATE QUANTITY

     PATCH /api/cart/:cartItemId
  ======================================================= */

  async function updateQuantity(
    item: CartItem,
    nextQuantity: number
  ) {
    const cartItemId =
      getCartItemId(
        item
      );

    if (
      !cartItemId ||
      nextQuantity < 1
    ) {
      return;
    }

    setBusyId(
      cartItemId
    );

    setMessage("");

    try {
      const response =
        await fetch(
          `${API_URL}/api/cart/${encodeURIComponent(
            cartItemId
          )}`,
          {
            method:
              "PATCH",

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
                quantity:
                  nextQuantity,
              }),
          }
        );

      const data =
        await readJson(
          response
        );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to update quantity."
        );
      }

      await loadCart();

      notifyCartUpdated();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update cart."
      );
    } finally {
      setBusyId(
        null
      );
    }
  }

  /* =======================================================
     REMOVE

     DELETE /api/cart/:cartItemId
  ======================================================= */

  async function removeItem(
    item: CartItem
  ) {
    const cartItemId =
      getCartItemId(
        item
      );

    if (!cartItemId) {
      return;
    }

    setBusyId(
      cartItemId
    );

    setMessage("");

    try {
      const response =
        await fetch(
          `${API_URL}/api/cart/${encodeURIComponent(
            cartItemId
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
        await readJson(
          response
        );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to remove item."
        );
      }

      await loadCart();

      notifyCartUpdated();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to remove item."
      );
    } finally {
      setBusyId(
        null
      );
    }
  }

  /* =======================================================
     CLEAR CART

     DELETE /api/cart
  ======================================================= */

  async function clearCart() {
    setMessage("");

    try {
      const response =
        await fetch(
          `${API_URL}/api/cart`,
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
        await readJson(
          response
        );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to clear cart."
        );
      }

      setCart({
        items: [],

        totalItems: 0,

        subtotal: 0,
      });

      notifyCartUpdated();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to clear cart."
      );
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <Header />

      <main
        className="
          min-h-screen
          bg-[#F8F5F2]
          px-4
          py-10
          text-[#211A18]
          md:px-8
        "
      >
        <div
          className="
            mx-auto
            max-w-[1250px]
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              gap-4
            "
          >
            <div>
              <p
                className="
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.2em]
                  text-[#A91543]
                "
              >
                Hivra Soft
              </p>

              <h1
                className="
                  mt-2
                  text-[28px]
                  font-semibold
                  md:text-[34px]
                "
              >
                Shopping Bag
              </h1>
            </div>

            {cart.items.length >
              0 && (
              <button
                type="button"
                onClick={
                  clearCart
                }
                className="
                  rounded-full
                  border
                  border-[#A91543]/30
                  px-5
                  py-2.5
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.1em]
                  text-[#A91543]
                  hover:bg-[#A91543]
                  hover:text-white
                "
              >
                Clear Bag
              </button>
            )}
          </div>

          {message && (
            <div
              className="
                mt-6
                rounded-xl
                border
                border-red-200
                bg-red-50
                px-4
                py-3
                text-[12px]
                text-red-700
              "
            >
              {
                message
              }
            </div>
          )}

          {loading ? (
            <div
              className="
                mt-10
                rounded-2xl
                bg-white
                p-10
                text-center
              "
            >
              <p
                className="
                  text-[13px]
                  text-black/50
                "
              >
                Loading your bag...
              </p>
            </div>
          ) : cart.items.length ===
            0 ? (
            <div
              className="
                mt-10
                rounded-[20px]
                border
                border-[#211A18]/10
                bg-white
                p-12
                text-center
              "
            >
              <div
                className="
                  mx-auto
                  flex
                  h-16
                  w-16
                  items-center
                  justify-center
                  rounded-full
                  bg-[#EFE5DB]
                "
              >
                <svg
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <path d="M5 8h14l-1 13H6L5 8Z" />

                  <path d="M9 8V6a3 3 0 0 1 6 0v2" />
                </svg>
              </div>

              <h2
                className="
                  mt-5
                  text-[20px]
                  font-semibold
                "
              >
                Your bag is empty
              </h2>

              <p
                className="
                  mx-auto
                  mt-2
                  max-w-[360px]
                  text-[12px]
                  leading-6
                  text-black/50
                "
              >
                Add your favourite products and they will appear here.
              </p>

              <Link
                href="/men"
                className="
                  mt-6
                  inline-flex
                  rounded-full
                  bg-[#A91543]
                  px-7
                  py-3
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.1em]
                  text-white
                "
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div
              className="
                mt-8
                grid
                gap-7
                lg:grid-cols-[minmax(0,1fr)_350px]
              "
            >
              {/* ITEMS */}

              <div
                className="
                  space-y-4
                "
              >
                {cart.items.map(
                  (item) => {
                    const itemId =
                      getCartItemId(
                        item
                      );

                    const image =
                      getCartItemImage(
                        item
                      );

                    const productName =
                      getProductName(
                        item
                      );

                    const slug =
                      getProductSlug(
                        item
                      );

                    const selectedColor =
                      item.selectedColor ||
                      item.color;

                    const selectedSize =
                      item.selectedSize ||
                      item.size;

                    const quantity =
                      Number(
                        item.quantity ||
                          1
                      );

                    const availableStock =
                      Number(
                        item.availableStock ??
                          selectedSize?.stock ??
                          0
                      );

                    const unitPrice =
                      Number(
                        item.unitPrice ||
                          0
                      );

                    const subtotal =
                      Number(
                        item.subtotal ||
                          unitPrice *
                            quantity
                      );

                    const busy =
                      busyId ===
                      itemId;

                    return (
                      <article
                        key={
                          itemId
                        }
                        className="
                          flex
                          gap-4
                          rounded-[18px]
                          border
                          border-[#211A18]/10
                          bg-white
                          p-4
                          md:gap-6
                          md:p-5
                        "
                      >
                        <div
                          className="
                            h-[150px]
                            w-[112px]
                            shrink-0
                            overflow-hidden
                            rounded-[12px]
                            bg-[#EFE5DB]
                            md:h-[180px]
                            md:w-[135px]
                          "
                        >
                          {image ? (
                            <img
                              src={
                                image
                              }
                              alt={
                                productName
                              }
                              className="
                                h-full
                                w-full
                                object-cover
                              "
                            />
                          ) : null}
                        </div>

                        <div
                          className="
                            flex
                            min-w-0
                            flex-1
                            flex-col
                          "
                        >
                          {slug ? (
                            <Link
                              href={`/product/${slug}`}
                              className="
                                line-clamp-2
                                text-[14px]
                                font-semibold
                                hover:text-[#A91543]
                                md:text-[16px]
                              "
                            >
                              {
                                productName
                              }
                            </Link>
                          ) : (
                            <p
                              className="
                                text-[14px]
                                font-semibold
                              "
                            >
                              {
                                productName
                              }
                            </p>
                          )}

                          <div
                            className="
                              mt-3
                              flex
                              flex-wrap
                              gap-x-5
                              gap-y-1
                              text-[11px]
                              text-black/50
                            "
                          >
                            <span>
                              Color:{" "}
                              {selectedColor
                                ?.nameColor ||
                                selectedColor
                                  ?.name ||
                                "-"}
                            </span>

                            <span>
                              Size:{" "}
                              {selectedSize
                                ?.size ||
                                selectedSize
                                  ?.name ||
                                "-"}
                            </span>
                          </div>

                          <p
                            className="
                              mt-4
                              text-[15px]
                              font-semibold
                            "
                          >
                            ₹
                            {unitPrice.toLocaleString(
                              "en-IN",
                              {
                                maximumFractionDigits:
                                  2,
                              }
                            )}
                          </p>

                          <div
                            className="
                              mt-auto
                              flex
                              flex-wrap
                              items-center
                              gap-3
                              pt-4
                            "
                          >
                            <div
                              className="
                                flex
                                items-center
                                overflow-hidden
                                rounded-full
                                border
                                border-[#211A18]/15
                              "
                            >
                              <button
                                type="button"
                                disabled={
                                  busy ||
                                  quantity <=
                                    1
                                }
                                onClick={() =>
                                  updateQuantity(
                                    item,
                                    quantity -
                                      1
                                  )
                                }
                                className="
                                  h-9
                                  w-10
                                  hover:bg-[#EFE5DB]
                                  disabled:opacity-30
                                "
                              >
                                −
                              </button>

                              <span
                                className="
                                  min-w-[34px]
                                  text-center
                                  text-[12px]
                                  font-semibold
                                "
                              >
                                {
                                  quantity
                                }
                              </span>

                              <button
                                type="button"
                                disabled={
                                  busy ||
                                  (
                                    availableStock >
                                      0 &&
                                    quantity >=
                                      availableStock
                                  )
                                }
                                onClick={() =>
                                  updateQuantity(
                                    item,
                                    quantity +
                                      1
                                  )
                                }
                                className="
                                  h-9
                                  w-10
                                  hover:bg-[#EFE5DB]
                                  disabled:opacity-30
                                "
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              disabled={
                                busy
                              }
                              onClick={() =>
                                removeItem(
                                  item
                                )
                              }
                              className="
                                text-[9px]
                                font-semibold
                                uppercase
                                tracking-[0.1em]
                                text-[#A91543]
                                disabled:opacity-40
                              "
                            >
                              Remove
                            </button>

                            <strong
                              className="
                                ml-auto
                                text-[14px]
                              "
                            >
                              ₹
                              {subtotal.toLocaleString(
                                "en-IN",
                                {
                                  maximumFractionDigits:
                                    2,
                                }
                              )}
                            </strong>
                          </div>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>

              {/* SUMMARY */}

              <aside
                className="
                  h-fit
                  rounded-[18px]
                  border
                  border-[#211A18]/10
                  bg-white
                  p-6
                "
              >
                <h2
                  className="
                    text-[18px]
                    font-semibold
                  "
                >
                  Order Summary
                </h2>

                <div
                  className="
                    mt-6
                    flex
                    items-center
                    justify-between
                    text-[12px]
                  "
                >
                  <span
                    className="
                      text-black/55
                    "
                  >
                    Items
                  </span>

                  <span
                    className="
                      font-medium
                    "
                  >
                    {
                      cart.totalItems
                    }
                  </span>
                </div>

                <div
                  className="
                    mt-4
                    flex
                    items-center
                    justify-between
                    border-t
                    border-black/10
                    pt-4
                  "
                >
                  <span
                    className="
                      text-[13px]
                      font-medium
                    "
                  >
                    Subtotal
                  </span>

                  <strong
                    className="
                      text-[18px]
                    "
                  >
                    ₹
                    {cart.subtotal.toLocaleString(
                      "en-IN",
                      {
                        maximumFractionDigits:
                          2,
                      }
                    )}
                  </strong>
                </div>

                <p
                  className="
                    mt-3
                    text-[10px]
                    leading-5
                    text-black/45
                  "
                >
                  Shipping, discounts and taxes will be calculated at checkout.
                </p>

                <Link
                  href="/checkout"
                  className="
                    flex
                    h-[44px]
                    w-full

                    items-center
                    justify-center

                    rounded-[8px]

                    bg-[#B41443]

                    px-4

                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.07em]
                    text-white

                    transition-all

                    hover:bg-[#941035]

                    active:scale-[0.99]
                  "
                  >
                    Proceed To Checkout
                  </Link>

                <Link
                  href="/men"
                  className="
                    mt-3
                    flex
                    h-11
                    w-full
                    items-center
                    justify-center
                    rounded-[9px]
                    border
                    border-[#211A18]/15
                    text-[9px]
                    font-semibold
                    uppercase
                    tracking-[0.1em]
                  "
                >
                  Continue Shopping
                </Link>
              </aside>
            </div>
          )}
        </div>
      </main>
    </>
  );
}