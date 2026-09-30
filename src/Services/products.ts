/* =========================================================
   API URL
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

export type ApiImage = {
  url?: string;
  publicId?: string;
  isDefault?: boolean;
};

export type ApiSize = {
  _id?: string;
  id?: string;

  size?: string;
  name?: string;

  stock?: number;

  isActive?: boolean;
  isDefault?: boolean;

  /* =========================
     NEW ADMIN PRICING
  ========================= */

  originalPrice?: number;
  showPrice?: number;
  discountPrice?: number;

  /* =========================
     LEGACY PRICING
  ========================= */

  price?: number;
  sellingPrice?: number;
  discountedPrice?: number;
  salePrice?: number;

  compareAtPrice?: number;
  actualPrice?: number;
  mrp?: number;
};

export type ApiColor = {
  _id?: string;
  id?: string;

  nameColor?: string;
  slugColor?: string;

  nameProduct?: string;
  slugProduct?: string;

  shortDescription?: string;
  description?: string;

  isDefault?: boolean;
  isActive?: boolean;

  images?: ApiImage[];
  sizes?: ApiSize[];

  /* =========================
     NEW ADMIN PRICING
  ========================= */

  originalPrice?: number;
  showPrice?: number;
  discountPrice?: number;

  /* =========================
     LEGACY PRICING
  ========================= */

  price?: number;
  sellingPrice?: number;
  discountedPrice?: number;
  salePrice?: number;

  compareAtPrice?: number;
  actualPrice?: number;
  mrp?: number;
};

export type ApiCategory = {
  _id?: string;
  id?: string;

  name?: string;
  slug?: string;

  level?: number;
};

export type ApiProduct = {
  _id?: string;
  id?: string;

  /* =======================================================
     SIMPLE PRODUCT
  ======================================================= */

  name?: string;
  slug?: string;

  shortDescription?: string;
  description?: string;

  /* =========================
     NEW ADMIN PRICING
  ========================= */

  originalPrice?: number;
  showPrice?: number;
  discountPrice?: number;

  /* =========================
     LEGACY PRICING
  ========================= */

  price?: number;
  sellingPrice?: number;
  discountedPrice?: number;
  salePrice?: number;

  compareAtPrice?: number;
  actualPrice?: number;
  mrp?: number;

  mainImages?: ApiImage[];

  /* =======================================================
     CURRENT PRODUCT STRUCTURE
  ======================================================= */

  colors?: ApiColor[];

  categories?: Array<
    ApiCategory | string
  >;

  category?:
    | ApiCategory
    | string;

  categorySlugs?: string[];

  gender?: string;
  department?: string;
  audience?: string;

  isActive?: boolean;

  isFeatured?: boolean;
  isNewLaunch?: boolean;

  status?: string;

  ratings?: {
    average?: number;
    count?: number;
  };
};

/* =========================================================
   STOREFRONT PRODUCT
========================================================= */

export type StoreProductData = {
  id: string;

  name: string;
  slug: string;

  shortDescription: string;

  image1: string;
  image2: string;

  /*
   * sellingPrice =
   * admin showPrice
   */

  sellingPrice: number;

  /*
   * actualPrice =
   * admin originalPrice
   */

  actualPrice: number;

  categorySlugs: string[];

  isActive: boolean;

  isFeatured: boolean;
  isNewLaunch: boolean;
};

/* =========================================================
   API RESPONSE
========================================================= */

type ProductsApiResponse =
  | ApiProduct[]
  | {
      products?: ApiProduct[];

      data?:
        | ApiProduct[]
        | {
            products?: ApiProduct[];
          };
    };

/* =========================================================
   NORMALIZE SLUG
========================================================= */

export function normalizeSlug(
  value?: string
): string {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['"]/g, "")
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

/* =========================================================
   NORMALIZE API RESPONSE
========================================================= */

function normalizeProductsResponse(
  response: ProductsApiResponse
): ApiProduct[] {
  if (
    Array.isArray(
      response
    )
  ) {
    return response;
  }

  if (
    response &&
    Array.isArray(
      response.products
    )
  ) {
    return response.products;
  }

  if (
    response &&
    Array.isArray(
      response.data
    )
  ) {
    return response.data;
  }

  if (
    response &&
    response.data &&
    !Array.isArray(
      response.data
    ) &&
    Array.isArray(
      response.data.products
    )
  ) {
    return response.data.products;
  }

  return [];
}

/* =========================================================
   GET ACTIVE PRODUCTS
========================================================= */

export async function getActiveProducts(): Promise<
  ApiProduct[]
> {
  try {
    const response =
      await fetch(
        `${API_URL}/api/products/active`,
        {
          method: "GET",

          cache: "no-store",

          headers: {
            Accept:
              "application/json",
          },
        }
      );

    if (
      !response.ok
    ) {
      console.error(
        "[PRODUCTS] API failed:",
        response.status
      );

      return [];
    }

    const data =
      (await response.json()) as ProductsApiResponse;

    return normalizeProductsResponse(
      data
    );
  } catch (
    error
  ) {
    console.error(
      "[PRODUCTS] Fetch failed:",
      error
    );

    return [];
  }
}

/* =========================================================
   DEFAULT COLOR
========================================================= */

export function getDefaultColor(
  product: ApiProduct
): ApiColor | null {
  const colors =
    Array.isArray(
      product.colors
    )
      ? product.colors.filter(
          (color) =>
            color?.isActive !==
            false
        )
      : [];

  if (
    colors.length ===
    0
  ) {
    return null;
  }

  return (
    colors.find(
      (color) =>
        color?.isDefault ===
        true
    ) ||
    colors[0] ||
    null
  );
}

/* =========================================================
   DEFAULT SIZE
========================================================= */

function getDefaultSize(
  color: ApiColor | null
): ApiSize | null {
  if (
    !color
  ) {
    return null;
  }

  const sizes =
    Array.isArray(
      color.sizes
    )
      ? color.sizes.filter(
          (size) =>
            size?.isActive !==
            false
        )
      : [];

  if (
    sizes.length ===
    0
  ) {
    return null;
  }

  return (
    sizes.find(
      (size) =>
        size?.isDefault ===
        true
    ) ||
    sizes[0] ||
    null
  );
}

/* =========================================================
   FIRST POSITIVE NUMBER

   IMPORTANT:
   ₹0 ko valid product price nahi maante.
========================================================= */

function firstNumber(
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
      Number(
        value
      );

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

/* =========================================================
   PRODUCT ID
========================================================= */

export function getProductId(
  product: ApiProduct
): string {
  return String(
    product._id ||
      product.id ||
      ""
  );
}

/* =========================================================
   PRODUCT NAME
========================================================= */

export function getProductName(
  product: ApiProduct
): string {
  const defaultColor =
    getDefaultColor(
      product
    );

  return String(
    defaultColor
      ?.nameProduct ||
      product.name ||
      "Unnamed Product"
  );
}

/* =========================================================
   PRODUCT SLUG
========================================================= */

export function getProductSlug(
  product: ApiProduct
): string {
  const defaultColor =
    getDefaultColor(
      product
    );

  return String(
    defaultColor
      ?.slugProduct ||
      product.slug ||
      ""
  );
}

/* =========================================================
   SHORT DESCRIPTION
========================================================= */

export function getProductShortDescription(
  product: ApiProduct
): string {
  const defaultColor =
    getDefaultColor(
      product
    );

  return String(
    defaultColor
      ?.shortDescription ||
      product.shortDescription ||
      ""
  );
}

/* =========================================================
   CATEGORY SLUGS
========================================================= */

export function getProductCategorySlugs(
  product: ApiProduct
): string[] {
  const result: Array<{
    slug: string;
    level: number;
    index: number;
  }> = [];

  const categories =
    Array.isArray(
      product.categories
    )
      ? product.categories
      : [];

  categories.forEach(
    (
      category,
      index
    ) => {
      if (
        typeof category ===
        "string"
      ) {
        const value =
          category.trim();

        /*
         * Mongo ObjectId ko category
         * slug nahi maanenge.
         */

        if (
          /^[a-f0-9]{24}$/i.test(
            value
          )
        ) {
          return;
        }

        const slug =
          normalizeSlug(
            value
          );

        if (
          slug
        ) {
          result.push({
            slug,
            level: 999,
            index,
          });
        }

        return;
      }

      const slug =
        normalizeSlug(
          category?.slug ||
            category?.name
        );

      if (
        !slug
      ) {
        return;
      }

      result.push({
        slug,

        level:
          typeof category
            ?.level ===
          "number"
            ? category.level
            : 999,

        index,
      });
    }
  );

  /* =======================================================
     SINGLE CATEGORY
  ======================================================= */

  if (
    product.category
  ) {
    if (
      typeof product.category ===
      "string"
    ) {
      if (
        !/^[a-f0-9]{24}$/i.test(
          product.category
        )
      ) {
        const slug =
          normalizeSlug(
            product.category
          );

        if (
          slug
        ) {
          result.push({
            slug,

            level: 999,

            index:
              result.length,
          });
        }
      }
    } else {
      const slug =
        normalizeSlug(
          product.category
            ?.slug ||
            product.category
              ?.name
        );

      if (
        slug
      ) {
        result.push({
          slug,

          level:
            typeof product
              .category
              ?.level ===
            "number"
              ? product
                  .category
                  .level
              : 999,

          index:
            result.length,
        });
      }
    }
  }

  /* =======================================================
     CATEGORY SLUG ARRAY
  ======================================================= */

  if (
    Array.isArray(
      product.categorySlugs
    )
  ) {
    product.categorySlugs.forEach(
      (
        value
      ) => {
        const slug =
          normalizeSlug(
            value
          );

        if (
          slug
        ) {
          result.push({
            slug,

            level: 999,

            index:
              result.length,
          });
        }
      }
    );
  }

  /* =======================================================
     GENDER FALLBACK
  ======================================================= */

  [
    product.gender,
    product.department,
    product.audience,
  ].forEach(
    (
      value
    ) => {
      const slug =
        normalizeSlug(
          value
        );

      if (
        slug
      ) {
        result.push({
          slug,

          level: 0,

          index:
            result.length,
        });
      }
    }
  );

  result.sort(
    (
      a,
      b
    ) => {
      if (
        a.level !==
        b.level
      ) {
        return (
          a.level -
          b.level
        );
      }

      return (
        a.index -
        b.index
      );
    }
  );

  return Array.from(
    new Set(
      result.map(
        (
          item
        ) =>
          item.slug
      )
    )
  );
}

/* =========================================================
   PRODUCT IMAGES
========================================================= */

export function getProductImageUrls(
  product: ApiProduct
): string[] {
  const defaultColor =
    getDefaultColor(
      product
    );

  const defaultColorImages =
    Array.isArray(
      defaultColor?.images
    )
      ? defaultColor.images
      : [];

  const defaultImage =
    defaultColorImages.find(
      (
        image
      ) =>
        image?.isDefault ===
          true &&
        Boolean(
          image?.url
        )
    );

  const remainingDefaultImages =
    defaultColorImages.filter(
      (
        image
      ) =>
        Boolean(
          image?.url
        ) &&
        image !==
          defaultImage
    );

  const mainImages =
    Array.isArray(
      product.mainImages
    )
      ? product.mainImages
      : [];

  const allColorImages =
    Array.isArray(
      product.colors
    )
      ? product.colors.flatMap(
          (
            color
          ) =>
            Array.isArray(
              color.images
            )
              ? color.images
              : []
        )
      : [];

  const images = [
    ...(defaultImage
      ? [
          defaultImage,
        ]
      : []),

    ...remainingDefaultImages,

    ...mainImages,

    ...allColorImages,
  ];

  const urls =
    images
      .map(
        (
          image
        ) =>
          String(
            image?.url ||
              ""
          ).trim()
      )
      .filter(
        Boolean
      );

  return Array.from(
    new Set(
      urls
    )
  );
}

/* =========================================================
   PRODUCT PRICES

   ADMIN:

   originalPrice = 899
   showPrice     = 348.99
   discountPrice = 550.01

   FRONTEND:

   sellingPrice = 348.99
   actualPrice  = 899
========================================================= */

export function getProductPrices(
  product: ApiProduct
): {
  sellingPrice: number;
  actualPrice: number;
} {
  const defaultColor =
    getDefaultColor(
      product
    );

  const defaultSize =
    getDefaultSize(
      defaultColor
    );

  /* =======================================================
     SELLING / SHOW PRICE

     showPrice FIRST.
  ======================================================= */

  const sellingCandidate =
    firstNumber(
      /* SIZE */

      defaultSize
        ?.showPrice,

      /* COLOR */

      defaultColor
        ?.showPrice,

      /* PRODUCT */

      product.showPrice,

      /* LEGACY SIZE */

      defaultSize
        ?.sellingPrice,

      defaultSize
        ?.salePrice,

      defaultSize
        ?.discountedPrice,

      defaultSize
        ?.price,

      /* LEGACY COLOR */

      defaultColor
        ?.sellingPrice,

      defaultColor
        ?.salePrice,

      defaultColor
        ?.discountedPrice,

      defaultColor
        ?.price,

      /* LEGACY PRODUCT */

      product.sellingPrice,

      product.salePrice,

      product.discountedPrice,

      product.price
    );

  /* =======================================================
     ORIGINAL PRICE
  ======================================================= */

  const originalCandidate =
    firstNumber(
      /* SIZE */

      defaultSize
        ?.originalPrice,

      /* COLOR */

      defaultColor
        ?.originalPrice,

      /* PRODUCT */

      product.originalPrice,

      /* LEGACY SIZE */

      defaultSize
        ?.compareAtPrice,

      defaultSize
        ?.actualPrice,

      defaultSize
        ?.mrp,

      /* LEGACY COLOR */

      defaultColor
        ?.compareAtPrice,

      defaultColor
        ?.actualPrice,

      defaultColor
        ?.mrp,

      /* LEGACY PRODUCT */

      product.compareAtPrice,

      product.actualPrice,

      product.mrp
    );

  const sellingPrice =
    sellingCandidate ??
    originalCandidate ??
    0;

  const originalPrice =
    originalCandidate ??
    sellingPrice;

  const actualPrice =
    originalPrice >
    sellingPrice
      ? originalPrice
      : sellingPrice;

  return {
    sellingPrice,
    actualPrice,
  };
}

/* =========================================================
   DISCOUNT AMOUNT
========================================================= */

export function getProductDiscountAmount(
  product: ApiProduct
): number {
  const defaultColor =
    getDefaultColor(
      product
    );

  const defaultSize =
    getDefaultSize(
      defaultColor
    );

  const backendDiscount =
    firstNumber(
      defaultSize
        ?.discountPrice,

      defaultColor
        ?.discountPrice,

      product.discountPrice
    );

  if (
    backendDiscount !==
    undefined
  ) {
    return backendDiscount;
  }

  const prices =
    getProductPrices(
      product
    );

  return prices.actualPrice >
    prices.sellingPrice
    ? prices.actualPrice -
        prices.sellingPrice
    : 0;
}

/* =========================================================
   DISCOUNT %
========================================================= */

export function getProductDiscountPercent(
  product: ApiProduct
): number {
  const prices =
    getProductPrices(
      product
    );

  if (
    prices.actualPrice <=
      prices.sellingPrice ||
    prices.actualPrice <=
      0 ||
    prices.sellingPrice <=
      0
  ) {
    return 0;
  }

  return Math.round(
    ((prices.actualPrice -
      prices.sellingPrice) /
      prices.actualPrice) *
      100
  );
}

/* =========================================================
   OFFER
========================================================= */

export function isProductOnOffer(
  product: ApiProduct
): boolean {
  const prices =
    getProductPrices(
      product
    );

  return (
    prices.actualPrice >
      prices.sellingPrice &&
    prices.sellingPrice >
      0
  );
}

/* =========================================================
   NORMALIZE PRODUCT
========================================================= */

export function normalizeStoreProduct(
  product: ApiProduct
): StoreProductData {
  const images =
    getProductImageUrls(
      product
    );

  const prices =
    getProductPrices(
      product
    );

  const categorySlugs =
    getProductCategorySlugs(
      product
    );

  return {
    id:
      getProductId(
        product
      ),

    name:
      getProductName(
        product
      ),

    slug:
      getProductSlug(
        product
      ),

    shortDescription:
      getProductShortDescription(
        product
      ),

    image1:
      images[0] ||
      "",

    image2:
      images[1] ||
      images[0] ||
      "",

    /*
     * ADMIN showPrice
     */

    sellingPrice:
      prices.sellingPrice,

    /*
     * ADMIN originalPrice
     */

    actualPrice:
      prices.actualPrice,

    categorySlugs,

    isActive:
      product.isActive !==
      false,

    isFeatured:
      product.isFeatured ===
      true,

    isNewLaunch:
      product.isNewLaunch ===
      true,
  };
}