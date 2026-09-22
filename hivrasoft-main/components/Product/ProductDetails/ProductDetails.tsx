"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/* =========================================================
   TYPES
========================================================= */

type ProductImage = {
  url: string;
  publicId?: string;
};

type ProductSize = {
  size: string;
  sku?: string;
  stock: number;
  isActive?: boolean;

  image?: ProductImage;
  images?: ProductImage[];
};

type ProductColor = {
  name: string;
  slug?: string;
  hex?: string;

  images?: ProductImage[];
  sizes?: ProductSize[];

  isActive?: boolean;
  sortOrder?: number;
};

type ProductCategory = {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
};

export type ProductDetailsData = {
  _id?: string;
  id?: string;

  name: string;
  slug: string;

  shortDescription?: string;
  description?: string;

  price: number;
  compareAtPrice?: number;

  stock?: number;

  mainImages?: ProductImage[];
  colors?: ProductColor[];

  categories?: ProductCategory[];

  status?: string;

  isFeatured?: boolean;
  isNewLaunch?: boolean;

  tags?: string[];

  seoTitle?: string;
  seoDescription?: string;
};

/* =========================================================
   CLEAN DESCRIPTION
========================================================= */

function cleanDescriptionHtml(
  html?: string
) {
  if (
    typeof html !== "string"
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
   COMPONENT
========================================================= */

export default function ProductDetails({
  product,
}: {
  product: ProductDetailsData;
}) {
  const thumbnailRef =
    useRef<HTMLDivElement>(
      null
    );

  /* =======================================================
     MAIN IMAGES
  ======================================================= */

  const mainImages =
    useMemo(() => {
      if (
        !Array.isArray(
          product.mainImages
        )
      ) {
        return [];
      }

      return product.mainImages.filter(
        (image) =>
          Boolean(image?.url)
      );
    }, [
      product.mainImages,
    ]);

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

      return [
        ...product.colors,
      ]
        .filter(
          (color) =>
            color.isActive !==
            false
        )
        .sort(
          (
            first,
            second
          ) =>
            Number(
              first.sortOrder ??
                0
            ) -
            Number(
              second.sortOrder ??
                0
            )
        );
    }, [
      product.colors,
    ]);

  /* =======================================================
     STATE
  ======================================================= */

  const [
    selectedColorIndex,
    setSelectedColorIndex,
  ] = useState<
    number | null
  >(null);

  const [
    selectedSizeIndex,
    setSelectedSizeIndex,
  ] = useState<
    number | null
  >(null);

  const [
    activeImageIndex,
    setActiveImageIndex,
  ] = useState(0);

  const [
    quantity,
    setQuantity,
  ] = useState(1);

  const [
    sliderPaused,
    setSliderPaused,
  ] = useState(false);

  const [
    galleryFading,
    setGalleryFading,
  ] = useState(false);

  /* =======================================================
     SELECTED COLOR
  ======================================================= */

  const selectedColor =
    selectedColorIndex !==
    null
      ? activeColors[
          selectedColorIndex
        ]
      : undefined;

  /* =======================================================
     COLOR IMAGES
  ======================================================= */

  const selectedColorImages =
    useMemo(() => {
      if (
        !selectedColor ||
        !Array.isArray(
          selectedColor.images
        )
      ) {
        return [];
      }

      return selectedColor.images.filter(
        (image) =>
          Boolean(image?.url)
      );
    }, [
      selectedColor,
    ]);

  /* =======================================================
     SIZE SOURCE
  ======================================================= */

  const sizeSourceColorIndex =
    selectedColorIndex !==
    null
      ? selectedColorIndex
      : activeColors.length >
          0
        ? 0
        : null;

  const sizeSourceColor =
    sizeSourceColorIndex !==
    null
      ? activeColors[
          sizeSourceColorIndex
        ]
      : undefined;

  const availableSizes =
    useMemo(() => {
      if (
        !sizeSourceColor ||
        !Array.isArray(
          sizeSourceColor.sizes
        )
      ) {
        return [];
      }

      return sizeSourceColor.sizes;
    }, [
      sizeSourceColor,
    ]);

  const selectedSize =
    selectedSizeIndex !==
    null
      ? availableSizes[
          selectedSizeIndex
        ]
      : undefined;

  /* =======================================================
     SIZE IMAGES
  ======================================================= */

  const selectedSizeImages =
    useMemo(() => {
      if (!selectedSize) {
        return [];
      }

      if (
        Array.isArray(
          selectedSize.images
        ) &&
        selectedSize.images
          .length >
          0
      ) {
        return selectedSize.images.filter(
          (image) =>
            Boolean(image?.url)
        );
      }

      if (
        selectedSize.image?.url
      ) {
        return [
          selectedSize.image,
        ];
      }

      return [];
    }, [
      selectedSize,
    ]);

  /* =======================================================
     DISPLAY IMAGES
  ======================================================= */

  const displayImages =
    useMemo(() => {
      if (
        selectedSizeImages.length >
        0
      ) {
        return selectedSizeImages;
      }

      if (
        selectedColorImages.length >
        0
      ) {
        return selectedColorImages;
      }

      return mainImages;
    }, [
      selectedSizeImages,
      selectedColorImages,
      mainImages,
    ]);

  /* =======================================================
     INDEX SAFETY
  ======================================================= */

  useEffect(() => {
    if (
      displayImages.length ===
      0
    ) {
      setActiveImageIndex(0);

      return;
    }

    if (
      activeImageIndex >=
      displayImages.length
    ) {
      setActiveImageIndex(0);
    }
  }, [
    activeImageIndex,
    displayImages.length,
  ]);

  /* =======================================================
     AUTO SLIDER
  ======================================================= */

  useEffect(() => {
    if (
      sliderPaused ||
      displayImages.length <=
        1
    ) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          setActiveImageIndex(
            (current) =>
              (current + 1) %
              displayImages.length
          );
        },
        4000
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [
    sliderPaused,
    displayImages.length,
  ]);

  /* =======================================================
     PRICE
  ======================================================= */

  const sellingPrice =
    Number(
      product.price
    ) || 0;

  const comparePrice =
    Number(
      product.compareAtPrice ||
        0
    );

  const hasDiscount =
    comparePrice >
    sellingPrice;

  const discountPercent =
    hasDiscount
      ? Math.round(
          ((comparePrice -
            sellingPrice) /
            comparePrice) *
            100
        )
      : 0;

  /* =======================================================
     STOCK
  ======================================================= */

  const hasSizeVariants =
    activeColors.some(
      (color) =>
        Array.isArray(
          color.sizes
        ) &&
        color.sizes.length >
          0
    );

  const variantStock =
    activeColors.reduce(
      (
        total,
        color
      ) => {
        if (
          !Array.isArray(
            color.sizes
          )
        ) {
          return total;
        }

        return (
          total +
          color.sizes.reduce(
            (
              current,
              size
            ) =>
              current +
              Math.max(
                0,
                Number(
                  size.stock
                ) || 0
              ),
            0
          )
        );
      },
      0
    );

  const totalStock =
    hasSizeVariants
      ? variantStock
      : Math.max(
          0,
          Number(
            product.stock
          ) || 0
        );

  const currentStock =
    selectedSize
      ? Math.max(
          0,
          Number(
            selectedSize.stock
          ) || 0
        )
      : totalStock;

  /* =======================================================
     FADE CHANGE
  ======================================================= */

  const changeGallery = (
    callback: () => void
  ) => {
    setGalleryFading(true);

    window.setTimeout(
      () => {
        callback();

        setActiveImageIndex(0);

        window.setTimeout(
          () => {
            setGalleryFading(
              false
            );
          },
          60
        );
      },
      160
    );
  };

  /* =======================================================
     COLOR SELECT
  ======================================================= */

  const handleColorSelect = (
    index: number
  ) => {
    const color =
      activeColors[index];

    if (!color) {
      return;
    }

    changeGallery(() => {
      setSelectedColorIndex(
        index
      );

      setSelectedSizeIndex(
        null
      );

      setQuantity(1);
    });
  };

  /* =======================================================
     SIZE SELECT
  ======================================================= */

  const handleSizeSelect = (
    index: number
  ) => {
    const size =
      availableSizes[index];

    if (!size) {
      return;
    }

    if (
      size.isActive ===
        false ||
      Number(
        size.stock
      ) <= 0
    ) {
      return;
    }

    changeGallery(() => {
      if (
        selectedColorIndex ===
          null &&
        sizeSourceColorIndex !==
          null
      ) {
        setSelectedColorIndex(
          sizeSourceColorIndex
        );
      }

      setSelectedSizeIndex(
        index
      );

      setQuantity(1);
    });
  };

  /* =======================================================
     IMAGE NAVIGATION
  ======================================================= */

  const previousImage =
    () => {
      if (
        displayImages.length <=
        1
      ) {
        return;
      }

      setActiveImageIndex(
        (current) =>
          current === 0
            ? displayImages.length -
              1
            : current - 1
      );
    };

  const nextImage =
    () => {
      if (
        displayImages.length <=
        1
      ) {
        return;
      }

      setActiveImageIndex(
        (current) =>
          (current + 1) %
          displayImages.length
      );
    };

  /* =======================================================
     THUMBNAIL SCROLL
  ======================================================= */

  const scrollThumbnails = (
    direction:
      | "up"
      | "down"
  ) => {
    const element =
      thumbnailRef.current;

    if (!element) {
      return;
    }

    const amount = 110;

    if (
      window.innerWidth >=
      1024
    ) {
      element.scrollBy({
        top:
          direction ===
          "down"
            ? amount
            : -amount,

        behavior:
          "smooth",
      });

      return;
    }

    element.scrollBy({
      left:
        direction ===
        "down"
          ? amount
          : -amount,

      behavior:
        "smooth",
    });
  };

  /* =======================================================
     QUANTITY
  ======================================================= */

  const decreaseQuantity =
    () => {
      setQuantity(
        (current) =>
          Math.max(
            1,
            current - 1
          )
      );
    };

  const increaseQuantity =
    () => {
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
    };

  /* =======================================================
     ADD TO BAG
  ======================================================= */

  const canAddToBag =
    totalStock >
      0 &&
    (
      !hasSizeVariants ||
      Boolean(
        selectedSize
      )
    );

  /* =======================================================
     DESCRIPTION
  ======================================================= */

  const descriptionHtml =
    useMemo(
      () =>
        cleanDescriptionHtml(
          product.description
        ),
      [
        product.description,
      ]
    );

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main
      className="
        min-h-screen
        overflow-x-hidden
        bg-white
        text-[#292526]
      "
    >
      {/* =================================================
          BREADCRUMB REMOVED
      ================================================= */}

      <section
        className="
          mx-auto
          grid
          w-full
          max-w-[1180px]
          grid-cols-1
          gap-6
          px-4
          pb-10
          pt-8

          sm:px-5

          md:px-6

          lg:grid-cols-[88px_minmax(0,420px)_minmax(0,1fr)]
          lg:items-start
          lg:gap-6

          xl:grid-cols-[88px_minmax(0,470px)_minmax(0,1fr)]
          xl:gap-10
        "
      >
        {/* =================================================
            LEFT THUMBNAILS
        ================================================= */}

        <aside
          className="
            order-2
            min-w-0

            lg:order-1
          "
        >
          <div
            className="
              relative
            "
          >
            {displayImages.length >
              4 && (
              <button
                type="button"
                onClick={() =>
                  scrollThumbnails(
                    "up"
                  )
                }
                aria-label="Scroll thumbnails up"
                className="
                  absolute
                  left-1/2
                  top-0
                  z-30
                  hidden
                  h-7
                  w-7
                  -translate-x-1/2
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-black/10
                  bg-white
                  text-[13px]
                  shadow

                  lg:flex
                "
              >
                ↑
              </button>
            )}

            <div
              ref={
                thumbnailRef
              }
              className="
                flex
                gap-3
                overflow-x-auto
                pb-1

                [&::-webkit-scrollbar]:hidden

                lg:max-h-[540px]
                lg:flex-col
                lg:overflow-x-hidden
                lg:overflow-y-auto
                lg:pt-8
              "
              style={{
                scrollbarWidth:
                  "none",
              }}
            >
              {displayImages.map(
                (
                  image,
                  index
                ) => (
                  <button
                    key={`${image.url}-thumb-${index}`}
                    type="button"
                    onClick={() =>
                      setActiveImageIndex(
                        index
                      )
                    }
                    className={`
                      group
                      h-[88px]
                      w-[68px]
                      shrink-0
                      overflow-hidden
                      rounded-[9px]
                      border
                      bg-[#F2F2F2]
                      transition-all

                      ${
                        activeImageIndex ===
                        index
                          ? "border-[#292526]"
                          : "border-transparent"
                      }
                    `}
                  >
                    <img
                      src={
                        image.url
                      }
                      alt={`${product.name} thumbnail ${
                        index + 1
                      }`}
                      className="
                        h-full
                        w-full
                        object-cover
                        object-center
                        transition-transform
                        duration-300

                        group-hover:scale-105
                      "
                    />
                  </button>
                )
              )}
            </div>

            {displayImages.length >
              4 && (
              <button
                type="button"
                onClick={() =>
                  scrollThumbnails(
                    "down"
                  )
                }
                aria-label="Scroll thumbnails down"
                className="
                  absolute
                  bottom-[-12px]
                  left-1/2
                  z-30
                  hidden
                  h-7
                  w-7
                  -translate-x-1/2
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-black/10
                  bg-white
                  text-[13px]
                  shadow

                  lg:flex
                "
              >
                ↓
              </button>
            )}
          </div>
        </aside>

        {/* =================================================
            BIG IMAGE
        ================================================= */}

        <div
          className="
            order-1
            min-w-0

            lg:order-2
          "
        >
          <div
            className="
              relative
              mx-auto
              w-full
              overflow-hidden
              rounded-[10px]
              bg-[#F3F3F3]
            "
            style={{
              aspectRatio:
                "4 / 5",
            }}
            onMouseEnter={() =>
              setSliderPaused(
                true
              )
            }
            onMouseLeave={() =>
              setSliderPaused(
                false
              )
            }
          >
            {displayImages.length >
            0 ? (
              displayImages.map(
                (
                  image,
                  index
                ) => (
                  <img
                    key={`${image.url}-large-${index}`}
                    src={
                      image.url
                    }
                    alt={`${product.name} ${
                      index + 1
                    }`}
                    className={`
                      absolute
                      inset-0
                      h-full
                      w-full
                      object-cover
                      object-center
                      transition-all
                      duration-500

                      ${
                        activeImageIndex ===
                        index
                          ? "opacity-100"
                          : "opacity-0"
                      }

                      ${
                        galleryFading
                          ? "!opacity-0"
                          : ""
                      }
                    `}
                  />
                )
              )
            ) : (
              <div
                className="
                  flex
                  h-full
                  w-full
                  items-center
                  justify-center
                  text-[11px]
                  text-black/35
                "
              >
                No Product Image
              </div>
            )}

            {displayImages.length >
              1 && (
              <button
                type="button"
                onClick={
                  previousImage
                }
                aria-label="Previous image"
                className="
                  absolute
                  left-3
                  top-1/2
                  z-20
                  flex
                  h-9
                  w-9
                  -translate-y-1/2
                  items-center
                  justify-center
                  rounded-full
                  bg-white/90
                  text-[20px]
                  shadow
                "
              >
                ‹
              </button>
            )}

            {displayImages.length >
              1 && (
              <button
                type="button"
                onClick={
                  nextImage
                }
                aria-label="Next image"
                className="
                  absolute
                  right-3
                  top-1/2
                  z-20
                  flex
                  h-9
                  w-9
                  -translate-y-1/2
                  items-center
                  justify-center
                  rounded-full
                  bg-white/90
                  text-[20px]
                  shadow
                "
              >
                ›
              </button>
            )}

            {displayImages.length >
              1 && (
              <div
                className="
                  absolute
                  bottom-4
                  left-1/2
                  z-20
                  flex
                  -translate-x-1/2
                  gap-1.5
                "
              >
                {displayImages.map(
                  (
                    _,
                    index
                  ) => (
                    <button
                      key={
                        index
                      }
                      type="button"
                      onClick={() =>
                        setActiveImageIndex(
                          index
                        )
                      }
                      className={`
                        h-[5px]
                        rounded-full

                        ${
                          activeImageIndex ===
                          index
                            ? "w-5 bg-[#9D173E]"
                            : "w-[5px] bg-black/25"
                        }
                      `}
                    />
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* =================================================
            PRODUCT INFORMATION
        ================================================= */}

        <div
          className="
            order-3
            min-w-0
            pt-1
          "
        >
          {/* TITLE */}

          <div
            className="
              flex
              items-start
              justify-between
              gap-4
            "
          >
            <div
              className="
                min-w-0
              "
            >
              <h1
                className="
                  text-[18px]
                  font-semibold
                  leading-7
                  text-[#211A18]

                  sm:text-[20px]
                "
              >
                {
                  product.name
                }
              </h1>

              {product.shortDescription && (
                <p
                  className="
                    mt-2
                    text-[9px]
                    leading-5
                    text-black/45
                  "
                >
                  {
                    product.shortDescription
                  }
                </p>
              )}
            </div>

            <div
              className="
                flex
                shrink-0
                gap-2
              "
            >
              <button
                type="button"
                aria-label="Wishlist"
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-black/15
                  bg-white
                  text-[20px]
                "
              >
                ♡
              </button>

              <button
                type="button"
                aria-label="Share"
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-black/15
                  bg-white
                "
              >
                <ShareIcon />
              </button>
            </div>
          </div>

          {/* =================================================
              PRICE
          ================================================= */}

          <div
            className="
              mt-6
              flex
              flex-wrap
              items-center
              gap-2
            "
          >
            <strong
              className="
                text-[19px]
              "
            >
              ₹
              {sellingPrice.toLocaleString(
                "en-IN"
              )}
            </strong>

            {hasDiscount && (
              <>
                <span
                  className="
                    text-[9px]
                    text-black/35
                    line-through
                  "
                >
                  ₹
                  {comparePrice.toLocaleString(
                    "en-IN"
                  )}
                </span>

                <span
                  className="
                    text-[8px]
                    font-semibold
                    text-green-700
                  "
                >
                  {
                    discountPercent
                  }% OFF
                </span>
              </>
            )}

            <span
              className="
                text-[7px]
                text-black/45
              "
            >
              (Incl. Of All Taxes)
            </span>
          </div>

          {/* =================================================
              COLOR
          ================================================= */}

          {activeColors.length >
            0 && (
            <div
              className="
                mt-7
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >
                <strong
                  className="
                    text-[14px]
                  "
                >
                  Color:
                </strong>

                <span
                  className="
                    text-[12px]
                    text-black/50
                  "
                >
                  {selectedColor
                    ?.name ||
                    "Select Color"}
                </span>
              </div>

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
                    const image =
                      color
                        .images?.[0]
                        ?.url;

                    const active =
                      selectedColorIndex ===
                      index;

                    return (
                      <button
                        key={`${color.name}-${index}`}
                        type="button"
                        onClick={() =>
                          handleColorSelect(
                            index
                          )
                        }
                        className="
                          w-[78px]
                          text-center
                        "
                      >
                        <div
                          className={`
                            aspect-[4/5]
                            overflow-hidden
                            rounded-[8px]
                            border-2
                            bg-[#F2F2F2]
                            transition

                            ${
                              active
                                ? "border-[#292526]"
                                : "border-transparent"
                            }
                          `}
                        >
                          {image ? (
                            <img
                              src={
                                image
                              }
                              alt={
                                color.name
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
                              "
                            >
                              <span
                                className="
                                  h-8
                                  w-8
                                  rounded-full
                                  border
                                  border-black/10
                                "
                                style={{
                                  backgroundColor:
                                    color.hex ||
                                    "#dddddd",
                                }}
                              />
                            </div>
                          )}
                        </div>

                        <span
                          className="
                            mt-1
                            block
                            truncate
                            text-[8px]
                          "
                        >
                          {
                            color.name
                          }
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* =================================================
              SIZE
          ================================================= */}

          {availableSizes.length >
            0 && (
            <div
              className="
                mt-6
              "
            >
              <div
                className="
                  flex
                  flex-wrap
                  gap-3
                "
              >
                {availableSizes.map(
                  (
                    size,
                    index
                  ) => {
                    const disabled =
                      size.isActive ===
                        false ||
                      Number(
                        size.stock
                      ) <= 0;

                    const active =
                      selectedSizeIndex ===
                      index;

                    return (
                      <button
                        key={`${size.size}-${index}`}
                        type="button"
                        disabled={
                          disabled
                        }
                        onClick={() =>
                          handleSizeSelect(
                            index
                          )
                        }
                        className={`
                          flex
                          h-[44px]
                          min-w-[48px]
                          items-center
                          justify-center
                          rounded-[7px]
                          border
                          px-4
                          text-[10px]
                          font-semibold
                          uppercase

                          ${
                            active
                              ? "border-[#292526] bg-[#292526] text-white"
                              : "border-black/25 bg-white"
                          }

                          ${
                            disabled
                              ? "cursor-not-allowed opacity-30 line-through"
                              : ""
                          }
                        `}
                      >
                        {
                          size.size
                        }
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* =================================================
              SIZE GUIDE
          ================================================= */}

          {hasSizeVariants && (
            <div
              className="
                mt-5
                flex
                flex-wrap
                items-center
                gap-3
                text-[8px]
              "
            >
              <span>
                📏 Not sure about your size?
              </span>

              <button
                type="button"
                className="
                  rounded-[6px]
                  bg-[#F0F0F0]
                  px-3
                  py-2
                  font-semibold
                "
              >
                Size Chart
              </button>
            </div>
          )}

          {/* =================================================
              QUANTITY + BAG
          ================================================= */}

          <div
            className="
              mt-5
              grid
              grid-cols-1
              gap-3

              sm:grid-cols-[130px_minmax(0,1fr)]
            "
          >
            <div
              className="
                flex
                h-[50px]
                items-center
                justify-between
                rounded-[8px]
                border
                border-black/60
                px-4
              "
            >
              <button
                type="button"
                onClick={
                  decreaseQuantity
                }
              >
                −
              </button>

              <strong>
                {
                  quantity
                }
              </strong>

              <button
                type="button"
                onClick={
                  increaseQuantity
                }
                disabled={
                  quantity >=
                  currentStock
                }
                className="
                  disabled:opacity-25
                "
              >
                +
              </button>
            </div>

            <button
              type="button"
              disabled={
                !canAddToBag
              }
              className="
                h-[50px]
                rounded-[8px]
                bg-[#2F2D2D]
                px-5
                text-[11px]
                font-semibold
                uppercase
                text-white

                hover:bg-[#9D173E]

                disabled:cursor-not-allowed
                disabled:bg-[#AFAFAF]
              "
            >
              {totalStock <=
              0
                ? "Out Of Stock"
                : hasSizeVariants &&
                    !selectedSize
                  ? "Select Size"
                  : "Add To Bag"}
            </button>
          </div>
        </div>
      </section>

      {/* =================================================
          PRODUCT DESCRIPTION
          PRODUCT SECTION KE NEECH
      ================================================= */}

      <section
        className="
          w-full
          border-t
          border-black/[0.07]
          bg-white
          px-4
          py-10

          sm:px-5

          md:px-6
          md:py-14
        "
      >
        <div
          className="
            mx-auto
            w-full
            max-w-[1180px]
          "
        >
          <p
            className="
              text-[8px]
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
              text-[22px]
              font-semibold
              leading-tight
              text-[#211A18]

              sm:text-[25px]
            "
          >
            Product Description
          </h2>

          {descriptionHtml.trim() ? (
            <div
              className="
                mt-6
                w-full
                max-w-[900px]
                text-[12px]
                leading-7
                text-[#554A45]

                sm:text-[13px]

                [&_a]:font-medium
                [&_a]:text-[#9D173E]
                [&_a]:underline
                [&_a]:underline-offset-4

                [&_h1]:mb-5
                [&_h1]:mt-6
                [&_h1]:text-[24px]
                [&_h1]:font-semibold
                [&_h1]:leading-tight
                [&_h1]:text-[#211A18]

                [&_h2]:mb-4
                [&_h2]:mt-8
                [&_h2]:text-[20px]
                [&_h2]:font-semibold
                [&_h2]:leading-tight
                [&_h2]:text-[#211A18]

                [&_h3]:mb-3
                [&_h3]:mt-6
                [&_h3]:text-[16px]
                [&_h3]:font-semibold
                [&_h3]:text-[#292526]

                [&_img]:my-6
                [&_img]:h-auto
                [&_img]:max-w-full
                [&_img]:rounded-[10px]

                [&_li]:mb-2

                [&_ol]:my-4
                [&_ol]:list-decimal
                [&_ol]:pl-6

                [&_p]:mb-4

                [&_strong]:font-semibold
                [&_strong]:text-[#211A18]

                [&_ul]:my-4
                [&_ul]:list-disc
                [&_ul]:pl-6
              "
              dangerouslySetInnerHTML={{
                __html:
                  descriptionHtml,
              }}
            />
          ) : (
            <p
              className="
                mt-5
                text-[12px]
                text-black/40
              "
            >
              Description not available.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   SHARE ICON
   IMPORTANT: SIRF EK BAAR HAI
========================================================= */

function ShareIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle
        cx="18"
        cy="5"
        r="3"
      />

      <circle
        cx="6"
        cy="12"
        r="3"
      />

      <circle
        cx="18"
        cy="19"
        r="3"
      />

      <path d="m8.59 13.51 6.83 3.98" />

      <path d="m15.41 6.51-6.82 3.98" />
    </svg>
  );
}