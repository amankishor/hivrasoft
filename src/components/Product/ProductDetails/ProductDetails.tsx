"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  getDefaultColor,
  getProductImageUrls,
  getProductName,
  type ApiColor,
  type ApiProduct,
  type ApiSize,
} from "@/src/services/products";

import {
  addProductToCart,
  addProductToWishlist,
  checkLoggedIn,
  checkProductWishlist,
  notifyCartUpdated,
  notifyWishlistUpdated,
  removeProductFromWishlist,
  requestStoreLogin,
} from "@/src/services/storeActions";

/* =========================================================
   TYPES
========================================================= */

export type ProductDetailsData =
  ApiProduct;

type ProductDetailsProps = {
  product: ProductDetailsData;
  currentSlug: string;
};

type PriceFields = {
  originalPrice?:
    | number
    | string;

  showPrice?:
    | number
    | string;

  discountPrice?:
    | number
    | string;

  mrp?:
    | number
    | string;

  compareAtPrice?:
    | number
    | string;

  actualPrice?:
    | number
    | string;

  sellingPrice?:
    | number
    | string;

  salePrice?:
    | number
    | string;

  price?:
    | number
    | string;
};

type ExtendedColor =
  ApiColor &
    PriceFields;

type ExtendedSize =
  ApiSize &
    PriceFields;

type ExtendedProduct =
  ApiProduct &
    PriceFields;

/* =========================================================
   PRICE
========================================================= */

function pickPositiveNumber(
  ...values: unknown[]
): number | undefined {
  for (
    const value of values
  ) {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      continue;
    }

    const number =
      Number(value);

    if (
      Number.isFinite(
        number
      ) &&
      number > 0
    ) {
      return number;
    }
  }

  return undefined;
}

function getSourcePrices(
  source?:
    | PriceFields
    | null
) {
  if (
    !source
  ) {
    return {
      showPrice:
        undefined as
          | number
          | undefined,

      originalPrice:
        undefined as
          | number
          | undefined,

      discountPrice:
        undefined as
          | number
          | undefined,
    };
  }

  return {
    showPrice:
      pickPositiveNumber(
        source.showPrice,
        source.sellingPrice,
        source.salePrice,
        source.price
      ),

    originalPrice:
      pickPositiveNumber(
        source.originalPrice,
        source.mrp,
        source.compareAtPrice,
        source.actualPrice
      ),

    discountPrice:
      pickPositiveNumber(
        source.discountPrice
      ),
  };
}

/* =========================================================
   DESCRIPTION
========================================================= */

function cleanDescriptionHtml(
  html?: string
) {
  if (
    typeof html !==
    "string"
  ) {
    return "";
  }

  return html
    .replace(
      /<script\b[^>]*>[\s\S]*?<\/script>/gi,
      ""
    )
    .replace(
      /<(iframe|object|embed)\b[^>]*>[\s\S]*?<\/\1>/gi,
      ""
    )
    .replace(
      /\son\w+\s*=\s*"[^"]*"/gi,
      ""
    )
    .replace(
      /\son\w+\s*=\s*'[^']*'/gi,
      ""
    )
    .replace(
      /javascript:/gi,
      ""
    );
}

/* =========================================================
   PRODUCT DETAILS
========================================================= */

export default function ProductDetails({
  product,
  currentSlug,
}: ProductDetailsProps) {
  const router =
    useRouter();

  /* =======================================================
     COLORS
  ======================================================= */

  const activeColors =
    useMemo(() => {
      if (
        !Array.isArray(
          product.colors
        )
      ) {
        return [];
      }

      return product.colors.filter(
        (color) =>
          color?.isActive !==
          false
      );
    }, [
      product.colors,
    ]);

  const urlColorIndex =
    useMemo(() => {
      if (
        !currentSlug
      ) {
        return -1;
      }

      return activeColors.findIndex(
        (color) =>
          String(
            color?.slugProduct ||
              ""
          )
            .trim()
            .toLowerCase() ===
          currentSlug
            .trim()
            .toLowerCase()
      );
    }, [
      activeColors,
      currentSlug,
    ]);

  const defaultColorIndex =
    useMemo(() => {
      if (
        urlColorIndex >=
        0
      ) {
        return urlColorIndex;
      }

      const backendDefault =
        activeColors.findIndex(
          (color) =>
            color?.isDefault ===
            true
        );

      return backendDefault >=
        0
        ? backendDefault
        : 0;
    }, [
      activeColors,
      urlColorIndex,
    ]);

  /* =======================================================
     STATES
  ======================================================= */

  const [
    selectedColorIndex,
    setSelectedColorIndex,
  ] =
    useState(
      defaultColorIndex
    );

  const [
    selectedSizeIndex,
    setSelectedSizeIndex,
  ] =
    useState<
      number | null
    >(null);

  const [
    activeImageIndex,
    setActiveImageIndex,
  ] =
    useState(0);

  const [
    quantity,
    setQuantity,
  ] =
    useState(1);

  const [
    wishlisted,
    setWishlisted,
  ] =
    useState(false);

  const [
    wishlistBusy,
    setWishlistBusy,
  ] =
    useState(false);

  const [
    cartBusy,
    setCartBusy,
  ] =
    useState(false);

  const [
    actionMessage,
    setActionMessage,
  ] =
    useState("");

  const [
    actionError,
    setActionError,
  ] =
    useState(false);

  /* =======================================================
     IDS
  ======================================================= */

  const productId =
    String(
      product._id ||
        product.id ||
        ""
    );

  /* =======================================================
     SYNC COLOR
  ======================================================= */

  useEffect(() => {
    setSelectedColorIndex(
      defaultColorIndex
    );

    setSelectedSizeIndex(
      null
    );

    setActiveImageIndex(
      0
    );

    setQuantity(
      1
    );
  }, [
    defaultColorIndex,
    currentSlug,
  ]);

  /* =======================================================
     SELECTED COLOR
  ======================================================= */

  const selectedColor =
    (
      activeColors[
        selectedColorIndex
      ] ||
      getDefaultColor(
        product
      )
    ) as
      | ExtendedColor
      | undefined;

  /* =======================================================
     IMAGES
  ======================================================= */

  const images =
    useMemo(() => {
      const colorImages =
        Array.isArray(
          selectedColor?.images
        )
          ? selectedColor.images.filter(
              (image) =>
                Boolean(
                  image?.url
                )
            )
          : [];

      if (
        colorImages.length >
        0
      ) {
        const defaultImage =
          colorImages.find(
            (image) =>
              image?.isDefault ===
              true
          );

        return [
          ...(defaultImage
            ? [
                defaultImage,
              ]
            : []),

          ...colorImages.filter(
            (image) =>
              image !==
              defaultImage
          ),
        ];
      }

      return getProductImageUrls(
        product
      ).map(
        (url) => ({
          url,
        })
      );
    }, [
      product,
      selectedColor,
    ]);

  const activeImage =
    images[
      Math.min(
        activeImageIndex,
        Math.max(
          0,
          images.length -
            1
        )
      )
    ];

  /* =======================================================
     SIZES
  ======================================================= */

  const sizes =
    useMemo(() => {
      if (
        !Array.isArray(
          selectedColor?.sizes
        )
      ) {
        return [];
      }

      return selectedColor.sizes.filter(
        (size) =>
          size?.isActive !==
          false
      ) as ExtendedSize[];
    }, [
      selectedColor,
    ]);

  const selectedSize =
    selectedSizeIndex !==
      null &&
    sizes[
      selectedSizeIndex
    ]
      ? sizes[
          selectedSizeIndex
        ]
      : undefined;

  /* =======================================================
     STOCK
  ======================================================= */

  const selectedColorStock =
    useMemo(() => {
      return sizes.reduce(
        (
          total,
          size
        ) =>
          total +
          Math.max(
            0,
            Number(
              size.stock ||
                0
            )
          ),
        0
      );
    }, [
      sizes,
    ]);

  const currentStock =
    selectedSize
      ? Math.max(
          0,
          Number(
            selectedSize.stock ||
              0
          )
        )
      : selectedColorStock;

  const isLowStock =
    currentStock > 0 &&
    currentStock < 5;

  /* =======================================================
     NAME / DESCRIPTION
  ======================================================= */

  const name =
    String(
      selectedColor
        ?.nameProduct ||
        getProductName(
          product
        ) ||
        "Product"
    );

  const colorName =
    String(
      selectedColor
        ?.nameColor ||
        ""
    );

  const shortDescription =
    String(
      selectedColor
        ?.shortDescription ||
        product.shortDescription ||
        ""
    );

  const descriptionHtml =
    cleanDescriptionHtml(
      selectedColor
        ?.description ||
        product.description ||
        ""
    );

  /* =======================================================
     PRICES
  ======================================================= */

  const sizePrices =
    getSourcePrices(
      selectedSize
    );

  const colorPrices =
    getSourcePrices(
      selectedColor
    );

  const productPrices =
    getSourcePrices(
      product as
        ExtendedProduct
    );

  const sellingPrice =
    sizePrices.showPrice ??
    colorPrices.showPrice ??
    productPrices.showPrice ??
    0;

  const rawOriginalPrice =
    sizePrices.originalPrice ??
    colorPrices.originalPrice ??
    productPrices.originalPrice ??
    sellingPrice;

  const actualPrice =
    rawOriginalPrice >
    sellingPrice
      ? rawOriginalPrice
      : sellingPrice;

  const discountAmount =
    sizePrices.discountPrice ??
    colorPrices.discountPrice ??
    productPrices.discountPrice ??
    (actualPrice >
    sellingPrice
      ? actualPrice -
        sellingPrice
      : 0);

  const discountPercent =
    actualPrice >
      sellingPrice &&
    actualPrice > 0 &&
    sellingPrice > 0
      ? Math.round(
          ((actualPrice -
            sellingPrice) /
            actualPrice) *
            100
        )
      : 0;

  /* =======================================================
     WISHLIST INITIAL STATE

     Login nahi hai to koi modal automatically
     nahi khulega.
  ======================================================= */

  useEffect(() => {
    if (
      !productId
    ) {
      return;
    }

    let cancelled =
      false;

    void (async () => {
      const loggedIn =
        await checkLoggedIn();

      if (
        !loggedIn ||
        cancelled
      ) {
        return;
      }

      const exists =
        await checkProductWishlist(
          productId
        );

      if (
        !cancelled
      ) {
        setWishlisted(
          exists
        );
      }
    })();

    return () => {
      cancelled =
        true;
    };
  }, [
    productId,
  ]);

  /* =======================================================
     MESSAGE TIMER
  ======================================================= */

  useEffect(() => {
    if (
      !actionMessage
    ) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setActionMessage(
            ""
          );

          setActionError(
            false
          );
        },
        3000
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    actionMessage,
  ]);

  function showMessage(
    message: string,
    error = false
  ) {
    setActionMessage(
      message
    );

    setActionError(
      error
    );
  }

  /* =======================================================
     COLOR
  ======================================================= */

  function selectColor(
    index: number
  ) {
    const color =
      activeColors[
        index
      ];

    if (
      !color
    ) {
      return;
    }

    setSelectedColorIndex(
      index
    );

    setSelectedSizeIndex(
      null
    );

    setActiveImageIndex(
      0
    );

    setQuantity(
      1
    );

    const nextSlug =
      String(
        color.slugProduct ||
          ""
      ).trim();

    if (
      nextSlug &&
      nextSlug !==
        currentSlug
    ) {
      router.push(
        `/product/${encodeURIComponent(
          nextSlug
        )}`,
        {
          scroll: false,
        }
      );
    }
  }

  /* =======================================================
     SIZE
  ======================================================= */

  function selectSize(
    index: number
  ) {
    const size =
      sizes[index];

    if (
      !size
    ) {
      return;
    }

    const stock =
      Number(
        size.stock ||
          0
      );

    if (
      size.isActive ===
        false ||
      stock <= 0
    ) {
      return;
    }

    setSelectedSizeIndex(
      index
    );

    setQuantity(
      1
    );
  }

  /* =======================================================
     QUANTITY
  ======================================================= */

  function decreaseQuantity() {
    setQuantity(
      (current) =>
        Math.max(
          1,
          current - 1
        )
    );
  }

  function increaseQuantity() {
    setQuantity(
      (current) =>
        Math.min(
          Math.max(
            1,
            currentStock
          ),
          current + 1
        )
    );
  }

  /* =======================================================
     LOGIN GUARD
  ======================================================= */

  async function requireLogin(): Promise<boolean> {
    const loggedIn =
      await checkLoggedIn();

    if (
      loggedIn
    ) {
      return true;
    }

    showMessage(
      "Please log in first.",
      true
    );

    requestStoreLogin();

    return false;
  }

  /* =======================================================
     WISHLIST
  ======================================================= */

  async function toggleWishlist() {
    if (
      wishlistBusy ||
      !productId
    ) {
      return;
    }

    if (
      !(await requireLogin())
    ) {
      return;
    }

    try {
      setWishlistBusy(
        true
      );

      if (
        wishlisted
      ) {
        await removeProductFromWishlist(
          productId
        );

        setWishlisted(
          false
        );

        showMessage(
          "Removed from wishlist."
        );
      } else {
        await addProductToWishlist(
          productId
        );

        setWishlisted(
          true
        );

        showMessage(
          "Added to wishlist."
        );
      }

      notifyWishlistUpdated();
    } catch (
      error
    ) {
      showMessage(
        error instanceof
          Error
          ? error.message
          : "Wishlist update failed.",
        true
      );
    } finally {
      setWishlistBusy(
        false
      );
    }
  }

  /* =======================================================
     ADD TO BAG
  ======================================================= */

async function handleAddToBag() {
  if (cartBusy || currentStock <= 0) {
    return;
  }

  // Login check
  if (!(await requireLogin())) {
    return;
  }

  // Correct Color ID
  const colorId = String(
    selectedColor?.colorId ||
      selectedColor?._id ||
      selectedColor?.id ||
      ""
  );

  // Correct Size ID
  const sizeId = String(
    selectedSize?.sizeId ||
      selectedSize?._id ||
      selectedSize?.id ||
      ""
  );

  // Product validation
  if (!productId) {
    showMessage(
      "Product ID missing.",
      true
    );
    return;
  }

  // Color validation
  if (!colorId) {
    showMessage(
      "Please select a color.",
      true
    );
    return;
  }

  // Size validation
  if (!sizeId) {
    showMessage(
      "Please select a size.",
      true
    );
    return;
  }

  try {
    setCartBusy(true);

    console.log("ADD TO BAG PAYLOAD:", {
      productId,
      colorId,
      sizeId,
      quantity,
    });

    const response =
      await addProductToCart({
        productId,
        colorId,
        sizeId,
        quantity,
      });

    showMessage(
      typeof response.message === "string"
        ? response.message
        : "Product added to cart successfully."
    );

    notifyCartUpdated();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to add product to cart.";

    console.error(
      "ADD TO BAG ERROR:",
      error
    );

    showMessage(
      message,
      true
    );

    if (
      message ===
      "Please log in first."
    ) {
      requestStoreLogin();
    }
  } finally {
    setCartBusy(false);
  }
}

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main
      className="
        min-h-screen
        bg-white
        text-[#211A18]
      "
    >
      <section
        className="
          mx-auto
          grid
          w-full
          max-w-[1220px]
          grid-cols-1
          gap-8
          px-4
          pb-14
          pt-8

          md:px-6

          lg:grid-cols-[minmax(0,590px)_minmax(0,1fr)]
          lg:gap-12
        "
      >
        {/* =================================================
            GALLERY
        ================================================= */}

        <div className="min-w-0">
          {/* DESKTOP */}

          <div
            className="
              hidden

              lg:grid
              lg:grid-cols-[82px_minmax(0,1fr)]
              lg:items-start
              lg:gap-4
            "
          >
            <div
              className="
                flex
                max-h-[650px]
                flex-col
                gap-3
                overflow-y-auto
                pr-1
              "
            >
              {images.map(
                (
                  image,
                  index
                ) => (
                  <button
                    key={`${image.url}-${index}`}
                    type="button"
                    onClick={() =>
                      setActiveImageIndex(
                        index
                      )
                    }
                    className={`
                      relative
                      h-[98px]
                      w-[78px]
                      shrink-0
                      overflow-hidden
                      rounded-[10px]
                      border-2
                      bg-[#F3EEE8]
                      transition-all

                      ${
                        activeImageIndex ===
                        index
                          ? "border-[#9D173E]"
                          : "border-transparent hover:border-[#211A18]/25"
                      }
                    `}
                  >
                    {image.url ? (
                      <img
                        src={
                          image.url
                        }
                        alt={`${name} ${
                          index +
                          1
                        }`}
                        className="
                          h-full
                          w-full
                          object-cover
                        "
                      />
                    ) : null}
                  </button>
                )
              )}
            </div>

            <div
              className="
                relative
                aspect-[4/5]
                overflow-hidden
                rounded-[14px]
                bg-[#F3EEE8]
              "
            >
              {activeImage?.url ? (
                <img
                  src={
                    activeImage.url
                  }
                  alt={
                    name
                  }
                  className="
                    h-full
                    w-full
                    object-cover
                    object-center
                  "
                />
              ) : (
                <div
                  className="
                    flex
                    h-full
                    items-center
                    justify-center
                    text-sm
                    text-black/30
                  "
                >
                  No Image
                </div>
              )}
            </div>
          </div>

          {/* MOBILE */}

          <div className="lg:hidden">
            <div
              className="
                relative
                aspect-[4/5]
                overflow-hidden
                rounded-[14px]
                bg-[#F3EEE8]
              "
            >
              {activeImage?.url ? (
                <img
                  src={
                    activeImage.url
                  }
                  alt={
                    name
                  }
                  className="
                    h-full
                    w-full
                    object-cover
                  "
                />
              ) : null}
            </div>

            {images.length >
              1 && (
              <div
                className="
                  mt-4
                  flex
                  gap-3
                  overflow-x-auto
                  pb-2
                "
              >
                {images.map(
                  (
                    image,
                    index
                  ) => (
                    <button
                      key={`${image.url}-${index}`}
                      type="button"
                      onClick={() =>
                        setActiveImageIndex(
                          index
                        )
                      }
                      className={`
                        h-[92px]
                        w-[72px]
                        shrink-0
                        overflow-hidden
                        rounded-lg
                        border-2
                        bg-[#F3EEE8]

                        ${
                          activeImageIndex ===
                          index
                            ? "border-[#9D173E]"
                            : "border-transparent"
                        }
                      `}
                    >
                      {image.url && (
                        <img
                          src={
                            image.url
                          }
                          alt={`${name} ${
                            index +
                            1
                          }`}
                          className="
                            h-full
                            w-full
                            object-cover
                          "
                        />
                      )}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* =================================================
            DETAILS
        ================================================= */}

        <div
          className="
            min-w-0
            pt-2
          "
        >
          <h1
            className="
              max-w-[620px]
              text-[27px]
              font-semibold
              leading-[1.35]
              tracking-[-0.02em]
              text-[#171314]

              md:text-[31px]
            "
          >
            {name}
          </h1>

          {shortDescription && (
            <p
              className="
                mt-3
                max-w-[600px]
                text-[13px]
                leading-6
                text-[#211A18]/55
              "
            >
              {
                shortDescription
              }
            </p>
          )}

          {/* PRICE */}

          <div
            className="
              mt-7
              flex
              flex-wrap
              items-center
              gap-3
            "
          >
            <span
              className="
                text-[24px]
                font-semibold
                text-[#171314]
              "
            >
              ₹
              {sellingPrice.toLocaleString(
                "en-IN",
                {
                  maximumFractionDigits:
                    2,
                }
              )}
            </span>

            {actualPrice >
              sellingPrice &&
              sellingPrice >
                0 && (
                <>
                  <span
                    className="
                      text-[13px]
                      text-[#211A18]/35
                      line-through
                    "
                  >
                    ₹
                    {actualPrice.toLocaleString(
                      "en-IN",
                      {
                        maximumFractionDigits:
                          2,
                      }
                    )}
                  </span>

                  {discountPercent >
                    0 && (
                    <span
                      className="
                        rounded-full
                        bg-[#F8E5E8]
                        px-3
                        py-1.5
                        text-[9px]
                        font-semibold
                        text-[#9D173E]
                      "
                    >
                      {
                        discountPercent
                      }
                      % OFF
                    </span>
                  )}
                </>
              )}
          </div>

          {discountAmount >
            0 &&
            actualPrice >
              sellingPrice && (
              <p
                className="
                  mt-2
                  text-[10px]
                  font-medium
                  text-green-700
                "
              >
                You save ₹
                {discountAmount.toLocaleString(
                  "en-IN",
                  {
                    maximumFractionDigits:
                      2,
                  }
                )}
              </p>
            )}

          {/* COLORS */}

          {activeColors.length >
            0 && (
            <div className="mt-9">
              <p
                className="
                  text-[13px]
                  font-semibold
                "
              >
                Color:{" "}

                <span
                  className="
                    font-normal
                    text-[#211A18]/55
                  "
                >
                  {colorName}
                </span>
              </p>

              <div
                className="
                  mt-4
                  flex
                  flex-wrap
                  gap-3
                "
              >
                {activeColors.map(
                  (
                    color,
                    index
                  ) => {
                    const colorImage =
                      color.images?.find(
                        (
                          image
                        ) =>
                          image.isDefault ===
                          true
                      )?.url ||
                      color.images?.[0]
                        ?.url ||
                      "";

                    return (
                      <button
                        key={
                          color._id ||
                          color.id ||
                          color.slugProduct ||
                          index
                        }
                        type="button"
                        onClick={() =>
                          selectColor(
                            index
                          )
                        }
                        className="
                          w-[76px]
                          text-center
                        "
                      >
                        <div
                          className={`
                            aspect-[4/5]
                            overflow-hidden
                            rounded-lg
                            border-2
                            bg-[#F3EEE8]

                            ${
                              selectedColorIndex ===
                              index
                                ? "border-[#211A18]"
                                : "border-transparent"
                            }
                          `}
                        >
                          {colorImage && (
                            <img
                              src={
                                colorImage
                              }
                              alt={
                                color.nameColor ||
                                name
                              }
                              className="
                                h-full
                                w-full
                                object-cover
                              "
                            />
                          )}
                        </div>

                        <span
                          className="
                            mt-1.5
                            block
                            truncate
                            text-[9px]
                          "
                        >
                          {
                            color.nameColor
                          }
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* SIZES */}

          {sizes.length >
            0 && (
            <div className="mt-9">
              <p
                className="
                  text-[13px]
                  font-semibold
                "
              >
                Select Size
              </p>

              <div
                className="
                  mt-4
                  flex
                  flex-wrap
                  gap-3
                "
              >
                {sizes.map(
                  (
                    size,
                    index
                  ) => {
                    const stock =
                      Number(
                        size.stock ||
                          0
                      );

                    const disabled =
                      stock <=
                        0 ||
                      size.isActive ===
                        false;

                    return (
                      <button
                        key={
                          size._id ||
                          size.id ||
                          index
                        }
                        type="button"
                        disabled={
                          disabled
                        }
                        onClick={() =>
                          selectSize(
                            index
                          )
                        }
                        className={`
                          min-w-[48px]
                          rounded-lg
                          border
                          px-4
                          py-3
                          text-[11px]
                          font-semibold

                          ${
                            selectedSizeIndex ===
                            index
                              ? "border-[#211A18] bg-[#211A18] text-white"
                              : "border-black/20 bg-white"
                          }

                          ${
                            disabled
                              ? "cursor-not-allowed opacity-30 line-through"
                              : ""
                          }
                        `}
                      >
                        {
                          size.size ||
                          size.name
                        }
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* STOCK */}

          <div className="mt-7">
            {currentStock <=
            0 ? (
              <p
                className="
                  text-[13px]
                  font-semibold
                  text-red-600
                "
              >
                Out of Stock
              </p>
            ) : isLowStock ? (
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-lg
                  border
                  border-[#F0CAD5]
                  bg-[#FFF5F7]
                  px-3
                  py-2
                "
              >
                <span
                  className="
                    h-2
                    w-2
                    animate-pulse
                    rounded-full
                    bg-[#9D173E]
                  "
                />

                <p
                  className="
                    text-[12px]
                    font-semibold
                    text-[#9D173E]
                  "
                >
                  Few stocks are
                  available, grab it
                  now
                </p>
              </div>
            ) : (
              <p
                className="
                  text-[13px]
                  font-medium
                  text-green-700
                "
              >
                In Stock (
                {currentStock})
              </p>
            )}
          </div>

          {/* ACTIONS */}

          <div
            className="
              mt-6
              grid
              grid-cols-[110px_minmax(0,1fr)_48px]
              gap-3

              sm:grid-cols-[130px_minmax(0,1fr)_48px]
            "
          >
            {/* QUANTITY */}

            <div
              className="
                flex
                h-12
                items-center
                justify-between
                rounded-lg
                border
                border-black/30
                px-3
              "
            >
              <button
                type="button"
                onClick={
                  decreaseQuantity
                }
                disabled={
                  quantity <=
                  1
                }
              >
                −
              </button>

              <span
                className="
                  text-sm
                  font-semibold
                "
              >
                {quantity}
              </span>

              <button
                type="button"
                onClick={
                  increaseQuantity
                }
                disabled={
                  currentStock <=
                    0 ||
                  quantity >=
                    currentStock
                }
              >
                +
              </button>
            </div>

            {/* ADD TO BAG */}

            <button
              type="button"
              onClick={() =>
                void handleAddToBag()
              }
              disabled={
                cartBusy ||
                currentStock <=
                  0
              }
              className="
                h-12
                rounded-lg
                bg-[#2F2D2D]
                px-5
                text-[11px]
                font-semibold
                uppercase
                tracking-[0.04em]
                text-white

                transition

                hover:bg-[#9D173E]

                disabled:cursor-not-allowed
                disabled:bg-[#aaa]
              "
            >
              {cartBusy
                ? "Adding..."
                : currentStock <=
                    0
                  ? "Out Of Stock"
                  : !selectedSize
                    ? "Select Size"
                    : "Add To Bag"}
            </button>

            {/* WISHLIST */}

            <button
              type="button"
              onClick={() =>
                void toggleWishlist()
              }
              disabled={
                wishlistBusy
              }
              aria-label={
                wishlisted
                  ? "Remove from wishlist"
                  : "Add to wishlist"
              }
              title={
                wishlisted
                  ? "Remove from wishlist"
                  : "Add to wishlist"
              }
              className={`
                flex
                h-12
                w-12
                items-center
                justify-center

                rounded-lg

                border

                text-[21px]

                transition

                ${
                  wishlisted
                    ? "border-[#9D173E] bg-[#9D173E] text-white"
                    : "border-[#9D173E]/30 bg-white text-[#9D173E] hover:bg-[#FFF2F5]"
                }

                disabled:opacity-50
              `}
            >
              {wishlistBusy
                ? "…"
                : wishlisted
                  ? "♥"
                  : "♡"}
            </button>
          </div>

          {/* MESSAGE */}

          {actionMessage && (
            <div
              className={`
                mt-4
                rounded-lg
                border
                px-4
                py-3
                text-[11px]
                font-medium

                ${
                  actionError
                    ? "border-red-200 bg-red-50 text-red-600"
                    : "border-green-200 bg-green-50 text-green-700"
                }
              `}
            >
              {
                actionMessage
              }
            </div>
          )}
        </div>
      </section>

      {/* DESCRIPTION */}

      {descriptionHtml && (
        <section
          className="
            border-t
            border-black/10
            px-4
            py-12

            md:px-6
          "
        >
          <div
            className="
              mx-auto
              max-w-[1180px]
            "
          >
            <p
              className="
                text-[9px]
                font-semibold
                uppercase
                tracking-[0.18em]
                text-[#9D173E]
              "
            >
              Product Information
            </p>

            <h2
              className="
                mt-2
                text-2xl
                font-semibold
              "
            >
              Product Description
            </h2>

            <div
              className="
                product-description
                mt-6
              "
              dangerouslySetInnerHTML={{
                __html:
                  descriptionHtml,
              }}
            />
          </div>
        </section>
      )}
    </main>
  );
}