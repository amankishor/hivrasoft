import {
  notFound,
} from "next/navigation";

import Header from "@/components/Header/Header";

import WomenCatalog from "@/components/Women/WomenCatalog";

import {
  getWomenBanners,
  getWomenPageDescription,
  getWomenPageTitle,
  isValidWomenPath,
  type WomenProduct,
} from "@/data/women";

/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export const dynamic =
  "force-dynamic";

/* =========================================================
   TYPES
========================================================= */

type ApiImage = {
  url: string;
  publicId?: string;
};

type ApiCategory = {
  _id?: string;
  id?: string;

  name: string;
  slug: string;

  level?: number;
};

type ApiProduct = {
  _id?: string;
  id?: string;

  name: string;
  slug: string;

  shortDescription?: string;
  description?: string;

  price: number;
  compareAtPrice?: number;

  mainImages?: ApiImage[];

  categories?: ApiCategory[];

  status?: string;

  isFeatured?: boolean;
  isNewLaunch?: boolean;
};

type WomenPageProps = {
  params: Promise<{
    slug?: string[];
  }>;
};

/* =========================================================
   GET PUBLIC ACTIVE PRODUCTS

   IMPORTANT:
   /api/products = admin protected -> 401

   Storefront ke liye:
   /api/products/active
========================================================= */

async function getProducts():
  Promise<ApiProduct[]> {
  try {
    const response =
      await fetch(
        `${API_URL}/api/products/active`,
        {
          method: "GET",

          cache:
            "no-store",
        }
      );

    if (!response.ok) {
      console.error(
        "Active Products API failed:",
        response.status
      );

      return [];
    }

    const data =
      await response.json();

    /*
     * Support:
     *
     * { products: [...] }
     * { data: [...] }
     * [...]
     */

    if (
      Array.isArray(
        data.products
      )
    ) {
      return data.products;
    }

    if (
      Array.isArray(
        data.data
      )
    ) {
      return data.data;
    }

    if (
      Array.isArray(
        data
      )
    ) {
      return data;
    }

    return [];
  } catch (error) {
    console.error(
      "Products fetch failed:",
      error
    );

    return [];
  }
}

/* =========================================================
   CATEGORY SLUGS
========================================================= */

function getCategorySlugs(
  product: ApiProduct
): string[] {
  if (
    !Array.isArray(
      product.categories
    )
  ) {
    return [];
  }

  return product.categories
    .map(
      (category) =>
        category.slug
          ?.trim()
          .toLowerCase()
    )
    .filter(
      (
        slug
      ): slug is string =>
        Boolean(slug)
    );
}

/* =========================================================
   WOMEN ROUTE FILTER
========================================================= */

function matchesWomenRoute(
  product: ApiProduct,
  category?: string,
  subcategory?: string
) {
  const categorySlugs =
    getCategorySlugs(
      product
    );

  /* =======================================================
     Product MUST belong to Women
  ======================================================= */

  if (
    !categorySlugs.includes(
      "women"
    )
  ) {
    return false;
  }

  /* =======================================================
     /women
  ======================================================= */

  if (!category) {
    return true;
  }

  /* =======================================================
     /women/offers
  ======================================================= */

  if (
    category === "offers"
  ) {
    const sellingPrice =
      Number(
        product.price
      ) || 0;

    const comparePrice =
      Number(
        product.compareAtPrice ||
          0
      );

    return (
      comparePrice >
      sellingPrice
    );
  }

  /* =======================================================
     /women/bra

     Selected categories:
     Women ✓
     Bra ✓
  ======================================================= */

  if (
    !categorySlugs.includes(
      category
    )
  ) {
    return false;
  }

  if (!subcategory) {
    return true;
  }

  /* =======================================================
     /women/bra/sports-bra

     Selected categories:
     Women ✓
     Bra ✓
     Sports Bra ✓
  ======================================================= */

  return categorySlugs.includes(
    subcategory
  );
}

/* =========================================================
   MAP API PRODUCT TO EXISTING WOMEN PRODUCT
========================================================= */

function mapProductToWomenProduct(
  product: ApiProduct
): WomenProduct {
  const categorySlugs =
    getCategorySlugs(
      product
    );

  /* MAIN IMAGES */

  const mainImages =
    Array.isArray(
      product.mainImages
    )
      ? product.mainImages.filter(
          (image) =>
            Boolean(
              image?.url
            )
        )
      : [];

  /*
   * Product card:
   *
   * image1 = normal
   * image2 = hover
   */

  const image1 =
    mainImages[0]?.url ||
    "";

  const image2 =
    mainImages[1]?.url ||
    image1;

  /* PRICE */

  const sellingPrice =
    Number(
      product.price
    ) || 0;

  const comparePrice =
    Number(
      product.compareAtPrice ||
        0
    );

  const actualPrice =
    comparePrice >
    sellingPrice
      ? comparePrice
      : sellingPrice;

  /* CATEGORY */

  let mainCategory =
    "women";

  if (
    categorySlugs.includes(
      "bra"
    )
  ) {
    mainCategory =
      "bra";
  } else if (
    categorySlugs.includes(
      "panty"
    )
  ) {
    mainCategory =
      "panty";
  } else {
    const otherCategory =
      categorySlugs.find(
        (slug) =>
          slug !==
          "women"
      );

    if (otherCategory) {
      mainCategory =
        otherCategory;
    }
  }

  const subcategories =
    categorySlugs.filter(
      (slug) =>
        slug !==
          "women" &&
        slug !==
          mainCategory
    );

  return {
    name:
      product.name,

    image1,

    image2,

    actualPrice,

    discountedPrice:
      sellingPrice,

    slug:
      product.slug,

    category:
      mainCategory,

    subcategories,

    onOffer:
      actualPrice >
      sellingPrice,
  };
}

/* =========================================================
   WOMEN PAGE
========================================================= */

export default async function WomenPage({
  params,
}: WomenPageProps) {
  const resolvedParams =
    await params;

  const slugParts =
    resolvedParams.slug ??
    [];

  /*
   * Supported:
   *
   * /women
   *
   * /women/bra
   *
   * /women/bra/sports-bra
   */

  if (
    slugParts.length >
    2
  ) {
    notFound();
  }

  const category =
    slugParts[0];

  const subcategory =
    slugParts[1];

  /* =======================================================
     VALIDATE OLD WOMEN URL SYSTEM
  ======================================================= */

  if (
    !isValidWomenPath(
      category,
      subcategory
    )
  ) {
    notFound();
  }

  /* =======================================================
     PRODUCTS FROM MONGODB
  ======================================================= */

  const apiProducts =
    await getProducts();

  const products =
    apiProducts
      .filter(
        (product) =>
          matchesWomenRoute(
            product,
            category,
            subcategory
          )
      )
      .map(
        mapProductToWomenProduct
      );

  /* =======================================================
     OLD BANNER SYSTEM - PRESERVED
  ======================================================= */

  const banners =
    getWomenBanners(
      category,
      subcategory
    );

  /* =======================================================
     OLD TITLE SYSTEM - PRESERVED
  ======================================================= */

  const title =
    getWomenPageTitle(
      category,
      subcategory
    );

  /* =======================================================
     OLD DESCRIPTION SYSTEM - PRESERVED
  ======================================================= */

  const description =
    getWomenPageDescription(
      category,
      subcategory
    );

  /* =======================================================
     EXISTING WOMEN DESIGN
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