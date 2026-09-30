"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import {
  menMenu,
  type MenBanner,
  type MenProduct,
} from "@/src/data/men";

import {
  addPendingWishlistProduct,
  addProductToCart,
  addProductToWishlist,
  checkLoggedIn,
  getPendingWishlistIds,
  notifyCartUpdated,
  notifyWishlistUpdated,
  removePendingWishlistProduct,
  removeProductFromWishlist,
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
   PROPS
========================================================= */

type MenCatalogProps = {
  products: MenProduct[];

  banners: MenBanner[];

  title: string;

  description: string;

  category?: string;

  subcategory?: string;
};

/* =========================================================
   TOAST
========================================================= */

type ToastState = {
  message: string;

  type: "success" | "error";
} | null;

/* =========================================================
   PRODUCT API TYPES
========================================================= */

type ApiImage = {
  _id?: string;

  id?: string;

  url?: string;

  isDefault?: boolean;
};

type ApiSize = {
  _id?: string;

  id?: string;

  sizeId?: string;

  size?: string;

  name?: string;

  sku?: string;

  stock?: number | string;

  isActive?: boolean;

  isDefault?: boolean;
};

type ApiColor = {
  _id?: string;

  id?: string;

  colorId?: string;

  variantId?: string;

  nameProduct?: string;

  slugProduct?: string;

  nameColor?: string;

  name?: string;

  slugColor?: string;

  slug?: string;

  isActive?: boolean;

  isDefault?: boolean;

  images?: ApiImage[];

  sizes?: ApiSize[];
};

type ApiProduct = {
  _id?: string;

  id?: string;

  productId?: string;

  name?: string;

  slug?: string;

  colors?: ApiColor[];

  selectedColor?: ApiColor;

  defaultColor?: ApiColor;

  color?: ApiColor;
};

/* =========================================================
   QUICK ADD STATE
========================================================= */

type QuickAddState = {
  product: MenProduct;

  productId: string;

  colorId: string;

  colorName: string;

  image: string;

  sizes: ApiSize[];
} | null;

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
   ID HELPER
========================================================= */

function getObjectId(
  object: any,
  keys: string[]
): string {
  if (
    !object ||
    typeof object !== "object"
  ) {
    return "";
  }

  for (const key of keys) {
    const value =
      object[key];

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      continue;
    }

    if (
      typeof value === "string" ||
      typeof value === "number"
    ) {
      const result =
        String(
          value
        ).trim();

      if (result) {
        return result;
      }

      continue;
    }

    if (
      typeof value === "object"
    ) {
      const nested =
        String(
          value?._id ||
            value?.id ||
            value?.$oid ||
            ""
        ).trim();

      if (nested) {
        return nested;
      }
    }
  }

  return "";
}

/* =========================================================
   EXTRACT SINGLE PRODUCT
========================================================= */

function extractSingleProduct(
  data: any
): ApiProduct | null {
  if (
    !data ||
    typeof data !== "object"
  ) {
    return null;
  }

  if (
    data.product &&
    typeof data.product === "object"
  ) {
    return data.product;
  }

  if (
    data.data?.product &&
    typeof data.data.product === "object"
  ) {
    return data.data.product;
  }

  if (
    data.data?.item &&
    typeof data.data.item === "object"
  ) {
    return data.data.item;
  }

  if (
    data.data &&
    typeof data.data === "object" &&
    !Array.isArray(
      data.data
    )
  ) {
    /*
     * Sometimes response:
     *
     * {
     *   success:true,
     *   data:{ _id, colors... }
     * }
     */

    if (
      data.data._id ||
      data.data.id ||
      data.data.productId ||
      data.data.colors
    ) {
      return data.data;
    }
  }

  if (
    data._id ||
    data.id ||
    data.productId ||
    data.colors
  ) {
    return data;
  }

  return null;
}

/* =========================================================
   EXTRACT PRODUCT LIST
========================================================= */

function extractProductList(
  data: any
): ApiProduct[] {
  if (
    Array.isArray(
      data
    )
  ) {
    return data;
  }

  const possibleArrays = [
    data?.products,

    data?.items,

    data?.catalog,

    data?.results,

    data?.data,

    data?.data?.products,

    data?.data?.items,

    data?.data?.catalog,

    data?.data?.results,
  ];

  for (
    const value of possibleArrays
  ) {
    if (
      Array.isArray(
        value
      )
    ) {
      return value;
    }
  }

  return [];
}

/* =========================================================
   PRODUCT ID
========================================================= */

function getProductId(
  product: ApiProduct
): string {
  return getObjectId(
    product,
    [
      "_id",
      "id",
      "productId",
    ]
  );
}

/* =========================================================
   COLORS
========================================================= */

function getProductColors(
  product: ApiProduct
): ApiColor[] {
  const colors:
    ApiColor[] = [];

  if (
    Array.isArray(
      product.colors
    )
  ) {
    for (
      const color of product.colors
    ) {
      if (
        color &&
        color.isActive !== false
      ) {
        colors.push(
          color
        );
      }
    }
  }

  const extraColors = [
    product.selectedColor,

    product.defaultColor,

    product.color,
  ];

  for (
    const color of extraColors
  ) {
    if (
      color &&
      color.isActive !== false
    ) {
      colors.push(
        color
      );
    }
  }

  const seen =
    new Set<string>();

  return colors.filter(
    (
      color,
      index
    ) => {
      const key =
        getObjectId(
          color,
          [
            "_id",
            "id",
            "colorId",
            "variantId",
          ]
        ) ||
        color.slugProduct ||
        color.slugColor ||
        color.slug ||
        String(
          index
        );

      if (
        seen.has(
          key
        )
      ) {
        return false;
      }

      seen.add(
        key
      );

      return true;
    }
  );
}

/* =========================================================
   FIND CURRENT COLOR
========================================================= */

function findCurrentColor(
  apiProduct: ApiProduct,
  cardProduct: MenProduct
): ApiColor | null {
  const colors =
    getProductColors(
      apiProduct
    );

  if (
    colors.length === 0
  ) {
    return null;
  }

  const requestedSlug =
    String(
      cardProduct.slug ||
        ""
    )
      .trim()
      .toLowerCase();

  /*
   * Exact color-specific product slug.
   */

  const exactMatch =
    colors.find(
      (color) =>
        String(
          color.slugProduct ||
            ""
        )
          .trim()
          .toLowerCase() ===
        requestedSlug
    );

  if (exactMatch) {
    return exactMatch;
  }

  /*
   * selectedColor returned by clean API.
   */

  if (
    apiProduct.selectedColor &&
    apiProduct.selectedColor
      .isActive !== false
  ) {
    return apiProduct.selectedColor;
  }

  /*
   * Default color.
   */

  const defaultColor =
    colors.find(
      (color) =>
        color.isDefault === true
    );

  if (defaultColor) {
    return defaultColor;
  }

  return colors[0] || null;
}

/* =========================================================
   COLOR ID
========================================================= */

function getColorId(
  color?: ApiColor | null
): string {
  if (!color) {
    return "";
  }

  return getObjectId(
    color,
    [
      "_id",
      "id",
      "colorId",
      "variantId",
    ]
  );
}

/* =========================================================
   SIZE ID
========================================================= */

function getSizeId(
  size?: ApiSize | null
): string {
  if (!size) {
    return "";
  }

  return getObjectId(
    size,
    [
      "_id",
      "id",
      "sizeId",
    ]
  );
}

/* =========================================================
   AVAILABLE SIZES
========================================================= */

function getAvailableSizes(
  color: ApiColor
): ApiSize[] {
  if (
    !Array.isArray(
      color.sizes
    )
  ) {
    return [];
  }

  return color.sizes.filter(
    (size) => {
      if (
        size.isActive === false
      ) {
        return false;
      }

      const stock =
        Number(
          size.stock ||
            0
        );

      return (
        Number.isFinite(
          stock
        ) &&
        stock > 0
      );
    }
  );
}

/* =========================================================
   VALID CART VARIANT CHECK

   IMPORTANT FIX:

   Earlier code:
   product mil gaya -> immediately return.

   New code:
   tabhi product accept hoga jab:
   - product id
   - color id
   - at least one size id
   actually API se mil raha ho.
========================================================= */

function getUsableVariant(
  apiProduct: ApiProduct,
  cardProduct: MenProduct
): {
  productId: string;

  color: ApiColor;

  colorId: string;

  sizes: ApiSize[];
} | null {
  const productId =
    getProductId(
      apiProduct
    ) ||
    String(
      cardProduct.id ||
        ""
    ).trim();

  if (!productId) {
    return null;
  }

  const color =
    findCurrentColor(
      apiProduct,
      cardProduct
    );

  if (!color) {
    return null;
  }

  const colorId =
    getColorId(
      color
    );

  if (!colorId) {
    return null;
  }

  const availableSizes =
    getAvailableSizes(
      color
    );

  const sizesWithIds =
    availableSizes.filter(
      (size) =>
        Boolean(
          getSizeId(
            size
          )
        )
    );

  if (
    sizesWithIds.length === 0
  ) {
    return null;
  }

  return {
    productId,

    color,

    colorId,

    sizes:
      sizesWithIds,
  };
}

/* =========================================================
   MATCH PRODUCT FROM LIST
========================================================= */

function findMatchingProducts(
  products: ApiProduct[],
  cardProduct: MenProduct
): ApiProduct[] {
  const cardId =
    String(
      cardProduct.id ||
        ""
    ).trim();

  const cardSlug =
    String(
      cardProduct.slug ||
        ""
    )
      .trim()
      .toLowerCase();

  const matches =
    products.filter(
      (product) => {
        const apiId =
          getProductId(
            product
          );

        if (
          cardId &&
          apiId &&
          apiId === cardId
        ) {
          return true;
        }

        if (
          String(
            product.slug ||
              ""
          )
            .trim()
            .toLowerCase() ===
          cardSlug
        ) {
          return true;
        }

        return getProductColors(
          product
        ).some(
          (color) =>
            String(
              color.slugProduct ||
                ""
            )
              .trim()
              .toLowerCase() ===
            cardSlug
        );
      }
    );

  /*
   * Exact product ID first.
   */

  matches.sort(
    (
      first,
      second
    ) => {
      const firstExact =
        getProductId(
          first
        ) === cardId
          ? 1
          : 0;

      const secondExact =
        getProductId(
          second
        ) === cardId
          ? 1
          : 0;

      return (
        secondExact -
        firstExact
      );
    }
  );

  return matches;
}

/* =========================================================
   FETCH CART VARIANT

   This function keeps searching until it finds REAL IDs.

   APIs:
   1. /api/products/slug/:slug
   2. /api/products/catalog/:slug
   3. /api/products/active
   4. /api/products/catalog
========================================================= */

async function fetchCartVariant(
  cardProduct: MenProduct
): Promise<{
  productId: string;

  color: ApiColor;

  colorId: string;

  sizes: ApiSize[];
}> {
  const slug =
    String(
      cardProduct.slug ||
        ""
    ).trim();

  if (!slug) {
    throw new Error(
      "Product slug missing."
    );
  }

  const encodedSlug =
    encodeURIComponent(
      slug
    );

  /* =======================================================
     DETAIL ENDPOINTS
  ======================================================= */

  const detailEndpoints = [
    

    `${API_URL}/api/products/catalog/${encodedSlug}`,
  ];

  for (
    const endpoint of detailEndpoints
  ) {
    try {
      const response =
        await fetch(
          endpoint,
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

      if (!response.ok) {
        continue;
      }

      const data =
        await readJson(
          response
        );

      const single =
        extractSingleProduct(
          data
        );

      if (single) {
        const usable =
          getUsableVariant(
            single,
            cardProduct
          );

        if (usable) {
          return usable;
        }
      }

      /*
       * Sometimes detail response
       * may unexpectedly contain array.
       */

      const list =
        extractProductList(
          data
        );

      for (
        const product of findMatchingProducts(
          list,
          cardProduct
        )
      ) {
        const usable =
          getUsableVariant(
            product,
            cardProduct
          );

        if (usable) {
          return usable;
        }
      }
    } catch {
      /*
       * Continue with next public endpoint.
       */
    }
  }

  /* =======================================================
     LIST ENDPOINTS

     This is important because raw /active can contain
     embedded MongoDB subdocument _id values even if clean
     storefront detail strips them.
  ======================================================= */

  const listEndpoints = [
    `${API_URL}/api/products/active`,

    `${API_URL}/api/products/catalog`,
  ];

  for (
    const endpoint of listEndpoints
  ) {
    try {
      const response =
        await fetch(
          endpoint,
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

      if (!response.ok) {
        continue;
      }

      const data =
        await readJson(
          response
        );

      const products =
        extractProductList(
          data
        );

      const matches =
        findMatchingProducts(
          products,
          cardProduct
        );

      for (
        const product of matches
      ) {
        const usable =
          getUsableVariant(
            product,
            cardProduct
          );

        if (usable) {
          return usable;
        }
      }
    } catch {
      /*
       * Continue.
       */
    }
  }

  /*
   * No console.error here.
   * Next.js dev overlay nahi khulega.
   */

  throw new Error(
    "Product variant IDs are missing in the public product API."
  );
}

/* =========================================================
   COLOR IMAGE
========================================================= */

function getColorImage(
  color: ApiColor,
  fallback: string
): string {
  const images =
    Array.isArray(
      color.images
    )
      ? color.images
      : [];

  const defaultImage =
    images.find(
      (image) =>
        image.isDefault === true &&
        Boolean(
          image.url
        )
    );

  if (
    defaultImage?.url
  ) {
    return defaultImage.url;
  }

  const firstImage =
    images.find(
      (image) =>
        Boolean(
          image.url
        )
    );

  return (
    firstImage?.url ||
    fallback ||
    ""
  );
}

/* =========================================================
   WISHLIST
========================================================= */

function extractWishlistItems(
  data: any
): any[] {
  if (
    Array.isArray(
      data
    )
  ) {
    return data;
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
      data?.items
    )
  ) {
    return data.items;
  }

  if (
    Array.isArray(
      data?.data?.wishlist?.items
    )
  ) {
    return data.data.wishlist.items;
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
      data?.data
    )
  ) {
    return data.data;
  }

  return [];
}

function getWishlistProductId(
  item: any
): string {
  if (
    typeof item ===
    "string"
  ) {
    return item;
  }

  if (
    typeof item?.product ===
    "string"
  ) {
    return item.product;
  }

  return String(
    item?.product?._id ||
      item?.product?.id ||
      item?.productId ||
      item?._id ||
      item?.id ||
      ""
  ).trim();
}

/* =========================================================
   TOAST
========================================================= */

function Toast({
  toast,
}: {
  toast: ToastState;
}) {
  if (!toast) {
    return null;
  }

  return (
    <div
      className="
        fixed
        right-5
        top-[105px]
        z-[9999]
        w-[310px]
        max-w-[calc(100vw-40px)]
      "
    >
      <div
        className={`
          flex
          items-center
          gap-3
          rounded-[14px]
          border
          bg-white
          px-4
          py-3
          shadow-[0_16px_50px_rgba(0,0,0,0.16)]

          ${
            toast.type ===
            "success"
              ? "border-green-200"
              : "border-red-200"
          }
        `}
      >
        <span
          className={`
            flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            rounded-full
            text-white

            ${
              toast.type ===
              "success"
                ? "bg-green-600"
                : "bg-red-500"
            }
          `}
        >
          {toast.type ===
          "success"
            ? "✓"
            : "!"}
        </span>

        <p
          className="
            text-[11px]
            font-medium
            text-[#211A18]
          "
        >
          {
            toast.message
          }
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   BANNER
========================================================= */

function MenBannerSlider({
  banners,
}: {
  banners: MenBanner[];
}) {
  const [
    active,
    setActive,
  ] =
    useState(0);

  const validBanners =
    useMemo(
      () =>
        banners.filter(
          (banner) =>
            Boolean(
              banner.image
            )
        ),
      [
        banners,
      ]
    );

  useEffect(() => {
    setActive(0);

    if (
      validBanners.length <=
      1
    ) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          setActive(
            (current) =>
              (current + 1) %
              validBanners.length
          );
        },
        4000
      );

    return () =>
      window.clearInterval(
        timer
      );
  }, [
    validBanners.length,
  ]);

  if (
    validBanners.length ===
    0
  ) {
    return null;
  }

  return (
    <section
      className="
        relative
        w-full
        overflow-hidden
        bg-[#EFE6DC]
      "
      style={{
        aspectRatio:
          "1600 / 558",
      }}
    >
      {validBanners.map(
        (
          banner,
          index
        ) => (
          <Link
            key={`${banner.image}-${index}`}
            href={
              banner.redirect ||
              banner.href ||
              "#"
            }
            className={`
              absolute
              inset-0
              block
              h-full
              w-full
              transition-all
              duration-700

              ${
                active === index
                  ? "translate-x-0 opacity-100"
                  : index < active
                    ? "-translate-x-full opacity-0"
                    : "translate-x-full opacity-0"
              }
            `}
          >
            <img
              src={
                banner.image
              }
              alt={
                banner.alt ||
                banner.title ||
                "Men Banner"
              }
              className="
                h-full
                w-full
                object-cover
                object-center
              "
            />
          </Link>
        )
      )}

      {validBanners.length >
        1 && (
        <>
          <button
            type="button"
            onClick={() =>
              setActive(
                (current) =>
                  current === 0
                    ? validBanners.length -
                      1
                    : current - 1
              )
            }
            className="
              absolute
              left-4
              top-1/2
              z-30
              flex
              h-10
              w-10
              -translate-y-1/2
              items-center
              justify-center
              rounded-full
              bg-white/90
              text-[24px]
              shadow-md
            "
          >
            ‹
          </button>

          <button
            type="button"
            onClick={() =>
              setActive(
                (current) =>
                  (current + 1) %
                  validBanners.length
              )
            }
            className="
              absolute
              right-4
              top-1/2
              z-30
              flex
              h-10
              w-10
              -translate-y-1/2
              items-center
              justify-center
              rounded-full
              bg-white/90
              text-[24px]
              shadow-md
            "
          >
            ›
          </button>
        </>
      )}
    </section>
  );
}

/* =========================================================
   NAV
========================================================= */

function MenNavigation({
  category,
  subcategory,
}: {
  category?: string;

  subcategory?: string;
}) {
  const parent =
    menMenu.find(
      (item) =>
        item.slug ===
        category
    );

  return (
    <div
      className="
        w-full
        overflow-hidden
        rounded-[20px]
        border
        border-[#211A18]/10
        bg-[#EFE5DB]
        px-4
        py-5
      "
    >
      <div
        className="
          overflow-x-auto
        "
      >
        <div
          className="
            mx-auto
            flex
            min-w-max
            justify-center
            gap-3
          "
        >
          <Link
            href="/men"
            className={`
              rounded-full
              px-6
              py-3
              text-[9px]
              font-semibold
              uppercase

              ${
                !category
                  ? "bg-[#A91543] text-white"
                  : "bg-white text-[#211A18]"
              }
            `}
          >
            All Men
          </Link>

          {menMenu.map(
            (item) => (
              <Link
                key={
                  item.slug
                }
                href={
                  item.href
                }
                className={`
                  rounded-full
                  px-6
                  py-3
                  text-[9px]
                  font-semibold
                  uppercase

                  ${
                    category ===
                    item.slug
                      ? "bg-[#A91543] text-white"
                      : "bg-white text-[#211A18]"
                  }
                `}
              >
                {
                  item.name
                }
              </Link>
            )
          )}
        </div>
      </div>

      {parent &&
        parent.children.length >
          0 && (
          <div
            className="
              mt-5
              overflow-x-auto
              border-t
              border-[#211A18]/10
              pt-4
            "
          >
            <div
              className="
                flex
                min-w-max
                justify-center
                gap-8
              "
            >
              <Link
                href={
                  parent.href
                }
                className={
                  !subcategory
                    ? "font-semibold text-[#A91543]"
                    : "text-[#6F5A4C]"
                }
              >
                All{" "}
                {
                  parent.name
                }
              </Link>

              {parent.children.map(
                (child) => (
                  <Link
                    key={
                      child.slug
                    }
                    href={
                      child.href
                    }
                    className={
                      subcategory ===
                      child.slug
                        ? "font-semibold text-[#A91543]"
                        : "text-[#6F5A4C]"
                    }
                  >
                    {
                      child.name
                    }
                  </Link>
                )
              )}
            </div>
          </div>
        )}
    </div>
  );
}

/* =========================================================
   SIZE SELECTOR
========================================================= */

function QuickAddSizeModal({
  data,
  busySizeId,
  onClose,
  onSelectSize,
}: {
  data: QuickAddState;

  busySizeId: string | null;

  onClose: () => void;

  onSelectSize: (
    size: ApiSize
  ) => void;
}) {
  if (!data) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close"
        onClick={
          onClose
        }
        className="
          fixed
          inset-0
          z-[9995]
          bg-black/25
        "
      />

      <div
        className="
          fixed
          left-1/2
          top-1/2
          z-[9996]
          w-[calc(100%-30px)]
          max-w-[390px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-[18px]
          bg-white
          p-5
          shadow-[0_25px_80px_rgba(0,0,0,0.25)]
        "
      >
        <button
          type="button"
          onClick={
            onClose
          }
          className="
            absolute
            right-4
            top-2
            text-[24px]
            text-black/50
          "
        >
          ×
        </button>

        <div
          className="
            flex
            gap-4
          "
        >
          <img
            src={
              data.image
            }
            alt={
              data.product.name
            }
            className="
              h-[86px]
              w-[68px]
              shrink-0
              rounded-[9px]
              object-cover
            "
          />

          <div>
            <p
              className="
                pr-5
                text-[14px]
                font-medium
                leading-[1.3]
              "
            >
              {
                data.product.name
              }
            </p>

            {data.colorName && (
              <p
                className="
                  mt-2
                  text-[10px]
                  text-black/50
                "
              >
                Color:{" "}
                {
                  data.colorName
                }
              </p>
            )}
          </div>
        </div>

        <p
          className="
            mt-6
            text-[13px]
            font-medium
          "
        >
          Select a Size
        </p>

        <div
          className="
            mt-4
            flex
            flex-wrap
            gap-3
            border-t
            pt-4
          "
        >
          {data.sizes.map(
            (
              size,
              index
            ) => {
              const sizeId =
                getSizeId(
                  size
                );

              const isBusy =
                busySizeId ===
                sizeId;

              return (
                <button
                  key={
                    sizeId ||
                    size.size ||
                    index
                  }
                  type="button"
                  disabled={
                    isBusy
                  }
                  onClick={() =>
                    onSelectSize(
                      size
                    )
                  }
                  className="
                    min-w-[58px]
                    rounded-full
                    border
                    border-[#211A18]/15
                    px-5
                    py-3
                    text-[12px]
                    font-medium
                    transition
                    hover:border-[#A91543]
                    hover:text-[#A91543]
                    disabled:opacity-50
                  "
                >
                  {isBusy
                    ? "..."
                    : size.size ||
                      size.name}
                </button>
              );
            }
          )}
        </div>
      </div>
    </>
  );
}

/* =========================================================
   CARD
========================================================= */

function ProductCard({
  product,
  wishlisted,
  wishlistBusy,
  cartBusy,
  onWishlist,
  onAddToBag,
}: {
  product: MenProduct;

  wishlisted: boolean;

  wishlistBusy: boolean;

  cartBusy: boolean;

  onWishlist: (
    product: MenProduct
  ) => void;

  onAddToBag: (
    product: MenProduct
  ) => void;
}) {
  const sellingPrice =
    Number(
      product.discountedPrice
    ) > 0
      ? Number(
          product.discountedPrice
        )
      : Number(
          product.actualPrice
        );

  const originalPrice =
    Number(
      product.actualPrice
    ) > 0
      ? Number(
          product.actualPrice
        )
      : sellingPrice;

  const discount =
    originalPrice >
      sellingPrice &&
    originalPrice > 0
      ? Math.round(
          ((originalPrice -
            sellingPrice) /
            originalPrice) *
            100
        )
      : 0;

  return (
    <article
      data-product-card
      className="
        group
        min-w-0
      "
    >
      <div
        className="
          relative
        "
      >
        <Link
          href={`/product/${product.slug}`}
          className="
            relative
            block
            aspect-[4/5]
            overflow-hidden
            rounded-[14px]
            bg-[#F2ECE7]
          "
        >
          {product.image1 ? (
            <>
              <img
                src={
                  product.image1
                }
                alt={
                  product.name
                }
                className="
                  absolute
                  inset-0
                  h-full
                  w-full
                  object-cover
                  transition-all
                  duration-500
                  group-hover:opacity-0
                "
              />

              <img
                src={
                  product.image2 ||
                  product.image1
                }
                alt={
                  product.name
                }
                className="
                  absolute
                  inset-0
                  h-full
                  w-full
                  object-cover
                  opacity-0
                  transition-all
                  duration-500
                  group-hover:opacity-100
                "
              />
            </>
          ) : null}

          {discount >
            0 && (
            <span
              className="
                absolute
                left-3
                top-3
                z-20
                rounded-full
                bg-[#A91543]
                px-3
                py-1.5
                text-[8px]
                font-semibold
                text-white
              "
            >
              {
                discount
              }
              % OFF
            </span>
          )}
        </Link>

        <button
          type="button"
          disabled={
            wishlistBusy
          }
          onClick={() =>
            onWishlist(
              product
            )
          }
          className={`
            absolute
            right-3
            top-3
            z-30
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-full
            border
            text-[19px]

            ${
              wishlisted
                ? "border-[#A91543] bg-[#A91543] text-white"
                : "bg-white text-[#A91543]"
            }
          `}
        >
          {wishlisted
            ? "♥"
            : "♡"}
        </button>
      </div>

      <button
        type="button"
        disabled={
          cartBusy
        }
        onClick={() =>
          onAddToBag(
            product
          )
        }
        className="
          mt-2
          h-10
          w-full
          rounded-[9px]
          bg-[#A91543]
          text-[9px]
          font-semibold
          uppercase
          tracking-[0.12em]
          text-white
          transition
          hover:bg-[#211A18]
          disabled:opacity-50
        "
      >
        {cartBusy
          ? "Loading..."
          : "Add To Bag"}
      </button>

      <div
        className="
          px-1
          pt-3
        "
      >
        <Link
          href={`/product/${product.slug}`}
          className="
            block
            truncate
            text-[12px]
            font-medium
          "
        >
          {
            product.name
          }
        </Link>

        <div
          className="
            mt-2
            flex
            flex-wrap
            items-center
            gap-2
          "
        >
          <strong
            className="
              text-[14px]
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
          </strong>

          {originalPrice >
            sellingPrice && (
            <span
              className="
                text-[10px]
                text-black/35
                line-through
              "
            >
              ₹
              {originalPrice.toLocaleString(
                "en-IN",
                {
                  maximumFractionDigits:
                    2,
                }
              )}
            </span>
          )}

          {discount >
            0 && (
            <span
              className="
                rounded-full
                bg-[#F8E5E8]
                px-2
                py-1
                text-[8px]
                font-semibold
                text-[#A91543]
              "
            >
              {
                discount
              }
              % OFF
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   MAIN
========================================================= */

export default function MenCatalog({
  products,
  banners,
  category,
  subcategory,
}: MenCatalogProps) {
  const rootRef =
    useRef<HTMLElement>(
      null
    );

  const [
    sort,
    setSort,
  ] =
    useState(
      "featured"
    );

  const [
    wishlistIds,
    setWishlistIds,
  ] =
    useState<
      Set<string>
    >(
      new Set()
    );

  const [
    wishlistBusyId,
    setWishlistBusyId,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    quickAdd,
    setQuickAdd,
  ] =
    useState<QuickAddState>(
      null
    );

  const [
    quickAddLoadingId,
    setQuickAddLoadingId,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    busySizeId,
    setBusySizeId,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    toast,
    setToast,
  ] =
    useState<ToastState>(
      null
    );

  /* =======================================================
     TOAST
  ======================================================= */

  function notify(
    message: string,
    type:
      | "success"
      | "error" =
      "success"
  ) {
    setToast({
      message,
      type,
    });
  }

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer =
      window.setTimeout(
        () =>
          setToast(
            null
          ),
        2800
      );

    return () =>
      clearTimeout(
        timer
      );
  }, [
    toast,
  ]);

  /* =======================================================
     WISHLIST LOAD
  ======================================================= */

  const loadWishlist =
    useCallback(
      async () => {
        const loggedIn =
          await checkLoggedIn();

        if (!loggedIn) {
          setWishlistIds(
            new Set(
              getPendingWishlistIds()
            )
          );

          return;
        }

        try {
          const response =
            await fetch(
              `${API_URL}/api/wishlist`,
              {
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

          if (!response.ok) {
            return;
          }

          const data =
            await readJson(
              response
            );

          setWishlistIds(
            new Set(
              extractWishlistItems(
                data
              )
                .map(
                  getWishlistProductId
                )
                .filter(Boolean)
            )
          );
        } catch {
          // no overlay
        }
      },
      []
    );

  useEffect(() => {
    void loadWishlist();

    const refresh =
      () =>
        void loadWishlist();

    window.addEventListener(
      "hivrasoft-wishlist-updated",
      refresh
    );

    window.addEventListener(
      "hivrasoft-pending-wishlist-updated",
      refresh
    );

    return () => {
      window.removeEventListener(
        "hivrasoft-wishlist-updated",
        refresh
      );

      window.removeEventListener(
        "hivrasoft-pending-wishlist-updated",
        refresh
      );
    };
  }, [
    loadWishlist,
  ]);

  /* =======================================================
     WISHLIST TOGGLE
  ======================================================= */

  async function toggleWishlist(
    product: MenProduct
  ) {
    const productId =
      String(
        product.id ||
          ""
      ).trim();

    if (
      !productId ||
      wishlistBusyId
    ) {
      return;
    }

    const exists =
      wishlistIds.has(
        productId
      );

    setWishlistBusyId(
      productId
    );

    try {
      const loggedIn =
        await checkLoggedIn();

      if (!loggedIn) {
        if (exists) {
          removePendingWishlistProduct(
            productId
          );

          setWishlistIds(
            (current) => {
              const next =
                new Set(
                  current
                );

              next.delete(
                productId
              );

              return next;
            }
          );

          notify(
            "Removed from temporary wishlist."
          );
        } else {
          addPendingWishlistProduct(
            productId
          );

          setWishlistIds(
            (current) =>
              new Set([
                ...current,
                productId,
              ])
          );

          notify(
            "Saved temporarily. Please log in to save it."
          );

          requestStoreLogin();
        }

        return;
      }

      if (exists) {
        await removeProductFromWishlist(
          productId
        );

        setWishlistIds(
          (current) => {
            const next =
              new Set(
                current
              );

            next.delete(
              productId
            );

            return next;
          }
        );

        notify(
          "Removed from wishlist."
        );
      } else {
        await addProductToWishlist(
          productId
        );

        setWishlistIds(
          (current) =>
            new Set([
              ...current,
              productId,
            ])
        );

        notify(
          "Added to wishlist."
        );
      }

      notifyWishlistUpdated();
    } catch (
      error
    ) {
      notify(
        error instanceof Error
          ? error.message
          : "Wishlist failed.",
        "error"
      );
    } finally {
      setWishlistBusyId(
        null
      );
    }
  }

  /* =======================================================
     OPEN ADD TO BAG
  ======================================================= */

  async function openQuickAdd(
    product: MenProduct
  ) {
    if (
      quickAddLoadingId
    ) {
      return;
    }

    const cardId =
      String(
        product.id ||
          ""
      ).trim();

    setQuickAddLoadingId(
      cardId
    );

    try {
      const loggedIn =
        await checkLoggedIn();

      if (!loggedIn) {
        notify(
          "Please log in first.",
          "error"
        );

        requestStoreLogin();

        return;
      }

      /*
       * IMPORTANT:
       * Get real variant IDs from API.
       */

      const variant =
        await fetchCartVariant(
          product
        );

      setQuickAdd({
        product,

        productId:
          variant.productId,

        colorId:
          variant.colorId,

        colorName:
          variant.color
            .nameColor ||
          variant.color.name ||
          "",

        image:
          getColorImage(
            variant.color,
            product.image1
          ),

        sizes:
          variant.sizes,
      });
    } catch (
      error
    ) {
      /*
       * NO console.error.
       * Isliye Next.js red console overlay nahi khulega.
       */

      notify(
        error instanceof Error
          ? error.message
          : "Unable to load product options.",
        "error"
      );
    } finally {
      setQuickAddLoadingId(
        null
      );
    }
  }

  /* =======================================================
     SIZE -> CART
  ======================================================= */

  async function selectSize(
    size: ApiSize
  ) {
    if (
      !quickAdd ||
      busySizeId
    ) {
      return;
    }

    const sizeId =
      getSizeId(
        size
      );

    if (!sizeId) {
      notify(
        "Size ID missing.",
        "error"
      );

      return;
    }

    const selected =
      quickAdd;

    setBusySizeId(
      sizeId
    );

    setQuickAdd(
      null
    );

    try {
      const response =
        await addProductToCart({
          productId:
            selected.productId,

          colorId:
            selected.colorId,

          sizeId,

          quantity:
            1,
        });

      notify(
        typeof response.message ===
          "string"
          ? response.message
          : "Product added to cart successfully."
      );

      notifyCartUpdated();
    } catch (
      error
    ) {
      notify(
        error instanceof Error
          ? error.message
          : "Unable to add product to cart.",
        "error"
      );
    } finally {
      setBusySizeId(
        null
      );
    }
  }

  /* =======================================================
     SORT
  ======================================================= */

  const sortedProducts =
    useMemo(() => {
      const list = [
        ...products,
      ];

      const price = (
        product: MenProduct
      ) =>
        Number(
          product.discountedPrice
        ) > 0
          ? Number(
              product.discountedPrice
            )
          : Number(
              product.actualPrice
            );

      if (
        sort ===
        "low-high"
      ) {
        list.sort(
          (a, b) =>
            price(a) -
            price(b)
        );
      }

      if (
        sort ===
        "high-low"
      ) {
        list.sort(
          (a, b) =>
            price(b) -
            price(a)
        );
      }

      return list;
    }, [
      products,
      sort,
    ]);

  /* =======================================================
     GSAP
  ======================================================= */

  useEffect(() => {
    gsap.registerPlugin(
      ScrollTrigger
    );

    if (
      !rootRef.current
    ) {
      return;
    }

    const context =
      gsap.context(
        () => {
          ScrollTrigger.batch(
            "[data-product-card]",
            {
              start:
                "top 92%",

              once: true,

              onEnter: (
                elements
              ) => {
                gsap.fromTo(
                  elements,
                  {
                    y: 24,

                    opacity: 0,
                  },
                  {
                    y: 0,

                    opacity: 1,

                    duration:
                      0.55,

                    stagger:
                      0.05,
                  }
                );
              },
            }
          );
        },
        rootRef
      );

    return () =>
      context.revert();
  }, [
    sortedProducts,
  ]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main
      ref={
        rootRef
      }
      className="
        min-h-screen
        bg-[#F8F5F2]
        text-[#211A18]
      "
    >
      <Toast
        toast={
          toast
        }
      />

      <QuickAddSizeModal
        data={
          quickAdd
        }
        busySizeId={
          busySizeId
        }
        onClose={() =>
          setQuickAdd(
            null
          )
        }
        onSelectSize={
          selectSize
        }
      />

      <MenBannerSlider
        banners={
          banners
        }
      />

      <section
        className="
          px-4
          py-12
          md:px-8
        "
      >
        <div
          className="
            mx-auto
            max-w-[1450px]
          "
        >
          <MenNavigation
            category={
              category
            }
            subcategory={
              subcategory
            }
          />

          <div
            className="
              mb-8
              mt-9
              flex
              items-center
              justify-between
              border-b
              border-[#211A18]/10
              pb-5
            "
          >
            <p
              className="
                text-[9px]
                font-semibold
                uppercase
                tracking-[0.18em]
              "
            >
              {
                sortedProducts.length
              }{" "}
              {sortedProducts.length ===
              1
                ? "Product"
                : "Products"}
            </p>

            <select
              value={
                sort
              }
              onChange={(
                event
              ) =>
                setSort(
                  event.target
                    .value
                )
              }
              className="
                min-w-[150px]
                rounded-lg
                border
                bg-white
                px-4
                py-3
                text-[9px]
              "
            >
              <option value="featured">
                Featured
              </option>

              <option value="low-high">
                Price Low To High
              </option>

              <option value="high-low">
                Price High To Low
              </option>
            </select>
          </div>

          <div
            className="
              grid
              grid-cols-2
              gap-x-4
              gap-y-10
              md:grid-cols-3
              lg:grid-cols-4
            "
          >
            {sortedProducts.map(
              (product) => (
                <ProductCard
                  key={
                    product.id
                  }
                  product={
                    product
                  }
                  wishlisted={
                    wishlistIds.has(
                      String(
                        product.id
                      )
                    )
                  }
                  wishlistBusy={
                    wishlistBusyId ===
                    String(
                      product.id
                    )
                  }
                  cartBusy={
                    quickAddLoadingId ===
                    String(
                      product.id
                    )
                  }
                  onWishlist={
                    toggleWishlist
                  }
                  onAddToBag={
                    openQuickAdd
                  }
                />
              )
            )}
          </div>
        </div>
      </section>
    </main>
  );
}