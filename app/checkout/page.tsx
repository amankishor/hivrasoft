"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Truck,
} from "lucide-react";

import Header from "@/src/components/Header/Header";

/* =========================================================
   API
========================================================= */

const RAW_API_URL =
  (
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000"
  ).replace(/\/+$/, "");

const API_URL =
  RAW_API_URL.replace(
    /\/api$/i,
    ""
  );

/* =========================================================
   API HELPER
========================================================= */

async function api(
  path: string,
  options: RequestInit = {}
) {
  const url =
    `${API_URL}${path}`;

  console.log(
    "[API REQUEST]",
    options.method || "GET",
    url
  );

  const response =
    await fetch(
      url,
      {
        ...options,

        credentials:
          "include",

        cache:
          "no-store",

        headers: {
          Accept:
            "application/json",

          "Content-Type":
            "application/json",

          ...(options.headers ||
            {}),
        },
      }
    );

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  let data: any =
    null;

  try {
    if (
      contentType.includes(
        "application/json"
      )
    ) {
      data =
        await response.json();
    } else {
      const text =
        await response.text();

      data = {
        message:
          text ||
          `Request failed (${response.status})`,
      };
    }
  } catch {
    data = null;
  }

  console.log(
    "[API RESPONSE]",
    {
      url,
      status:
        response.status,
      ok:
        response.ok,
      data,
    }
  );

  if (
    !response.ok
  ) {
    if (
      response.status ===
      401
    ) {
      throw new Error(
        "Please login before checkout."
      );
    }

    if (
      response.status ===
      403
    ) {
      throw new Error(
        data?.message ||
          "You are not allowed to perform this action."
      );
    }

    if (
      response.status ===
      404
    ) {
      throw new Error(
        data?.message ||
          `API not found: ${path}`
      );
    }

    if (
      response.status ===
        400 ||
      response.status ===
        422
    ) {
      throw new Error(
        data?.message ||
          data?.error ||
          "Invalid request data."
      );
    }

    if (
      response.status >=
      500
    ) {
      throw new Error(
        data?.message ||
          data?.error ||
          "Server error. Please check backend terminal."
      );
    }

    throw new Error(
      data?.message ||
        data?.error ||
        `Request failed (${response.status}).`
    );
  }

  return data;
}

/* =========================================================
   MONEY
========================================================= */

const money = (
  value: unknown
) =>
  `₹${Number(
    value || 0
  ).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits:
        2,
    }
  )}`;

/* =========================================================
   TYPES
========================================================= */

type CheckoutForm = {
  fullName: string;

  phone: string;

  addressLine1: string;

  addressLine2: string;

  landmark: string;

  city: string;

  district: string;

  state: string;

  postalCode: string;

  country: string;

  countryCode: string;
};

/* =========================================================
   FORM
========================================================= */

const initialForm: CheckoutForm = {
  fullName: "",

  phone: "",

  addressLine1: "",

  addressLine2: "",

  landmark: "",

  city: "",

  district: "",

  state: "",

  postalCode: "",

  country: "India",

  countryCode: "IN",
};

/* =========================================================
   HELPERS
========================================================= */

function extractCart(
  data: any
) {
  return (
    data?.cart ||
    data?.data?.cart ||
    data?.data ||
    data ||
    null
  );
}

function extractDeliveryCharge(
  data: any
): number {
  const candidates = [
    data?.deliveryCharge,

    data?.charge,

    data?.shippingCharge,

    data?.data
      ?.deliveryCharge,

    data?.data
      ?.charge,

    data?.data
      ?.shippingCharge,

    data?.preview
      ?.deliveryCharge,

    data?.pricing
      ?.deliveryCharge,
  ];

  for (
    const value of candidates
  ) {
    const number =
      Number(value);

    if (
      Number.isFinite(
        number
      ) &&
      number >= 0
    ) {
      return number;
    }
  }

  return 0;
}

/* =========================================================
   PAGE
========================================================= */

export default function CheckoutPage() {
  const [
    cart,
    setCart,
  ] =
    useState<any>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    placing,
    setPlacing,
  ] =
    useState(
      false
    );

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    order,
    setOrder,
  ] =
    useState<any>(
      null
    );

  const [
    deliveryCharge,
    setDeliveryCharge,
  ] =
    useState(0);

  const [
    deliveryLoading,
    setDeliveryLoading,
  ] =
    useState(
      false
    );

  const [
    form,
    setForm,
  ] =
    useState<CheckoutForm>(
      initialForm
    );

  /* =======================================================
     LOAD CART
  ======================================================= */

  useEffect(() => {
    let active =
      true;

    async function loadCart() {
      setLoading(
        true
      );

      setError("");

      try {
        const data =
          await api(
            "/api/cart"
          );

        if (
          !active
        ) {
          return;
        }

        const nextCart =
          extractCart(
            data
          );

        setCart(
          nextCart
        );
      } catch (
        error
      ) {
        if (
          !active
        ) {
          return;
        }

        setError(
          error instanceof
            Error
            ? error.message
            : "Unable to load cart."
        );
      } finally {
        if (
          active
        ) {
          setLoading(
            false
          );
        }
      }
    }

    void loadCart();

    return () => {
      active =
        false;
    };
  }, []);

  /* =======================================================
     DELIVERY PREVIEW
  ======================================================= */

  useEffect(() => {
    if (
      !cart ||
      !Array.isArray(
        cart.items
      ) ||
      cart.items.length ===
        0
    ) {
      return;
    }

    let active =
      true;

    async function loadDelivery() {
      setDeliveryLoading(
        true
      );

      try {
        const data =
          await api(
            "/api/orders/delivery-charge/preview",
            {
              method:
                "POST",

              body:
                JSON.stringify(
                  {
                    paymentMethod:
                      "cod",
                  }
                ),
            }
          );

        if (
          !active
        ) {
          return;
        }

        setDeliveryCharge(
          extractDeliveryCharge(
            data
          )
        );
      } catch (
        error
      ) {
        console.error(
          "[DELIVERY PREVIEW ERROR]",
          error
        );

        if (
          active
        ) {
          setDeliveryCharge(
            0
          );
        }
      } finally {
        if (
          active
        ) {
          setDeliveryLoading(
            false
          );
        }
      }
    }

    void loadDelivery();

    return () => {
      active =
        false;
    };
  }, [
    cart,
  ]);

  /* =======================================================
     AVAILABLE ITEMS
  ======================================================= */

  const availableItems =
    useMemo(
      () =>
        Array.isArray(
          cart?.items
        )
          ? cart.items.filter(
              (
                item: any
              ) =>
                item?.available !==
                false
            )
          : [],
      [
        cart,
      ]
    );

  /* =======================================================
     TOTALS
  ======================================================= */

  const subtotal =
    Number(
      cart?.subtotal ||
        0
    );

  const automaticDiscount =
    Number(
      cart?.automaticDiscount ||
        0
    );

  const codeDiscount =
    Number(
      cart?.codeDiscount ||
        0
    );

  const tax =
    Number(
      cart?.tax ||
        cart?.taxAmount ||
        0
    );

  const backendTotal =
    Number(
      cart?.total ||
        0
    );

  const calculatedTotal =
    Math.max(
      0,

      subtotal -
        automaticDiscount -
        codeDiscount +
        tax +
        deliveryCharge
    );

  const displayTotal =
    backendTotal >
      0 &&
    deliveryCharge ===
      0
      ? backendTotal
      : calculatedTotal;

  /* =======================================================
     PLACE ORDER
  ======================================================= */

  async function placeOrder(
    event: FormEvent
  ) {
    event.preventDefault();

    setError("");

    if (
      !form.fullName.trim() ||
      !form.phone.trim() ||
      !form.addressLine1.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !form.postalCode.trim()
    ) {
      setError(
        "Please fill all required shipping details."
      );

      return;
    }

    if (
      availableItems.length ===
      0
    ) {
      setError(
        "Your shopping bag is empty."
      );

      return;
    }

    setPlacing(
      true
    );

    try {
      const result =
        await api(
          "/api/orders",
          {
            method:
              "POST",

            body:
              JSON.stringify(
                {
                  paymentMethod:
                    "cod",

                  shippingAddress:
                    {
                      fullName:
                        form.fullName.trim(),

                      phone:
                        form.phone.trim(),

                      addressLine1:
                        form.addressLine1.trim(),

                      addressLine2:
                        form.addressLine2.trim(),

                      landmark:
                        form.landmark.trim(),

                      city:
                        form.city.trim(),

                      district:
                        (
                          form.district ||
                          form.city
                        ).trim(),

                      state:
                        form.state.trim(),

                      postalCode:
                        form.postalCode.trim(),

                      country:
                        form.country.trim() ||
                        "India",

                      countryCode:
                        form.countryCode.trim() ||
                        "IN",
                    },
                }
              ),
          }
        );

      const createdOrder =
        result?.order ||
        result?.data
          ?.order ||
        result?.data ||
        result;

      setOrder(
        createdOrder
      );

      setCart(
        null
      );

      window.scrollTo({
        top: 0,

        behavior:
          "smooth",
      });
    } catch (
      error
    ) {
      setError(
        error instanceof
          Error
          ? error.message
          : "Unable to place order."
      );
    } finally {
      setPlacing(
        false
      );
    }
  }

  /* =======================================================
     SUCCESS
  ======================================================= */

  if (
    order
  ) {
    return (
      <>
        <Header />

        <main
          className="
            min-h-screen
            bg-[#FDFCFB]
            px-4
            py-12
            md:px-8
          "
        >
          <div
            className="
              mx-auto
              max-w-[760px]
            "
          >
            <div
              className="
                rounded-[22px]
                border
                border-[#2f8a53]/20
                bg-white
                px-6
                py-12
                text-center
                shadow-[0_20px_70px_rgba(0,0,0,0.04)]
                md:px-10
              "
            >
              <CheckCircle2
                className="
                  mx-auto
                  text-[#2f8a53]
                "
                size={
                  54
                }
              />

              <p
                className="
                  mt-6
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.2em]
                  text-[#a31340]
                "
              >
                Hivra Soft
              </p>

              <h1
                className="
                  mt-2
                  font-serif
                  text-3xl
                  text-[#211A18]
                  md:text-4xl
                "
              >
                Order placed successfully
              </h1>

              <p
                className="
                  mt-4
                  text-[12px]
                  leading-6
                  text-[#6e625e]
                "
              >
                Your order has been created successfully.
              </p>

              {order?.orderNumber && (
                <p
                  className="
                    mt-5
                    text-[12px]
                    font-semibold
                    text-[#211A18]
                  "
                >
                  Order:{" "}
                  {order.orderNumber}
                </p>
              )}

              {Number(
                order?.total ||
                  0
              ) >
                0 && (
                <p
                  className="
                    mt-2
                    text-[12px]
                    text-[#6e625e]
                  "
                >
                  Total:{" "}
                  <strong
                    className="
                      text-[#211A18]
                    "
                  >
                    {money(
                      order.total
                    )}
                  </strong>
                </p>
              )}

              <div
                className="
                  mt-8
                  flex
                  flex-col
                  justify-center
                  gap-3
                  sm:flex-row
                "
              >
                <Link
                  href="/account/orders"
                  className="
                    inline-flex
                    h-11
                    items-center
                    justify-center
                    rounded-xl
                    bg-[#a31340]
                    px-7
                    text-[10px]
                    font-semibold
                    uppercase
                    text-white
                  "
                >
                  View Orders
                </Link>

                <Link
                  href="/"
                  className="
                    inline-flex
                    h-11
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-[#211A18]/10
                    px-7
                    text-[10px]
                    font-semibold
                    uppercase
                  "
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <>
      <Header />

      <main
        className="
          min-h-screen
          bg-[#FDFCFB]
          px-4
          py-8
          md:px-8
        "
      >
        <div
          className="
            mx-auto
            max-w-[1200px]
          "
        >
          <div
            className="
              mb-7
              flex
              items-end
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
                  text-[#a31340]
                "
              >
                Secure Checkout
              </p>

              <h1
                className="
                  mt-2
                  font-serif
                  text-4xl
                  text-[#211A18]
                "
              >
                Complete your order
              </h1>
            </div>

            <Link
              href="/cart"
              className="
                text-[10px]
                font-semibold
                text-[#a31340]
              "
            >
              ← Back to cart
            </Link>
          </div>

          {loading && (
            <div
              className="
                rounded-2xl
                border
                border-[#211A18]/10
                bg-white
                p-8
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >
                <Loader2
                  size={
                    18
                  }
                  className="
                    animate-spin
                    text-[#a31340]
                  "
                />

                Loading checkout...
              </div>
            </div>
          )}

          {!loading &&
            error &&
            !cart && (
              <div
                className="
                  rounded-2xl
                  border
                  border-red-200
                  bg-white
                  p-8
                "
              >
                <p
                  className="
                    text-[12px]
                    text-[#a31340]
                  "
                >
                  {error}
                </p>

                <Link
                  href="/cart"
                  className="
                    mt-5
                    inline-flex
                    rounded-lg
                    bg-[#a31340]
                    px-5
                    py-3
                    text-[10px]
                    font-semibold
                    uppercase
                    text-white
                  "
                >
                  Back to cart
                </Link>
              </div>
            )}

          {!loading &&
            cart &&
            availableItems.length ===
              0 && (
              <div
                className="
                  rounded-2xl
                  border
                  border-[#211A18]/10
                  bg-white
                  p-10
                  text-center
                "
              >
                <h2
                  className="
                    font-serif
                    text-2xl
                  "
                >
                  Your bag is empty
                </h2>

                <Link
                  href="/"
                  className="
                    mt-5
                    inline-flex
                    rounded-lg
                    bg-[#a31340]
                    px-6
                    py-3
                    text-[10px]
                    font-semibold
                    uppercase
                    text-white
                  "
                >
                  Continue Shopping
                </Link>
              </div>
            )}

          {!loading &&
            cart &&
            availableItems.length >
              0 && (
              <form
                onSubmit={
                  placeOrder
                }
                className="
                  grid
                  gap-6
                  lg:grid-cols-[1.2fr_0.8fr]
                "
              >
                {/* SHIPPING */}

                <section
                  className="
                    rounded-2xl
                    border
                    border-[#211A18]/10
                    bg-white
                    p-6
                  "
                >
                  <h2
                    className="
                      font-serif
                      text-2xl
                      text-[#211A18]
                    "
                  >
                    Shipping address
                  </h2>

                  <div
                    className="
                      mt-5
                      grid
                      gap-4
                      sm:grid-cols-2
                    "
                  >
                    {[
                      [
                        "fullName",
                        "Full name",
                      ],
                      [
                        "phone",
                        "Phone",
                      ],
                      [
                        "addressLine1",
                        "Address line 1",
                      ],
                      [
                        "addressLine2",
                        "Address line 2",
                      ],
                      [
                        "landmark",
                        "Landmark",
                      ],
                      [
                        "city",
                        "City",
                      ],
                      [
                        "district",
                        "District",
                      ],
                      [
                        "state",
                        "State",
                      ],
                      [
                        "postalCode",
                        "PIN code",
                      ],
                      [
                        "country",
                        "Country",
                      ],
                    ].map(
                      ([
                        key,
                        label,
                      ]) => (
                        <label
                          key={
                            key
                          }
                          className={`
                            text-[10px]
                            font-semibold
                            text-[#211A18]

                            ${
                              key ===
                                "addressLine1" ||
                              key ===
                                "addressLine2"
                                ? "sm:col-span-2"
                                : ""
                            }
                          `}
                        >
                          {label}

                          {![
                            "addressLine2",
                            "landmark",
                            "district",
                          ].includes(
                            key
                          ) &&
                            " *"}

                          <input
                            required={
                              ![
                                "addressLine2",
                                "landmark",
                                "district",
                              ].includes(
                                key
                              )
                            }
                            value={
                              (
                                form as any
                              )[
                                key
                              ]
                            }
                            onChange={(
                              event
                            ) =>
                              setForm(
                                (
                                  current
                                ) => ({
                                  ...current,

                                  [key]:
                                    event
                                      .target
                                      .value,
                                })
                              )
                            }
                            className="
                              mt-2
                              h-11
                              w-full
                              rounded-xl
                              border
                              border-[#211A18]/10
                              bg-[#FAF8F6]
                              px-3
                              text-[11px]
                              font-normal
                              outline-none
                              focus:border-[#a31340]/40
                            "
                          />
                        </label>
                      )
                    )}
                  </div>

                  <div
                    className="
                      mt-5
                      rounded-xl
                      bg-[#F5FBF7]
                      p-4
                      text-[10px]
                      text-[#506458]
                    "
                  >
                    <strong
                      className="
                        block
                        text-[#2f8a53]
                      "
                    >
                      Cash on Delivery
                    </strong>

                    Payment status stays pending until your payment is confirmed.
                  </div>

                  {error && (
                    <p
                      className="
                        mt-4
                        rounded-xl
                        bg-[#fff0f2]
                        p-3
                        text-[10px]
                        text-[#a31340]
                      "
                    >
                      {error}
                    </p>
                  )}
                </section>

                {/* ORDER SUMMARY */}

                <aside
                  className="
                    h-max
                    rounded-2xl
                    border
                    border-[#211A18]/10
                    bg-white
                    p-6
                    lg:sticky
                    lg:top-24
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      gap-2
                    "
                  >
                    <ShieldCheck
                      size={
                        18
                      }
                      className="
                        text-[#a31340]
                      "
                    />

                    <h2
                      className="
                        font-serif
                        text-xl
                      "
                    >
                      Order summary
                    </h2>
                  </div>

                  <div
                    className="
                      mt-5
                      space-y-3
                      text-[11px]
                      text-[#6e625e]
                    "
                  >
                    {availableItems.map(
                      (
                        item: any,
                        index: number
                      ) => (
                        <div
                          key={
                            item?._id ||
                            item?.id ||
                            index
                          }
                          className="
                            flex
                            justify-between
                            gap-4
                            border-b
                            border-[#211A18]/[0.08]
                            pb-3
                          "
                        >
                          <span>
                            {item
                              ?.product
                              ?.name ||
                              item
                                ?.productName ||
                              item
                                ?.name ||
                              "Product"}{" "}
                            ×{" "}
                            {item
                              ?.quantity ||
                              1}
                          </span>

                          <span
                            className="
                              font-semibold
                              text-[#211A18]
                            "
                          >
                            {money(
                              item
                                ?.discount
                                ?.finalLineTotal ??
                                item?.subtotal ??
                                item?.lineTotal ??
                                0
                            )}
                          </span>
                        </div>
                      )
                    )}

                    <div
                      className="
                        flex
                        justify-between
                      "
                    >
                      <span>
                        Subtotal
                      </span>

                      <strong>
                        {money(
                          subtotal
                        )}
                      </strong>
                    </div>

                    {automaticDiscount >
                      0 && (
                      <div
                        className="
                          flex
                          justify-between
                          text-[#2f8a53]
                        "
                      >
                        <span>
                          Automatic discount
                        </span>

                        <strong>
                          -
                          {money(
                            automaticDiscount
                          )}
                        </strong>
                      </div>
                    )}

                    {codeDiscount >
                      0 && (
                      <div
                        className="
                          flex
                          justify-between
                          text-[#a31340]
                        "
                      >
                        <span>
                          Code{" "}
                          {cart?.appliedDiscountCode ||
                            ""}
                        </span>

                        <strong>
                          -
                          {money(
                            codeDiscount
                          )}
                        </strong>
                      </div>
                    )}

                    {tax >
                      0 && (
                      <div
                        className="
                          flex
                          justify-between
                        "
                      >
                        <span>
                          Tax
                        </span>

                        <strong>
                          {money(
                            tax
                          )}
                        </strong>
                      </div>
                    )}

                    <div
                      className="
                        flex
                        justify-between
                      "
                    >
                      <div
                        className="
                          flex
                          items-center
                          gap-1.5
                        "
                      >
                        <Truck
                          size={
                            14
                          }
                        />

                        <span>
                          Shipping
                        </span>
                      </div>

                      {deliveryLoading ? (
                        <span>
                          Checking...
                        </span>
                      ) : (
                        <strong
                          className={
                            deliveryCharge ===
                            0
                              ? "text-[#2f8a53]"
                              : "text-[#211A18]"
                          }
                        >
                          {deliveryCharge ===
                          0
                            ? "FREE"
                            : money(
                                deliveryCharge
                              )}
                        </strong>
                      )}
                    </div>
                  </div>

                  <div
                    className="
                      mt-5
                      flex
                      items-end
                      justify-between
                      border-t
                      border-[#211A18]/10
                      pt-4
                    "
                  >
                    <span
                      className="
                        text-[12px]
                        font-semibold
                      "
                    >
                      Total
                    </span>

                    <strong
                      className="
                        font-serif
                        text-2xl
                      "
                    >
                      {money(
                        displayTotal
                      )}
                    </strong>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      placing ||
                      availableItems.length ===
                        0
                    }
                    className="
                      mt-5
                      flex
                      h-12
                      w-full
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-[#a31340]
                      text-[10px]
                      font-semibold
                      uppercase
                      text-white
                      disabled:opacity-50
                    "
                  >
                    {placing && (
                      <Loader2
                        size={
                          14
                        }
                        className="
                          animate-spin
                        "
                      />
                    )}

                    {placing
                      ? "Placing order..."
                      : "Place order"}
                  </button>

                  <Link
                    href="/cart"
                    className="
                      mt-3
                      flex
                      h-11
                      w-full
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-[#211A18]/10
                      text-[9px]
                      font-semibold
                      uppercase
                    "
                  >
                    Back to cart
                  </Link>
                </aside>
              </form>
            )}
        </div>
      </main>
    </>
  );
}