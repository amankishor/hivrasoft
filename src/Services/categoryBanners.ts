/* =========================================================
   CATEGORY BANNERS SERVICE

   Banner source:
   Category API -> category image/images

   RULE:
   Exact selected category ka banner hi show hoga.

   /men
   -> Men banner

   /men/trunks
   -> Trunks banner

   /men/underwear/trunks
   -> Trunks banner

   Agar selected category me image nahi hai
   -> [] return hoga
   -> banner show nahi hoga
========================================================= */

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
   PUBLIC BANNER TYPE
========================================================= */

export type StoreBanner = {
  id: string;

  title?: string;
  subtitle?: string;

  image: string;

  alt?: string;

  redirect?: string;
  href?: string;

  buttonText?: string;
};

/* =========================================================
   CATEGORY IMAGE
========================================================= */

type CategoryImage = {
  _id?: string;
  id?: string;

  url?: string;
  secureUrl?: string;
  src?: string;

  publicId?: string;
  alt?: string;

  isActive?: boolean;
  isDefault?: boolean;
};

/* =========================================================
   CATEGORY
========================================================= */

type ApiCategory = {
  _id?: string;
  id?: string;

  name?: string;
  slug?: string;

  description?: string;

  parent?:
    | string
    | ApiCategory
    | null;

  ancestors?: unknown[];

  level?: number;

  /*
   * Backend agar multiple images bhejta hai.
   */
  images?: CategoryImage[];

  /*
   * Backend agar single image bhejta hai.
   */
  image?:
    | CategoryImage
    | string
    | null;

  isActive?: boolean;

  sortOrder?: number;
};

/* =========================================================
   NORMALIZE SLUG
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
   SLUG ALIASES
========================================================= */

const CATEGORY_ALIASES: Record<
  string,
  string[]
> = {
  briefs: [
    "briefs",
    "brief",
  ],

  brief: [
    "brief",
    "briefs",
  ],

  trunks: [
    "trunks",
    "trunk",
  ],

  trunk: [
    "trunk",
    "trunks",
  ],

  "men-thongs": [
    "men-thongs",
    "men-thong",
    "thongs",
    "thong",
  ],

  "men-thong": [
    "men-thong",
    "men-thongs",
    "thong",
    "thongs",
  ],

  thongs: [
    "thongs",
    "thong",
    "men-thongs",
    "men-thong",
  ],

  thong: [
    "thong",
    "thongs",
    "men-thong",
    "men-thongs",
  ],

  "g-strings": [
    "g-strings",
    "g-string",
  ],

  "g-string": [
    "g-string",
    "g-strings",
  ],

  bras: [
    "bras",
    "bra",
  ],

  bra: [
    "bra",
    "bras",
  ],

  panties: [
    "panties",
    "panty",
  ],

  panty: [
    "panty",
    "panties",
  ],

  "sports-bras": [
    "sports-bras",
    "sports-bra",
  ],

  "sports-bra": [
    "sports-bra",
    "sports-bras",
  ],
};

/* =========================================================
   SLUG CANDIDATES
========================================================= */

function getSlugCandidates(
  value?: string
): string[] {
  const normalized =
    normalizeSlug(
      value
    );

  if (!normalized) {
    return [];
  }

  return Array.from(
    new Set([
      normalized,

      ...(
        CATEGORY_ALIASES[
          normalized
        ] || []
      ),
    ])
  );
}

/* =========================================================
   READ JSON
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
   EXTRACT CATEGORY
========================================================= */

function extractCategory(
  data: any
): ApiCategory | null {
  if (!data) {
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
    typeof data.data.category ===
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
      "object" &&
    (
      data._id ||
      data.id ||
      data.slug
    )
  ) {
    return data;
  }

  return null;
}

/* =========================================================
   IMAGE URL
========================================================= */

function getImageUrl(
  image?: CategoryImage | null
): string {
  if (!image) {
    return "";
  }

  return String(
    image.url ||
      image.secureUrl ||
      image.src ||
      ""
  ).trim();
}

/* =========================================================
   GET CATEGORY BY SLUG

   API:
   GET /api/categories/slug/:slug
========================================================= */

async function getCategoryBySlug(
  requestedSlug: string
): Promise<ApiCategory | null> {
  const candidates =
    getSlugCandidates(
      requestedSlug
    );

  for (
    const slug of candidates
  ) {
    try {
      const response =
        await fetch(
          `${API_URL}/api/categories/slug/${encodeURIComponent(
            slug
          )}`,
          {
            method: "GET",

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

      const category =
        extractCategory(
          data
        );

      if (!category) {
        continue;
      }

      if (
        category.isActive ===
        false
      ) {
        return null;
      }

      return category;
    } catch (
      error
    ) {
      console.error(
        `[CATEGORY BANNER] ${slug}`,
        error
      );
    }
  }

  return null;
}

/* =========================================================
   CATEGORY IMAGES

   Multiple + single image dono support.
========================================================= */

function getCategoryImages(
  category: ApiCategory
): CategoryImage[] {
  const result: CategoryImage[] =
    [];

  /*
   * Multiple images
   */
  if (
    Array.isArray(
      category.images
    )
  ) {
    for (
      const image of
        category.images
    ) {
      if (
        image &&
        image.isActive !==
          false &&
        getImageUrl(image)
      ) {
        result.push(
          image
        );
      }
    }
  }

  /*
   * Single image object
   */
  if (
    category.image &&
    typeof category.image ===
      "object"
  ) {
    if (
      category.image
        .isActive !== false &&
      getImageUrl(
        category.image
      )
    ) {
      result.push(
        category.image
      );
    }
  }

  /*
   * Single image string
   */
  if (
    typeof category.image ===
      "string" &&
    category.image.trim()
  ) {
    result.push({
      url:
        category.image.trim(),
    });
  }

  /*
   * Duplicate remove
   */
  const seen =
    new Set<string>();

  return result.filter(
    (image) => {
      const url =
        getImageUrl(
          image
        );

      if (
        !url ||
        seen.has(url)
      ) {
        return false;
      }

      seen.add(url);

      return true;
    }
  );
}

/* =========================================================
   CATEGORY -> BANNERS
========================================================= */

function categoryToBanners(
  category: ApiCategory
): StoreBanner[] {
  const images =
    getCategoryImages(
      category
    );

  if (
    images.length === 0
  ) {
    return [];
  }

  const categoryId =
    String(
      category._id ||
        category.id ||
        category.slug ||
        category.name ||
        "category"
    );

  return images.map(
    (
      image,
      index
    ) => {
      const url =
        getImageUrl(
          image
        );

      return {
        id:
          `${categoryId}-${index}`,

        title:
          category.name ||
          "",

        subtitle:
          category.description ||
          "",

        image:
          url,

        alt:
          image.alt ||
          category.name ||
          "Category Banner",

        /*
         * Banner click फिलहाल kuch nahi karega.
         */
        href:
          "",

        redirect:
          "",

        buttonText:
          "",
      };
    }
  );
}

/* =========================================================
   EXACT CATEGORY BANNERS
========================================================= */

async function getExactCategoryBanners(
  slug: string
): Promise<StoreBanner[]> {
  const category =
    await getCategoryBySlug(
      slug
    );

  if (!category) {
    return [];
  }

  return categoryToBanners(
    category
  );
}

/* =========================================================
   PUBLIC FUNCTION

   IMPORTANT:

   /men
   path []
   => men

   /men/trunks
   path ["trunks"]
   => trunks

   /men/underwear/trunks
   path ["underwear", "trunks"]
   => trunks

   Deepest selected category hi use hogi.

   Parent fallback NAHI hai.
========================================================= */

export async function getCategoryBanners({
  rootCategory,
  path = [],
}: {
  rootCategory: string;
  path?: string[];
}): Promise<StoreBanner[]> {
  const cleanPath =
    path
      .map(
        normalizeSlug
      )
      .filter(
        Boolean
      );

  const selectedSlug =
    cleanPath.length > 0
      ? cleanPath[
          cleanPath.length -
            1
        ]
      : normalizeSlug(
          rootCategory
        );

  if (!selectedSlug) {
    return [];
  }

  return getExactCategoryBanners(
    selectedSlug
  );
}