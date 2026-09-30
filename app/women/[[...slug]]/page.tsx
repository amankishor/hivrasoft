import {
  notFound,
} from "next/navigation";

import Header from "@/src/components/Header/Header";

import WomenCatalog from "@/src/components/Women/WomenCatalog";

import {
  getWomenPageDescription,
  getWomenPageTitle,
  isValidWomenPath,
  normalizeWomenSlug,
  type WomenProduct,
} from "@/src/data/women";

import {
  getCategoryBanners,
} from "@/src/Services/categoryBanners";

import {
  getActiveProducts,
  getDefaultColor,
  normalizeStoreProduct,
  type ApiColor,
  type ApiProduct,
} from "@/src/Services/products";

/* =========================================================
   FRESH DATA
========================================================= */

export const dynamic =
  "force-dynamic";

/* =========================================================
   PAGE PROPS
========================================================= */

type WomenPageProps = {
  params: Promise<{
    slug?: string[];
  }>;
};

/* =========================================================
   ROOT CATEGORY
========================================================= */

const ROOT_CATEGORY =
  "women";

/* =========================================================
   WOMEN ROOT ALIASES
========================================================= */

const WOMEN_ROOT_SLUGS =
  new Set([
    "women",
    "woman",
    "womens",
    "womenswear",
    "female",
  ]);

/* =========================================================
   CATEGORY ALIASES
========================================================= */

const CATEGORY_ALIASES: Record<
  string,
  string[]
> = {
  bra: [
    "bra",
    "bras",
  ],

  bras: [
    "bras",
    "bra",
  ],

  panty: [
    "panty",
    "panties",
  ],

  panties: [
    "panties",
    "panty",
  ],

  "sports-bra": [
    "sports-bra",
    "sports-bras",
  ],

  "sports-bras": [
    "sports-bras",
    "sports-bra",
  ],

  "maternity-bra": [
    "maternity-bra",
    "maternity-bras",
  ],

  "maternity-bras": [
    "maternity-bras",
    "maternity-bra",
  ],

  "t-shirt-bra": [
    "t-shirt-bra",
    "t-shirt-bras",
  ],

  "t-shirt-bras": [
    "t-shirt-bras",
    "t-shirt-bra",
  ],

  "padded-bra": [
    "padded-bra",
    "padded-bras",
  ],

  "padded-bras": [
    "padded-bras",
    "padded-bra",
  ],

  "non-padded-bra": [
    "non-padded-bra",
    "non-padded-bras",
  ],

  "non-padded-bras": [
    "non-padded-bras",
    "non-padded-bra",
  ],

  "seamless-panty": [
    "seamless-panty",
    "seamless-panties",
  ],

  "seamless-panties": [
    "seamless-panties",
    "seamless-panty",
  ],

  hipster: [
    "hipster",
    "hipsters",
  ],

  hipsters: [
    "hipsters",
    "hipster",
  ],

  thong: [
    "thong",
    "thongs",
  ],

  thongs: [
    "thongs",
    "thong",
  ],

  "g-string": [
    "g-string",
    "g-strings",
  ],

  "g-strings": [
    "g-strings",
    "g-string",
  ],
};

/* =========================================================
   PRICE TYPES
========================================================= */

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

  sellingPrice?:
    | number
    | string;

  salePrice?:
    | number
    | string;

  price?:
    | number
    | string;

  discountedPrice?:
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
};

type PriceColor =
  ApiColor &
    PriceFields;

type PriceProduct =
  ApiProduct &
    PriceFields;

/* =========================================================
   POSITIVE NUMBER
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

/* =========================================================
   CATEGORY ALIASES
========================================================= */

function getAliases(
  value?: string
): string[] {
  const slug =
    normalizeWomenSlug(
      value
    );

  if (!slug) {
    return [];
  }

  return Array.from(
    new Set([
      slug,

      ...(
        CATEGORY_ALIASES[
          slug
        ] || []
      ),
    ])
  );
}

/* =========================================================
   ALL PRODUCT CATEGORY SLUGS

   normalized.categorySlugs
   +
   raw backend categories
========================================================= */

function getProductCategorySlugs(
  product: ApiProduct
): string[] {
  const normalized =
    normalizeStoreProduct(
      product
    );

  const slugs =
    new Set<string>();

  if (
    Array.isArray(
      normalized.categorySlugs
    )
  ) {
    for (
      const slug of
        normalized.categorySlugs
    ) {
      const value =
        normalizeWomenSlug(
          slug
        );

      if (
        value
      ) {
        slugs.add(
          value
        );
      }
    }
  }

  const rawCategories =
    (product as any)
      ?.categories;

  if (
    Array.isArray(
      rawCategories
    )
  ) {
    for (
      const category of
        rawCategories
    ) {
      if (
        typeof category ===
        "string"
      ) {
        const value =
          normalizeWomenSlug(
            category
          );

        if (
          value
        ) {
          slugs.add(
            value
          );
        }

        continue;
      }

      const categorySlug =
        normalizeWomenSlug(
          category?.slug
        );

      const categoryName =
        normalizeWomenSlug(
          category?.name
        );

      if (
        categorySlug
      ) {
        slugs.add(
          categorySlug
        );
      }

      if (
        categoryName
      ) {
        slugs.add(
          categoryName
        );
      }
    }
  }

  return Array.from(
    slugs
  );
}

/* =========================================================
   WOMEN CARD PRICE
========================================================= */

function getWomenCardPrices(
  product: ApiProduct
): {
  showPrice: number;
  originalPrice: number;
  discountPercent: number;
} {
  const defaultColor =
    getDefaultColor(
      product
    ) as
      | PriceColor
      | null;

  const rootProduct =
    product as PriceProduct;

  const showPriceCandidate =
    pickPositiveNumber(
      defaultColor
        ?.showPrice,

      rootProduct
        .showPrice,

      defaultColor
        ?.sellingPrice,

      defaultColor
        ?.salePrice,

      defaultColor
        ?.price,

      defaultColor
        ?.discountedPrice,

      rootProduct
        .sellingPrice,

      rootProduct
        .salePrice,

      rootProduct
        .price,

      rootProduct
        .discountedPrice
    );

  const originalPriceCandidate =
    pickPositiveNumber(
      defaultColor
        ?.originalPrice,

      rootProduct
        .originalPrice,

      defaultColor
        ?.mrp,

      defaultColor
        ?.compareAtPrice,

      defaultColor
        ?.actualPrice,

      rootProduct
        .mrp,

      rootProduct
        .compareAtPrice,

      rootProduct
        .actualPrice
    );

  const showPrice =
    showPriceCandidate ??
    originalPriceCandidate ??
    0;

  const originalPrice =
    originalPriceCandidate ??
    showPrice;

  const finalOriginal =
    originalPrice >
      showPrice
      ? originalPrice
      : showPrice;

  const discountPercent =
    finalOriginal >
      showPrice &&
    finalOriginal >
      0 &&
    showPrice >
      0
      ? Math.round(
          ((finalOriginal -
            showPrice) /
            finalOriginal) *
            100
        )
      : 0;

  return {
    showPrice,

    originalPrice:
      finalOriginal,

    discountPercent,
  };
}

/* =========================================================
   WOMEN PRODUCT CHECK
========================================================= */

function isWomenProduct(
  product: ApiProduct
): boolean {
  const slugs =
    getProductCategorySlugs(
      product
    );

  return slugs.some(
    (
      slug
    ) =>
      WOMEN_ROOT_SLUGS.has(
        slug
      )
  );
}

/* =========================================================
   CATEGORY MATCH
========================================================= */

function matchesCategorySlug(
  productSlugs: string[],
  routeSlug?: string
): boolean {
  const aliases =
    getAliases(
      routeSlug
    );

  return aliases.some(
    (
      alias
    ) =>
      productSlugs.includes(
        alias
      )
  );
}

/* =========================================================
   ROUTE MATCH
========================================================= */

function matchesWomenRoute(
  product: ApiProduct,
  route: string[]
): boolean {
  const productSlugs =
    getProductCategorySlugs(
      product
    );

  /* ROOT WOMEN */

  if (
    !productSlugs.some(
      (
        slug
      ) =>
        WOMEN_ROOT_SLUGS.has(
          slug
        )
    )
  ) {
    return false;
  }

  /* /women */

  if (
    route.length ===
    0
  ) {
    return true;
  }

  /* /women/offers */

  if (
    route.length ===
      1 &&
    normalizeWomenSlug(
      route[0]
    ) === "offers"
  ) {
    const prices =
      getWomenCardPrices(
        product
      );

    return (
      prices.originalPrice >
        prices.showPrice &&
      prices.showPrice >
        0
    );
  }

  /* CATEGORY PATH */

  return route.every(
    (
      routeSlug
    ) =>
      matchesCategorySlug(
        productSlugs,
        routeSlug
      )
  );
}

/* =========================================================
   MAP PRODUCT
========================================================= */

function mapProductToWomenProduct(
  product: ApiProduct
): WomenProduct {
  const normalized =
    normalizeStoreProduct(
      product
    );

  const prices =
    getWomenCardPrices(
      product
    );

  const categorySlugs =
    getProductCategorySlugs(
      product
    );

  const nonRootCategories =
    categorySlugs.filter(
      (
        slug
      ) =>
        !WOMEN_ROOT_SLUGS.has(
          slug
        )
    );

  return {
    id:
      normalized.id,

    name:
      normalized.name,

    slug:
      normalized.slug,

    image1:
      normalized.image1,

    image2:
      normalized.image2,

    discountedPrice:
      prices.showPrice,

    actualPrice:
      prices.originalPrice,

    category:
      nonRootCategories[
        0
      ] ||
      ROOT_CATEGORY,

    subcategories:
      categorySlugs,

    onOffer:
      prices.originalPrice >
        prices.showPrice &&
      prices.showPrice >
        0,

    isFeatured:
      normalized.isFeatured,

    isNewLaunch:
      normalized.isNewLaunch,
  };
}

/* =========================================================
   PAGE
========================================================= */

export default async function WomenPage({
  params,
}: WomenPageProps) {
  const resolvedParams =
    await params;

  /* =======================================================
     ROUTE
  ======================================================= */

  const route =
    Array.isArray(
      resolvedParams.slug
    )
      ? resolvedParams.slug
          .map(
            normalizeWomenSlug
          )
          .filter(
            Boolean
          )
      : [];

  /* =======================================================
     VALIDATE
  ======================================================= */

  if (
    !isValidWomenPath(
      route
    )
  ) {
    notFound();
  }

  const category =
    route[0];

  const subcategory =
    route[1];

  /* =======================================================
     PRODUCTS + BANNER API

     Banner exact selected category ka aayega.

     /women
     -> women

     /women/bra
     -> bra

     /women/bra/sports-bra
     -> sports-bra

     No image
     -> []
  ======================================================= */

  const [
    activeProducts,
    banners,
  ] =
    await Promise.all([
      getActiveProducts(),

      getCategoryBanners({
        rootCategory:
          ROOT_CATEGORY,

        path:
          route,
      }),
    ]);

  /* =======================================================
     WOMEN PRODUCTS
  ======================================================= */

  const womenProducts =
    Array.isArray(
      activeProducts
    )
      ? activeProducts.filter(
          isWomenProduct
        )
      : [];

  /* =======================================================
     CURRENT CATEGORY PRODUCTS
  ======================================================= */

  const visibleProducts =
    womenProducts.filter(
      (
        product
      ) =>
        matchesWomenRoute(
          product,
          route
        )
    );

  /* =======================================================
     MAP PRODUCTS
  ======================================================= */

  const products: WomenProduct[] =
    visibleProducts
      .map(
        mapProductToWomenProduct
      )
      .filter(
        (
          product
        ) =>
          Boolean(
            product.id &&
              product.slug
          )
      );

  /* =======================================================
     TITLE
  ======================================================= */

  const title =
    getWomenPageTitle(
      route
    );

  /* =======================================================
     DESCRIPTION
  ======================================================= */

  const description =
    getWomenPageDescription(
      route
    );

  /* =======================================================
     DEBUG
  ======================================================= */

  console.log(
    "[WOMEN STOREFRONT]",
    {
      route,

      category,

      subcategory,

      selectedBannerCategory:
        route.length >
        0
          ? route[
              route.length -
                1
            ]
          : ROOT_CATEGORY,

      banners:
        banners.length,

      activeProducts:
        Array.isArray(
          activeProducts
        )
          ? activeProducts.length
          : 0,

      womenProducts:
        womenProducts.length,

      visibleProducts:
        visibleProducts.length,

      finalProducts:
        products.length,
    }
  );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <Header />

      <WomenCatalog
        products={
          products
        }

        banners={
          banners
        }

        title={
          title
        }

        description={
          description
        }

        category={
          category
        }

        subcategory={
          subcategory
        }
      />
    </>
  );
}