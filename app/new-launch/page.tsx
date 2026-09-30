import Header from "@/src/components/Header/Header";

import NewLaunchCatalog, {
  type NewLaunchProduct,
} from "@/src/components/NewLaunch/NewLaunchCatalog";

import {
  getDefaultColor,
  normalizeStoreProduct,
  type ApiProduct,
} from "@/src/Services/products";

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

export const dynamic =
  "force-dynamic";

/* =========================================================
   TYPES
========================================================= */

type MediaItem = {
  url?: string;

  secure_url?: string;

  secureUrl?: string;

  src?: string;

  imageUrl?: string;

  poster?: string;

  isDefault?: boolean;

  isActive?: boolean;
};

type ApiCategory = {
  _id?: string;

  id?: string;

  name?: string;

  slug?: string;

  images?: Array<
    string | MediaItem
  >;

  categoryImages?: Array<
    string | MediaItem
  >;

  image?:
    | string
    | MediaItem;

  bannerImage?:
    | string
    | MediaItem;

  desktopImage?:
    | string
    | MediaItem;

  thumbnail?:
    | string
    | MediaItem;
};

type ApiBanner = {
  _id?: string;

  id?: string;

  title?: string;

  slug?: string;

  image?: string;

  imageUrl?: string;

  desktopImage?: string;

  bannerImage?: string;

  media?: Array<
    string | MediaItem
  >;

  images?: Array<
    string | MediaItem
  >;

  items?: Array<
    string | MediaItem
  >;

  isActive?: boolean;
};

/* =========================================================
   HELPERS
========================================================= */

function normalizeSlug(
  value?: string
): string {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase()
    .replace(
      /&/g,
      "and"
    )
    .replace(
      /['"]/g,
      ""
    )
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
   POSITIVE NUMBER
========================================================= */

function positiveNumber(
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
   MEDIA URL
========================================================= */

function getMediaUrl(
  media?:
    | string
    | MediaItem
    | null
): string {
  if (
    !media
  ) {
    return "";
  }

  if (
    typeof media ===
    "string"
  ) {
    return media.trim();
  }

  return String(
    media.url ||
      media.secure_url ||
      media.secureUrl ||
      media.imageUrl ||
      media.src ||
      media.poster ||
      ""
  ).trim();
}

/* =========================================================
   EXTRACT ARRAY
========================================================= */

function extractProductArray(
  data: any
): ApiProduct[] {
  if (
    Array.isArray(
      data
    )
  ) {
    return data;
  }

  const candidates = [
    data?.products,

    data?.items,

    data?.results,

    data?.data,

    data?.data?.products,

    data?.data?.items,

    data?.data?.results,
  ];

  for (
    const candidate of
      candidates
  ) {
    if (
      Array.isArray(
        candidate
      )
    ) {
      return candidate;
    }
  }

  return [];
}

/* =========================================================
   NEW LAUNCH PRODUCTS API

   THIS IS THE CORRECT API:

   GET /api/products/new-launches
========================================================= */

async function getNewLaunchProducts(): Promise<
  ApiProduct[]
> {
  try {
    const response =
      await fetch(
        `${API_URL}/api/products/new-launches`,
        {
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
      console.error(
        "[NEW LAUNCH API]",
        response.status
      );

      return [];
    }

    const data =
      await response.json();

    const products =
      extractProductArray(
        data
      );

    console.log(
      "[NEW LAUNCH API PRODUCTS]",
      products.length
    );

    return products;
  } catch (
    error
  ) {
    console.error(
      "[NEW LAUNCH API ERROR]",
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
  const normalized =
    normalizeStoreProduct(
      product
    );

  const result =
    new Set<string>();

  /* normalized */

  if (
    Array.isArray(
      normalized.categorySlugs
    )
  ) {
    for (
      const item of
        normalized.categorySlugs
    ) {
      const slug =
        normalizeSlug(
          item
        );

      if (
        slug
      ) {
        result.add(
          slug
        );
      }
    }
  }

  /* raw */

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
        const slug =
          normalizeSlug(
            category
          );

        if (
          slug
        ) {
          result.add(
            slug
          );
        }

        continue;
      }

      const slug =
        normalizeSlug(
          category?.slug
        );

      const name =
        normalizeSlug(
          category?.name
        );

      if (
        slug
      ) {
        result.add(
          slug
        );
      }

      if (
        name
      ) {
        result.add(
          name
        );
      }
    }
  }

  return Array.from(
    result
  );
}

/* =========================================================
   GENDER

   Men + New Launch
   => men tab

   Women + New Launch
   => women tab
========================================================= */

function getGender(
  product: ApiProduct
):
  | "men"
  | "women"
  | null {
  const slugs =
    getCategorySlugs(
      product
    );

  if (
    slugs.some(
      (
        slug
      ) =>
        [
          "women",
          "woman",
          "womens",
          "womenswear",
          "female",
        ].includes(
          slug
        )
    )
  ) {
    return "women";
  }

  if (
    slugs.some(
      (
        slug
      ) =>
        [
          "men",
          "mens",
          "menswear",
          "male",
        ].includes(
          slug
        )
    )
  ) {
    return "men";
  }

  return null;
}

/* =========================================================
   PRICE
========================================================= */

function getPrices(
  product: ApiProduct
): {
  price: number;

  compareAtPrice: number;
} {
  const defaultColor =
    getDefaultColor(
      product
    ) as any;

  const raw =
    product as any;

  const price =
    positiveNumber(
      defaultColor
        ?.showPrice,

      raw.showPrice,

      defaultColor
        ?.sellingPrice,

      raw.sellingPrice,

      defaultColor
        ?.salePrice,

      raw.salePrice,

      defaultColor
        ?.price,

      raw.price,

      defaultColor
        ?.discountedPrice,

      raw.discountedPrice
    ) ||
    0;

  const compareAtPrice =
    positiveNumber(
      defaultColor
        ?.originalPrice,

      raw.originalPrice,

      defaultColor
        ?.mrp,

      raw.mrp,

      defaultColor
        ?.compareAtPrice,

      raw.compareAtPrice,

      defaultColor
        ?.actualPrice,

      raw.actualPrice
    ) ||
    price;

  return {
    price,

    compareAtPrice:
      compareAtPrice >
      price
        ? compareAtPrice
        : price,
  };
}

/* =========================================================
   DESCRIPTION
========================================================= */

function getDescription(
  product: ApiProduct
): string {
  const raw =
    product as any;

  const defaultColor =
    getDefaultColor(
      product
    ) as any;

  return String(
    defaultColor
      ?.shortDescription ||
      raw.shortDescription ||
      raw.description ||
      ""
  ).trim();
}

/* =========================================================
   COLOR COUNT
========================================================= */

function getColorCount(
  product: ApiProduct
): number {
  const colors =
    (product as any)
      ?.colors;

  if (
    !Array.isArray(
      colors
    )
  ) {
    return 0;
  }

  return colors.filter(
    (
      color: any
    ) =>
      color &&
      color.isActive !==
        false
  ).length;
}

/* =========================================================
   MAP PRODUCT
========================================================= */

function mapProduct(
  product: ApiProduct
): NewLaunchProduct | null {
  const normalized =
    normalizeStoreProduct(
      product
    );

  const gender =
    getGender(
      product
    );

  if (
    !gender
  ) {
    console.warn(
      "[NEW LAUNCH NO GENDER]",
      {
        name:
          normalized.name,

        categories:
          getCategorySlugs(
            product
          ),
      }
    );

    return null;
  }

  if (
    !normalized.id ||
    !normalized.slug
  ) {
    return null;
  }

  const prices =
    getPrices(
      product
    );

  return {
    id:
      normalized.id,

    name:
      normalized.name,

    slug:
      normalized.slug,

    shortDescription:
      getDescription(
        product
      ),

    price:
      prices.price,

    compareAtPrice:
      prices.compareAtPrice,

    image:
      normalized.image1,

    hoverImage:
      normalized.image2 ||
      normalized.image1,

    colorCount:
      getColorCount(
        product
      ),

    gender,
  };
}

/* =========================================================
   BANNER EXTRACTION
========================================================= */

function extractBanner(
  data: any
): ApiBanner | null {
  if (
    !data
  ) {
    return null;
  }

  if (
    data.banner &&
    typeof data.banner ===
      "object"
  ) {
    return data.banner;
  }

  if (
    data.data?.banner &&
    typeof data.data
      .banner ===
      "object"
  ) {
    return data.data.banner;
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
    typeof data ===
      "object" &&
    (
      data.slug ||
      data.title ||
      data.images ||
      data.media
    )
  ) {
    return data;
  }

  return null;
}

/* =========================================================
   GET BANNER IMAGE
========================================================= */

function getBannerImage(
  banner:
    ApiBanner | null
): string {
  if (
    !banner
  ) {
    return "";
  }

  const direct =
    getMediaUrl(
      banner.desktopImage
    ) ||
    getMediaUrl(
      banner.bannerImage
    ) ||
    getMediaUrl(
      banner.image
    ) ||
    getMediaUrl(
      banner.imageUrl
    );

  if (
    direct
  ) {
    return direct;
  }

  const collections = [
    banner.images,

    banner.media,

    banner.items,
  ];

  for (
    const collection of
      collections
  ) {
    if (
      !Array.isArray(
        collection
      )
    ) {
      continue;
    }

    const defaultImage =
      collection.find(
        (
          item
        ) =>
          typeof item !==
            "string" &&
          item?.isDefault ===
            true &&
          item?.isActive !==
            false
      );

    const defaultUrl =
      getMediaUrl(
        defaultImage
      );

    if (
      defaultUrl
    ) {
      return defaultUrl;
    }

    for (
      const item of
        collection
    ) {
      if (
        typeof item !==
          "string" &&
        item?.isActive ===
          false
      ) {
        continue;
      }

      const url =
        getMediaUrl(
          item
        );

      if (
        url
      ) {
        return url;
      }
    }
  }

  return "";
}

/* =========================================================
   FETCH BANNER

   FIRST:
   /api/banners/slug/new-launch
========================================================= */

async function getNewLaunchBanner(): Promise<{
  image: string;

  title: string;
}> {
  try {
    const response =
      await fetch(
        `${API_URL}/api/banners/slug/new-launch`,
        {
          cache:
            "no-store",

          headers: {
            Accept:
              "application/json",
          },
        }
      );

    if (
      response.ok
    ) {
      const data =
        await response.json();

      const banner =
        extractBanner(
          data
        );

      const image =
        getBannerImage(
          banner
        );

      if (
        image
      ) {
        return {
          image,

          title:
            banner?.title ||
            "New Launch",
        };
      }
    }
  } catch (
    error
  ) {
    console.error(
      "[NEW LAUNCH BANNER ERROR]",
      error
    );
  }

  /*
   * No banner found:
   * fallback to New Launch category image.
   */

  return getNewLaunchCategoryImage();
}

/* =========================================================
   CATEGORY RESPONSE
========================================================= */

function extractCategory(
  data: any
): ApiCategory | null {
  if (
    !data
  ) {
    return null;
  }

  if (
    data.category &&
    typeof data.category ===
      "object"
  ) {
    return data.category;
  }

  if (
    data.data?.category &&
    typeof data.data
      .category ===
      "object"
  ) {
    return data.data.category;
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
    typeof data ===
      "object"
  ) {
    return data;
  }

  return null;
}

/* =========================================================
   CATEGORY IMAGE
========================================================= */

function getCategoryImage(
  category:
    ApiCategory | null
): string {
  if (
    !category
  ) {
    return "";
  }

  const lists = [
    category.images,

    category.categoryImages,
  ];

  for (
    const list of lists
  ) {
    if (
      !Array.isArray(
        list
      )
    ) {
      continue;
    }

    const defaultItem =
      list.find(
        (
          item
        ) =>
          typeof item !==
            "string" &&
          item?.isDefault ===
            true &&
          item?.isActive !==
            false
      );

    const defaultUrl =
      getMediaUrl(
        defaultItem
      );

    if (
      defaultUrl
    ) {
      return defaultUrl;
    }

    for (
      const item of list
    ) {
      const url =
        getMediaUrl(
          item
        );

      if (
        url
      ) {
        return url;
      }
    }
  }

  return (
    getMediaUrl(
      category.desktopImage
    ) ||
    getMediaUrl(
      category.bannerImage
    ) ||
    getMediaUrl(
      category.image
    ) ||
    getMediaUrl(
      category.thumbnail
    ) ||
    ""
  );
}

/* =========================================================
   FALLBACK CATEGORY

   GET /api/categories/slug/new-launch
========================================================= */

async function getNewLaunchCategoryImage(): Promise<{
  image: string;

  title: string;
}> {
  try {
    const response =
      await fetch(
        `${API_URL}/api/categories/slug/new-launch`,
        {
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
      return {
        image: "",

        title:
          "New Launch",
      };
    }

    const data =
      await response.json();

    const category =
      extractCategory(
        data
      );

    return {
      image:
        getCategoryImage(
          category
        ),

      title:
        category?.name ||
        "New Launch",
    };
  } catch (
    error
  ) {
    console.error(
      "[NEW LAUNCH CATEGORY ERROR]",
      error
    );

    return {
      image: "",

      title:
        "New Launch",
    };
  }
}

/* =========================================================
   PAGE
========================================================= */

export default async function NewLaunchPage() {
  const [
    apiProducts,
    banner,
  ] =
    await Promise.all([
      getNewLaunchProducts(),

      getNewLaunchBanner(),
    ]);

  /* =======================================================
     MAP
  ======================================================= */

  const products =
    apiProducts
      .map(
        mapProduct
      )
      .filter(
        (
          item
        ): item is NewLaunchProduct =>
          Boolean(
            item
          )
      );

  /* =======================================================
     DEBUG
  ======================================================= */

  console.log(
    "[NEW LAUNCH FINAL]",
    {
      apiProducts:
        apiProducts.length,

      mapped:
        products.length,

      men:
        products.filter(
          (
            product
          ) =>
            product.gender ===
            "men"
        ).length,

      women:
        products.filter(
          (
            product
          ) =>
            product.gender ===
            "women"
        ).length,

      banner:
        banner.image,
    }
  );

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <Header />

      <NewLaunchCatalog
        products={
          products
        }

        bannerUrl={
          banner.image
        }

        categoryName={
          banner.title ||
          "New Launch"
        }
      />
    </>
  );
}