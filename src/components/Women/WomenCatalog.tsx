"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  womenMenu,
  type WomenBanner,
  type WomenProduct,
} from "@/src/data/women";

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

type WomenCatalogProps = {
  products: WomenProduct[];

  banners: WomenBanner[];

  title: string;

  description: string;

  category?: string;

  subcategory?: string;
};

/* =========================================================
   TOAST
========================================================= */

type ToastState =
  | {
      message: string;

      type:
        | "success"
        | "error";
    }
  | null;

/* =========================================================
   QUICK ADD TYPES
========================================================= */

type QuickSize = {
  _id?: string;

  id?: string;

  sizeId?: string;

  size?: string;

  name?: string;

  stock?:
    | number
    | string;

  isActive?: boolean;
};

type QuickImage = {
  url?: string;

  isDefault?: boolean;
};

type QuickColor = {
  _id?: string;

  id?: string;

  colorId?: string;

  variantId?: string;

  nameColor?: string;

  slugProduct?: string;

  isDefault?: boolean;

  isActive?: boolean;

  images?: QuickImage[];

  sizes?: QuickSize[];
};

type QuickProduct = {
  _id?: string;

  id?: string;

  productId?: string;

  slug?: string;

  colors?: QuickColor[];

  selectedColor?: QuickColor;

  defaultColor?: QuickColor;

  color?: QuickColor;
};

type QuickAddState =
  | {
      product: WomenProduct;

      productId: string;

      colorId: string;

      image: string;

      sizes: QuickSize[];
    }
  | null;

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
   GENERIC ID HELPER
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

  for (
    const key of keys
  ) {
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
      typeof value ===
        "string" ||
      typeof value ===
        "number"
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
      typeof value ===
      "object"
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
   WISHLIST HELPERS
========================================================= */

function extractWishlist(
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

function wishlistId(
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
   PRODUCT RESPONSE HELPERS
========================================================= */

function extractProducts(
  data: any
): QuickProduct[] {
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

function extractSingleProduct(
  data: any
): QuickProduct | null {
  if (
    !data ||
    typeof data !==
      "object"
  ) {
    return null;
  }

  if (
    data.product &&
    typeof data.product ===
      "object"
  ) {
    return data.product;
  }

  if (
    data.data?.product &&
    typeof data.data.product ===
      "object"
  ) {
    return data.data.product;
  }

  if (
    data.data?.item &&
    typeof data.data.item ===
      "object"
  ) {
    return data.data.item;
  }

  if (
    data.data &&
    typeof data.data ===
      "object" &&
    !Array.isArray(
      data.data
    )
  ) {
    return data.data;
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
   PRODUCT / COLOR / SIZE IDS
========================================================= */

function getProductId(
  product: QuickProduct
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

function getColorId(
  color?: QuickColor | null
): string {
  if (!color) {
    return "";
  }

  return getObjectId(
    color,
    [
      "colorId",
      "_id",
      "id",
      "variantId",
    ]
  );
}

function getSizeId(
  size?: QuickSize | null
): string {
  if (!size) {
    return "";
  }

  return getObjectId(
    size,
    [
      "sizeId",
      "_id",
      "id",
    ]
  );
}

/* =========================================================
   PRODUCT COLORS
========================================================= */

function getProductColors(
  product: QuickProduct
): QuickColor[] {
  const colors: QuickColor[] =
    [];

  if (
    Array.isArray(
      product.colors
    )
  ) {
    for (
      const color of
        product.colors
    ) {
      if (
        color &&
        color.isActive !==
          false
      ) {
        colors.push(
          color
        );
      }
    }
  }

  const extras = [
    product.selectedColor,

    product.defaultColor,

    product.color,
  ];

  for (
    const color of extras
  ) {
    if (
      color &&
      color.isActive !==
        false
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
        getColorId(
          color
        ) ||
        String(
          color.slugProduct ||
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
   CURRENT COLOR
========================================================= */

function findCurrentColor(
  apiProduct: QuickProduct,
  cardProduct: WomenProduct
): QuickColor | null {
  const colors =
    getProductColors(
      apiProduct
    );

  if (
    colors.length ===
    0
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

  const exact =
    colors.find(
      (
        color
      ) =>
        String(
          color.slugProduct ||
            ""
        )
          .trim()
          .toLowerCase() ===
        requestedSlug
    );

  if (exact) {
    return exact;
  }

  if (
    apiProduct.selectedColor &&
    apiProduct.selectedColor
      .isActive !== false
  ) {
    return apiProduct.selectedColor;
  }

  const defaultColor =
    colors.find(
      (
        color
      ) =>
        color.isDefault ===
        true
    );

  if (
    defaultColor
  ) {
    return defaultColor;
  }

  return colors[0] ||
    null;
}

/* =========================================================
   AVAILABLE SIZES
========================================================= */

function getAvailableSizes(
  color: QuickColor
): QuickSize[] {
  if (
    !Array.isArray(
      color.sizes
    )
  ) {
    return [];
  }

  return color.sizes.filter(
    (
      size
    ) => {
      if (
        size.isActive ===
        false
      ) {
        return false;
      }

      const stock =
        Number(
          size.stock ||
            0
        );

      if (
        !Number.isFinite(
          stock
        ) ||
        stock <= 0
      ) {
        return false;
      }

      return Boolean(
        getSizeId(
          size
        )
      );
    }
  );
}

/* =========================================================
   LOAD QUICK PRODUCT
========================================================= */

async function loadQuickProduct(
  cardProduct: WomenProduct
): Promise<{
  productId: string;

  color: QuickColor;

  colorId: string;

  sizes: QuickSize[];
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

  /*
   * Catalog endpoint pehle.
   * Tumhare product API structure me
   * colors + colorId + sizes yahan mil rahe hain.
   */

  const detailEndpoints = [
    `${API_URL}/api/products/catalog/${encodedSlug}`,

    `${API_URL}/api/products/slug/${encodedSlug}`,
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

      if (
        !response.ok
      ) {
        continue;
      }

      const data =
        await readJson(
          response
        );

      const product =
        extractSingleProduct(
          data
        );

      if (!product) {
        continue;
      }

      const productId =
        getProductId(
          product
        ) ||
        String(
          cardProduct.id ||
            ""
        );

      const color =
        findCurrentColor(
          product,
          cardProduct
        );

      const colorId =
        getColorId(
          color
        );

      const sizes =
        color
          ? getAvailableSizes(
              color
            )
          : [];

      if (
        productId &&
        color &&
        colorId &&
        sizes.length > 0
      ) {
        return {
          productId,

          color,

          colorId,

          sizes,
        };
      }
    } catch {
      // try next endpoint
    }
  }

  /*
   * Fallback to active/catalog lists.
   */

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

      if (
        !response.ok
      ) {
        continue;
      }

      const data =
        await readJson(
          response
        );

      const products =
        extractProducts(
          data
        );

      const targetSlug =
        slug.toLowerCase();

      const matching =
        products.filter(
          (
            product
          ) => {
            const id =
              getProductId(
                product
              );

            if (
              id &&
              id ===
                String(
                  cardProduct.id
                )
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
              targetSlug
            ) {
              return true;
            }

            return getProductColors(
              product
            ).some(
              (
                color
              ) =>
                String(
                  color.slugProduct ||
                    ""
                )
                  .trim()
                  .toLowerCase() ===
                targetSlug
            );
          }
        );

      for (
        const product of matching
      ) {
        const productId =
          getProductId(
            product
          ) ||
          String(
            cardProduct.id ||
              ""
          );

        const color =
          findCurrentColor(
            product,
            cardProduct
          );

        const colorId =
          getColorId(
            color
          );

        const sizes =
          color
            ? getAvailableSizes(
                color
              )
            : [];

        if (
          productId &&
          color &&
          colorId &&
          sizes.length > 0
        ) {
          return {
            productId,

            color,

            colorId,

            sizes,
          };
        }
      }
    } catch {
      // continue
    }
  }

  throw new Error(
    "Product variant IDs are missing in the product API."
  );
}

/* =========================================================
   COLOR IMAGE
========================================================= */

function getColorImage(
  color: QuickColor,
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
      (
        image
      ) =>
        image.isDefault ===
          true &&
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
      (
        image
      ) =>
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
        right-4
        top-[105px]
        z-[9999]
        w-[320px]
        max-w-[calc(100vw-32px)]
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
          shadow-[0_16px_50px_rgba(0,0,0,0.15)]

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
            leading-5
            text-[#211A18]
          "
        >
          {toast.message}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   BANNER SLIDER
========================================================= */

function BannerSlider({
  banners,
}: {
  banners: WomenBanner[];
}) {
  const [
    active,
    setActive,
  ] =
    useState(0);

  const valid =
    banners.filter(
      (
        banner
      ) =>
        Boolean(
          banner.image
        )
    );

  useEffect(() => {
    if (
      valid.length <= 1
    ) {
      return;
    }

    const timer =
      window.setInterval(
        () =>
          setActive(
            (
              value
            ) =>
              (value +
                1) %
              valid.length
          ),
        4500
      );

    return () =>
      window.clearInterval(
        timer
      );
  }, [
    valid.length,
  ]);

  if (
    valid.length ===
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
      {valid.map(
        (
          banner,
          index
        ) => {
          const href =
            banner.redirect ||
            banner.href ||
            "#";

          return (
            <Link
              key={`${banner.image}-${index}`}
              href={href}
              className={`
                absolute
                inset-0
                transition-opacity
                duration-700

                ${
                  active ===
                  index
                    ? "pointer-events-auto opacity-100"
                    : "pointer-events-none opacity-0"
                }
              `}
            >
              <img
                src={
                  banner.image
                }
                alt={
                  banner.alt ||
                  "Women Banner"
                }
                className="
                  h-full
                  w-full
                  object-cover
                  object-center
                "
              />
            </Link>
          );
        }
      )}

      {valid.length > 1 && (
        <div
          className="
            absolute
            bottom-4
            left-1/2
            z-20
            flex
            -translate-x-1/2
            gap-2
          "
        >
          {valid.map(
            (
              banner,
              index
            ) => (
              <button
                key={`${banner.image}-dot-${index}`}
                type="button"
                aria-label={`Banner ${
                  index + 1
                }`}
                onClick={() =>
                  setActive(
                    index
                  )
                }
                className={`
                  h-2
                  rounded-full
                  transition-all

                  ${
                    active ===
                    index
                      ? "w-6 bg-white"
                      : "w-2 bg-white/60"
                  }
                `}
              />
            )
          )}
        </div>
      )}
    </section>
  );
}

/* =========================================================
   SIZE MODAL
========================================================= */

function SizeModal({
  data,
  close,
  select,
}: {
  data: QuickAddState;

  close: () => void;

  select: (
    size: QuickSize
  ) => void;
}) {
  if (!data) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close size selector"
        className="
          fixed
          inset-0
          z-[9996]
          bg-black/30
          backdrop-blur-[1px]
        "
        onClick={
          close
        }
      />

      <div
        className="
          fixed
          left-1/2
          top-1/2
          z-[9997]

          w-[calc(100%-30px)]
          max-w-[410px]

          -translate-x-1/2
          -translate-y-1/2

          rounded-[20px]

          bg-white

          p-5

          shadow-[0_24px_80px_rgba(0,0,0,0.25)]
        "
      >
        <button
          type="button"
          aria-label="Close"
          onClick={
            close
          }
          className="
            absolute
            right-4
            top-3

            flex
            h-8
            w-8
            items-center
            justify-center

            rounded-full

            text-[22px]
            text-[#211A18]

            hover:bg-black/5
          "
        >
          ×
        </button>

        <div
          className="
            flex
            gap-4
            pr-8
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
              h-[96px]
              w-[76px]
              shrink-0

              rounded-[10px]

              bg-[#F3EEE8]

              object-cover
            "
          />

          <div
            className="
              pt-1
            "
          >
            <p
              className="
                text-[14px]
                font-semibold
                leading-5
                text-[#211A18]
              "
            >
              {data.product.name}
            </p>

            <p
              className="
                mt-2
                text-[11px]
                text-black/50
              "
            >
              Choose your size to
              add this item to bag.
            </p>
          </div>
        </div>

        <p
          className="
            mt-6

            text-[12px]
            font-semibold
            uppercase
            tracking-[0.06em]
            text-[#211A18]
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

            border-t
            border-black/10

            pt-4
          "
        >
          {data.sizes.map(
            (
              size
            ) => (
              <button
                key={
                  getSizeId(
                    size
                  ) ||
                  size.size ||
                  size.name
                }
                type="button"
                onClick={() =>
                  select(
                    size
                  )
                }
                className="
                  min-w-[58px]

                  rounded-full

                  border
                  border-black/20

                  bg-white

                  px-5
                  py-3

                  text-[11px]
                  font-semibold
                  text-[#211A18]

                  transition

                  hover:border-[#9D173E]
                  hover:bg-[#FFF3F6]
                  hover:text-[#9D173E]
                "
              >
                {size.size ||
                  size.name}
              </button>
            )
          )}
        </div>
      </div>
    </>
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function WomenCatalog({
  products,
  banners,
  title,
  description,
  category,
  subcategory,
}: WomenCatalogProps) {
  const [
    sort,
    setSort,
  ] =
    useState(
      "featured"
    );

  const [
    wishlist,
    setWishlist,
  ] =
    useState<
      Set<string>
    >(
      new Set()
    );

  const [
    wishlistBusy,
    setWishlistBusy,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    cartBusy,
    setCartBusy,
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
    toast,
    setToast,
  ] =
    useState<ToastState>(
      null
    );

  const parent =
    womenMenu.find(
      (
        item
      ) =>
        item.slug ===
        category
    );

  /* =======================================================
     NOTIFY
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
      window.clearTimeout(
        timer
      );
  }, [
    toast,
  ]);

  /* =======================================================
     LOAD WISHLIST
  ======================================================= */

  const loadWishlist =
    useCallback(
      async () => {
        if (
          !(await checkLoggedIn())
        ) {
          setWishlist(
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
              }
            );

          if (
            !response.ok
          ) {
            return;
          }

          const data =
            await readJson(
              response
            );

          setWishlist(
            new Set(
              extractWishlist(
                data
              )
                .map(
                  wishlistId
                )
                .filter(
                  Boolean
                )
            )
          );
        } catch {
          // keep current wishlist state
        }
      },
      []
    );

  useEffect(() => {
    void loadWishlist();

    const refresh = () =>
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
     WISHLIST
  ======================================================= */

  async function toggleWishlist(
    product: WomenProduct
  ) {
    const id =
      String(
        product.id
      );

    if (
      !id ||
      wishlistBusy
    ) {
      return;
    }

    setWishlistBusy(
      id
    );

    const exists =
      wishlist.has(
        id
      );

    try {
      if (
        !(await checkLoggedIn())
      ) {
        if (
          exists
        ) {
          removePendingWishlistProduct(
            id
          );

          setWishlist(
            (
              current
            ) => {
              const next =
                new Set(
                  current
                );

              next.delete(
                id
              );

              return next;
            }
          );

          notify(
            "Removed from wishlist."
          );
        } else {
          addPendingWishlistProduct(
            id
          );

          setWishlist(
            (
              current
            ) =>
              new Set([
                ...current,

                id,
              ])
          );

          notify(
            "Saved temporarily. Log in to save it."
          );

          requestStoreLogin();
        }

        return;
      }

      if (
        exists
      ) {
        await removeProductFromWishlist(
          id
        );

        setWishlist(
          (
            current
          ) => {
            const next =
              new Set(
                current
              );

            next.delete(
              id
            );

            return next;
          }
        );

        notify(
          "Removed from wishlist."
        );
      } else {
        await addProductToWishlist(
          id
        );

        setWishlist(
          (
            current
          ) =>
            new Set([
              ...current,

              id,
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
        error instanceof
          Error
          ? error.message
          : "Wishlist failed.",
        "error"
      );
    } finally {
      setWishlistBusy(
        null
      );
    }
  }

  /* =======================================================
     OPEN CART / SIZE MODAL
  ======================================================= */

  async function openCart(
    product: WomenProduct
  ) {
    const id =
      String(
        product.id ||
          ""
      );

    if (
      !id ||
      cartBusy
    ) {
      return;
    }

    setCartBusy(
      id
    );

    try {
      if (
        !(await checkLoggedIn())
      ) {
        notify(
          "Please log in first.",
          "error"
        );

        requestStoreLogin();

        return;
      }

      const variant =
        await loadQuickProduct(
          product
        );

      setQuickAdd({
        product,

        productId:
          variant.productId,

        colorId:
          variant.colorId,

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
      notify(
        error instanceof
          Error
          ? error.message
          : "Unable to load sizes.",
        "error"
      );
    } finally {
      setCartBusy(
        null
      );
    }
  }

  /* =======================================================
     SELECT SIZE -> ADD CART
  ======================================================= */

  async function selectSize(
    size: QuickSize
  ) {
    if (
      !quickAdd
    ) {
      return;
    }

    const selected =
      quickAdd;

    const sizeId =
      getSizeId(
        size
      );

    if (
      !sizeId
    ) {
      notify(
        "Selected size ID is missing.",
        "error"
      );

      return;
    }

    setQuickAdd(
      null
    );

    try {
      const payload = {
        productId:
          selected.productId,

        colorId:
          selected.colorId,

        sizeId,

        quantity:
          1,
      };

      console.log(
        "[WOMEN ADD TO BAG]",
        payload
      );

      const response =
        await addProductToCart(
          payload
        );

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
        error instanceof
          Error
          ? error.message
          : "Unable to add to cart.",
        "error"
      );
    }
  }

  /* =======================================================
     SORT
  ======================================================= */

  const sorted =
    useMemo(() => {
      const list = [
        ...products,
      ];

      const price = (
        item: WomenProduct
      ) =>
        Number(
          item.discountedPrice
        ) > 0
          ? Number(
              item.discountedPrice
            )
          : Number(
              item.actualPrice
            );

      if (
        sort ===
        "low-high"
      ) {
        list.sort(
          (
            a,
            b
          ) =>
            price(
              a
            ) -
            price(
              b
            )
        );
      }

      if (
        sort ===
        "high-low"
      ) {
        list.sort(
          (
            a,
            b
          ) =>
            price(
              b
            ) -
            price(
              a
            )
        );
      }

      return list;
    }, [
      products,
      sort,
    ]);

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main
      className="
        min-h-screen
        bg-[#FAF8F6]
        text-[#211A18]
      "
    >
      <Toast
        toast={
          toast
        }
      />

      <SizeModal
        data={
          quickAdd
        }
        close={() =>
          setQuickAdd(
            null
          )
        }
        select={
          selectSize
        }
      />

      <BannerSlider
        banners={
          banners
        }
      />

      <section
        className="
          px-4
          pb-16
          pt-8

          sm:px-6

          md:px-8
          md:pt-10
        "
      >
        <div
          className="
            mx-auto
            w-full
            max-w-[1320px]
          "
        >
          {/* =================================================
              TITLE
          ================================================= */}

          {(title ||
            description) && (
            <div
              className="
                mb-7
                text-center
              "
            >
              {title && (
                <h1
                  className="
                    text-[26px]
                    font-semibold
                    tracking-[-0.02em]
                    text-[#211A18]

                    md:text-[32px]
                  "
                >
                  {title}
                </h1>
              )}

              {description && (
                <p
                  className="
                    mx-auto
                    mt-2
                    max-w-[650px]

                    text-[12px]
                    leading-6
                    text-black/50

                    md:text-[13px]
                  "
                >
                  {description}
                </p>
              )}
            </div>
          )}

          {/* =================================================
              CATEGORY MENU
          ================================================= */}

          <div
            className="
              overflow-x-auto

              rounded-[18px]

              border
              border-black/[0.03]

              bg-[#F1E7DD]

              px-4
              py-4

              sm:px-6
            "
          >
            <div
              className="
                flex
                min-w-max
                items-center
                justify-start
                gap-2

                lg:justify-center
              "
            >
              <Link
                href="/women"
                className={`
                  rounded-full

                  px-5
                  py-2.5

                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.04em]

                  transition-all

                  ${
                    !category
                      ? "bg-[#B41443] text-white shadow-sm"
                      : "bg-white text-[#594B47] hover:bg-[#B41443] hover:text-white"
                  }
                `}
              >
                All Women
              </Link>

              {womenMenu.map(
                (
                  item
                ) => (
                  <Link
                    key={
                      item.slug
                    }
                    href={
                      item.href
                    }
                    className={`
                      rounded-full

                      px-5
                      py-2.5

                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-[0.04em]

                      transition-all

                      ${
                        category ===
                        item.slug
                          ? "bg-[#B41443] text-white shadow-sm"
                          : "bg-white text-[#594B47] hover:bg-[#B41443] hover:text-white"
                      }
                    `}
                  >
                    {item.name}
                  </Link>
                )
              )}
            </div>

            {/* ===============================================
                CHILD MENU
            =============================================== */}

            {parent &&
              parent.children
                .length >
                0 && (
                <div
                  className="
                    mt-4

                    flex
                    min-w-max
                    items-center
                    justify-start
                    gap-3

                    border-t
                    border-black/10

                    pt-4

                    lg:justify-center
                  "
                >
                  <Link
                    href={
                      parent.href
                    }
                    className={`
                      rounded-full

                      px-4
                      py-2

                      text-[10px]
                      font-medium

                      transition

                      ${
                        !subcategory
                          ? "bg-[#211A18] text-white"
                          : "bg-white text-[#4F4541] hover:text-[#B41443]"
                      }
                    `}
                  >
                    All{" "}
                    {parent.name}
                  </Link>

                  {parent.children.map(
                    (
                      child
                    ) => (
                      <Link
                        key={
                          child.slug
                        }
                        href={
                          child.href
                        }
                        className={`
                          rounded-full

                          px-4
                          py-2

                          text-[10px]
                          font-medium

                          transition

                          ${
                            subcategory ===
                            child.slug
                              ? "bg-[#B41443] text-white"
                              : "bg-white text-[#4F4541] hover:text-[#B41443]"
                          }
                        `}
                      >
                        {child.name}
                      </Link>
                    )
                  )}
                </div>
              )}
          </div>

          {/* =================================================
              PRODUCTS HEADER
          ================================================= */}

          <div
            className="
              mb-7
              mt-8

              flex
              items-center
              justify-between
              gap-4
            "
          >
            <p
              className="
                text-[12px]
                font-medium
                text-black/55
              "
            >
              {sorted.length}{" "}
              {sorted.length ===
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
                h-11

                rounded-[10px]

                border
                border-black/10

                bg-white

                px-4

                text-[12px]
                text-[#211A18]

                outline-none

                transition

                focus:border-[#B41443]
              "
            >
              <option value="featured">
                Featured
              </option>

              <option value="low-high">
                Price Low to High
              </option>

              <option value="high-low">
                Price High to Low
              </option>
            </select>
          </div>

          {/* =================================================
              EMPTY
          ================================================= */}

          {sorted.length ===
          0 ? (
            <div
              className="
                flex
                min-h-[300px]
                items-center
                justify-center

                rounded-[18px]

                border
                border-dashed
                border-black/10

                bg-white
              "
            >
              <p
                className="
                  text-[13px]
                  text-black/45
                "
              >
                No products found.
              </p>
            </div>
          ) : (
            /* ===============================================
               PRODUCT GRID
            =============================================== */

            <div
              className="
                grid

                grid-cols-2

                gap-x-4
                gap-y-10

                sm:gap-x-5

                md:grid-cols-3

                lg:grid-cols-4

                xl:gap-x-6
              "
            >
              {sorted.map(
                (
                  product
                ) => {
                  const show =
                    Number(
                      product.discountedPrice
                    ) >
                    0
                      ? Number(
                          product.discountedPrice
                        )
                      : Number(
                          product.actualPrice
                        );

                  const original =
                    Number(
                      product.actualPrice
                    );

                  const discount =
                    original >
                      show &&
                    original >
                      0 &&
                    show >
                      0
                      ? Math.round(
                          ((original -
                            show) /
                            original) *
                            100
                        )
                      : 0;

                  const isWishlisted =
                    wishlist.has(
                      product.id
                    );

                  const isCartBusy =
                    cartBusy ===
                    product.id;

                  return (
                    <article
                      key={
                        product.id
                      }
                      className="
                        group
                        min-w-0
                      "
                    >
                      {/* =====================================
                          IMAGE
                      ===================================== */}

                      <div
                        className="
                          relative

                          overflow-hidden

                          rounded-[16px]

                          bg-[#F3ECE6]
                        "
                      >
                        <Link
                          href={`/product/${product.slug}`}
                          className="
                            relative

                            block

                            aspect-[4/5]

                            w-full

                            overflow-hidden
                          "
                        >
                          {product.image1 ? (
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
                                object-center

                                transition-all
                                duration-500

                                group-hover:scale-[1.015]
                                group-hover:opacity-0
                              "
                            />
                          ) : (
                            <div
                              className="
                                absolute
                                inset-0

                                flex
                                items-center
                                justify-center

                                text-[12px]
                                text-black/30
                              "
                            >
                              No Image
                            </div>
                          )}

                          {(
                            product.image2 ||
                            product.image1
                          ) && (
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
                                object-center

                                opacity-0

                                transition-all
                                duration-500

                                group-hover:scale-[1.015]
                                group-hover:opacity-100
                              "
                            />
                          )}

                          {discount >
                            0 && (
                            <span
                              className="
                                absolute
                                left-3
                                top-3
                                z-10

                                rounded-full

                                bg-[#B41443]

                                px-3
                                py-1.5

                                text-[9px]
                                font-semibold
                                text-white

                                shadow-sm
                              "
                            >
                              {discount}%
                              OFF
                            </span>
                          )}
                        </Link>

                        {/* ===================================
                            WISHLIST
                        =================================== */}

                        <button
                          type="button"
                          aria-label={
                            isWishlisted
                              ? "Remove from wishlist"
                              : "Add to wishlist"
                          }
                          disabled={
                            wishlistBusy ===
                            product.id
                          }
                          onClick={() =>
                            void toggleWishlist(
                              product
                            )
                          }
                          className={`
                            absolute
                            right-3
                            top-3
                            z-20

                            flex
                            h-10
                            w-10
                            items-center
                            justify-center

                            rounded-full

                            border

                            text-[20px]

                            shadow-sm

                            transition-all
                            duration-200

                            ${
                              isWishlisted
                                ? "border-[#B41443] bg-[#B41443] text-white"
                                : "border-white/70 bg-white text-[#B41443] hover:bg-[#B41443] hover:text-white"
                            }

                            disabled:opacity-50
                          `}
                        >
                          {wishlistBusy ===
                          product.id
                            ? "…"
                            : isWishlisted
                              ? "♥"
                              : "♡"}
                        </button>
                      </div>

                      {/* =====================================
                          ADD TO BAG
                      ===================================== */}

                      <button
                        type="button"
                        disabled={
                          isCartBusy
                        }
                        onClick={() =>
                          void openCart(
                            product
                          )
                        }
                        className="
                          mt-2.5

                          flex
                          h-[42px]
                          w-full
                          items-center
                          justify-center

                          rounded-[8px]

                          bg-[#B41443]

                          px-4

                          text-[10px]
                          font-semibold
                          uppercase
                          tracking-[0.06em]
                          text-white

                          transition-colors

                          hover:bg-[#8F1035]

                          disabled:cursor-not-allowed
                          disabled:opacity-60
                        "
                      >
                        {isCartBusy
                          ? "Loading..."
                          : "Add To Bag"}
                      </button>

                      {/* =====================================
                          DETAILS
                      ===================================== */}

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

                            min-h-[38px]

                            text-[13px]
                            font-medium
                            leading-[1.45]
                            text-[#211A18]

                            transition-colors

                            hover:text-[#B41443]
                          "
                        >
                          {product.name}
                        </Link>

                        {/* PRICE */}

                        <div
                          className="
                            mt-2

                            flex
                            flex-wrap
                            items-center
                            gap-2
                          "
                        >
                          <span
                            className="
                              text-[15px]
                              font-semibold
                              text-[#211A18]
                            "
                          >
                            ₹
                            {show.toLocaleString(
                              "en-IN",
                              {
                                maximumFractionDigits:
                                  2,
                              }
                            )}
                          </span>

                          {original >
                            show && (
                            <>
                              <span
                                className="
                                  text-[11px]
                                  text-black/35
                                  line-through
                                "
                              >
                                ₹
                                {original.toLocaleString(
                                  "en-IN",
                                  {
                                    maximumFractionDigits:
                                      2,
                                  }
                                )}
                              </span>

                              {discount >
                                0 && (
                                <span
                                  className="
                                    rounded-full

                                    bg-[#F8E5E8]

                                    px-2
                                    py-1

                                    text-[9px]
                                    font-semibold
                                    text-[#B41443]
                                  "
                                >
                                  {discount}%
                                  OFF
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}