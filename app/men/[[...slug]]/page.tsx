import {
  notFound,
} from "next/navigation";

import Header from "@/src/components/Header/Header";

import MenCatalog from "@/src/components/Men/MenCatalog";

import {
  getMenPageDescription,
  getMenPageTitle,
  isValidMenPath,
  type MenProduct,
} from "@/src/data/men";

import {
  getActiveProducts,
  getDefaultColor,
  normalizeStoreProduct,
  type ApiColor,
  type ApiProduct,
} from "@/src/services/products";

import {
  getCategoryBanners,
} from "@/src/Services/categoryBanners";

/* =========================================================
   FRESH DATA
========================================================= */

export const dynamic =
  "force-dynamic";

/* =========================================================
   PROPS
========================================================= */

type MenPageProps = {
  params: Promise<{
    slug?: string[];
  }>;
};

/* =========================================================
   PRICE TYPE
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
   MEN ROOTS
========================================================= */

const MEN_ROOT_SLUGS =
  new Set([
    "men",
    "mens",
    "menswear",
    "male",
  ]);

/* =========================================================
   NORMALIZE ROUTE
========================================================= */

function normalizeRouteValue(
  value?: string
): string {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase();
}

/* =========================================================
   POSITIVE PRICE
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
   GET MEN CARD PRICES
========================================================= */

function getMenCardPrices(
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

  /* =======================================================
     SHOW PRICE
  ======================================================= */

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

  /* =======================================================
     ORIGINAL PRICE
  ======================================================= */

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

  /* =======================================================
     FINAL VALUES
  ======================================================= */

  const showPrice =
    showPriceCandidate ??
    originalPriceCandidate ??
    0;

  const originalPrice =
    originalPriceCandidate ??
    showPrice;

  const discountPercent =
    originalPrice >
      showPrice &&
    originalPrice > 0 &&
    showPrice > 0
      ? Math.round(
          ((originalPrice -
            showPrice) /
            originalPrice) *
            100
        )
      : 0;

  return {
    showPrice,

    originalPrice:
      originalPrice >
      showPrice
        ? originalPrice
        : showPrice,

    discountPercent,
  };
}

/* =========================================================
   MEN PRODUCT CHECK
========================================================= */

function isMenProduct(
  product: ApiProduct
): boolean {
  const normalized =
    normalizeStoreProduct(
      product
    );

  const slugs =
    normalized.categorySlugs.map(
      normalizeRouteValue
    );

  return slugs.some(
    (
      slug
    ) =>
      MEN_ROOT_SLUGS.has(
        slug
      )
  );
}

/* =========================================================
   ROUTE MATCH
========================================================= */

function matchesMenRoute(
  product: ApiProduct,
  category?: string,
  subcategory?: string
): boolean {
  const normalized =
    normalizeStoreProduct(
      product
    );

  const slugs =
    normalized.categorySlugs.map(
      normalizeRouteValue
    );

  /* =======================================================
     MEN CHECK
  ======================================================= */

  if (
    !slugs.some(
      (
        slug
      ) =>
        MEN_ROOT_SLUGS.has(
          slug
        )
    )
  ) {
    return false;
  }

  /* =======================================================
     /men
  ======================================================= */

  if (
    !category
  ) {
    return true;
  }

  const categorySlug =
    normalizeRouteValue(
      category
    );

  const subcategorySlug =
    normalizeRouteValue(
      subcategory
    );

  /* =======================================================
     OFFERS
  ======================================================= */

  if (
    categorySlug ===
    "offers"
  ) {
    const prices =
      getMenCardPrices(
        product
      );

    return (
      prices.originalPrice >
        prices.showPrice &&
      prices.showPrice > 0
    );
  }

  /* =======================================================
     CATEGORY
  ======================================================= */

  if (
    !slugs.includes(
      categorySlug
    )
  ) {
    return false;
  }

  if (
    !subcategorySlug
  ) {
    return true;
  }

  return slugs.includes(
    subcategorySlug
  );
}

/* =========================================================
   MAP API PRODUCT -> MEN PRODUCT
========================================================= */

function mapProductToMenProduct(
  product: ApiProduct
): MenProduct {
  const normalized =
    normalizeStoreProduct(
      product
    );

  const prices =
    getMenCardPrices(
      product
    );

  return {
    /* ID */

    id:
      normalized.id,

    /* NAME */

    name:
      normalized.name,

    /* SLUG */

    slug:
      normalized.slug,

    /* IMAGES */

    image1:
      normalized.image1,

    image2:
      normalized.image2,

    /* =====================================================
       PRICE

       discountedPrice = SHOW PRICE
       actualPrice     = ORIGINAL PRICE
    ===================================================== */

    discountedPrice:
      prices.showPrice,

    actualPrice:
      prices.originalPrice,

    /* CATEGORY */

    category:
      normalized.categorySlugs[
        1
      ] ||
      normalized.categorySlugs[
        0
      ] ||
      "men",

    subcategories:
      normalized.categorySlugs,

    /* OFFER */

    onOffer:
      prices.originalPrice >
        prices.showPrice &&
      prices.showPrice > 0,

    /* FLAGS */

    isFeatured:
      normalized.isFeatured,

    isNewLaunch:
      normalized.isNewLaunch,
  };
}

/* =========================================================
   PAGE
========================================================= */

export default async function MenPage({
  params,
}: MenPageProps) {
  const resolvedParams =
    await params;

  const route =
    Array.isArray(
      resolvedParams.slug
    )
      ? resolvedParams.slug
      : [];

  const category =
    route[0];

  const subcategory =
    route[1];

  /* =======================================================
     VALIDATE
  ======================================================= */

  if (
    !isValidMenPath(
      category,
      subcategory
    )
  ) {
    notFound();
  }

  /* =======================================================
     PRODUCTS API
  ======================================================= */

  const activeProducts =
    await getActiveProducts();

  /* =======================================================
     MEN PRODUCTS
  ======================================================= */

  const menProducts =
    activeProducts.filter(
      isMenProduct
    );

  /* =======================================================
     CURRENT ROUTE PRODUCTS
  ======================================================= */

  const visibleProducts =
    menProducts.filter(
      (
        product
      ) =>
        matchesMenRoute(
          product,
          category,
          subcategory
        )
    );

  /* =======================================================
     MAP PRODUCTS
  ======================================================= */

  const products: MenProduct[] =
    visibleProducts
      .map(
        mapProductToMenProduct
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
     CATEGORY BANNERS

     IMPORTANT:

     /men
     -> Men category banner

     /men/trunks
     -> Trunks banner

     /men/underwear/trunks
     -> Trunks banner

     Exact/deepest selected category only.

     Agar category me image nahi hai:
     -> banners = []
     -> banner show nahi hoga
  ======================================================= */

  const banners =
    await getCategoryBanners({
      rootCategory:
        "men",

      path:
        route,
    });

  /* =======================================================
     PAGE TITLE
  ======================================================= */

  const title =
    getMenPageTitle(
      category,
      subcategory
    );

  /* =======================================================
     PAGE DESCRIPTION
  ======================================================= */

  const description =
    getMenPageDescription(
      category,
      subcategory
    );

  /* =======================================================
     DEBUG

     Testing ke baad remove kar sakte ho.
  ======================================================= */

  console.log(
    "[MEN PAGE]",
    {
      route,

      category,

      subcategory,

      products:
        products.length,

      banners:
        banners.length,
    }
  );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <Header />

      <MenCatalog
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