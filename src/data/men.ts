/* =========================================================
   MEN PRODUCT TYPE
========================================================= */

export type MenProduct = {
  id: string;

  name: string;
  slug: string;

  image1: string;
  image2: string;

  actualPrice: number;
  discountedPrice: number;

  category: string;
  subcategories: string[];

  onOffer: boolean;

  isFeatured?: boolean;
  isNewLaunch?: boolean;
};

/* =========================================================
   MEN BANNER TYPE

   IMPORTANT:
   Banner ab static men.ts se nahi aayega.

   Banner Category API se:
   src/services/categoryBanners.ts

   ke through load hoga.

   Type yahan isliye rakha hai kyunki
   MenCatalog ise use karta hai.
========================================================= */

export type MenBanner = {
  id?: string;

  title?: string;
  subtitle?: string;

  image: string;

  alt?: string;

  redirect?: string;
  href?: string;

  buttonText?: string;
};

/* =========================================================
   MENU TYPES
========================================================= */

export type MenMenuChild = {
  name: string;
  slug: string;
  href: string;
};

export type MenMenuItem = {
  name: string;
  slug: string;
  href: string;

  children: MenMenuChild[];
};

/* =========================================================
   MEN MENU
========================================================= */

export const menMenu: MenMenuItem[] = [
  {
    name: "Underwear",
    slug: "underwear",
    href: "/men/underwear",

    children: [
      {
        name: "Trunks",
        slug: "trunks",
        href: "/men/underwear/trunks",
      },

      {
        name: "Briefs",
        slug: "briefs",
        href: "/men/underwear/briefs",
      },

      {
        name: "Men Thongs",
        slug: "men-thongs",
        href: "/men/underwear/men-thongs",
      },

      {
        name: "G-Strings",
        slug: "g-strings",
        href: "/men/underwear/g-strings",
      },
    ],
  },

  {
    name: "Trunks",
    slug: "trunks",
    href: "/men/trunks",

    children: [],
  },

  {
    name: "Briefs",
    slug: "briefs",
    href: "/men/briefs",

    children: [],
  },

  {
    name: "Men Thongs",
    slug: "men-thongs",
    href: "/men/men-thongs",

    children: [],
  },

  {
    name: "G-Strings",
    slug: "g-strings",
    href: "/men/g-strings",

    children: [],
  },

  {
    name: "Men Offers",
    slug: "offers",
    href: "/men/offers",

    children: [],
  },
];

/* =========================================================
   GET MENU ITEM
========================================================= */

export function getMenMenuItem(
  category?: string
): MenMenuItem | undefined {
  if (!category) {
    return undefined;
  }

  const normalizedCategory =
    String(category)
      .trim()
      .toLowerCase();

  return menMenu.find(
    (item) =>
      item.slug.toLowerCase() ===
      normalizedCategory
  );
}

/* =========================================================
   TITLE CASE
========================================================= */

function titleCase(
  value?: string
): string {
  if (!value) {
    return "";
  }

  return String(value)
    .trim()
    .split("-")
    .filter(Boolean)
    .map(
      (word) =>
        word
          .charAt(0)
          .toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

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
   PATH VALIDATION

   IMPORTANT:

   Backend se future me new category aa sakti hai.

   Isliye static menMenu ke basis par route
   ko reject nahi karenge.

   Sirf unsafe / invalid slug reject karenge.
========================================================= */

export function isValidMenPath(
  category?: string,
  subcategory?: string
): boolean {
  const validSlug =
    /^[a-z0-9-]+$/;

  if (category) {
    const normalizedCategory =
      normalizeSlug(
        category
      );

    if (
      !normalizedCategory ||
      !validSlug.test(
        normalizedCategory
      )
    ) {
      return false;
    }
  }

  if (subcategory) {
    const normalizedSubcategory =
      normalizeSlug(
        subcategory
      );

    if (
      !normalizedSubcategory ||
      !validSlug.test(
        normalizedSubcategory
      )
    ) {
      return false;
    }
  }

  /*
   * Offers nested page nahi hona chahiye.
   *
   * /men/offers
   * valid
   *
   * /men/offers/anything
   * invalid
   */

  if (
    normalizeSlug(
      category
    ) === "offers" &&
    subcategory
  ) {
    return false;
  }

  return true;
}

/* =========================================================
   PAGE TITLE
========================================================= */

export function getMenPageTitle(
  category?: string,
  subcategory?: string
): string {
  /*
   * Deepest selected category title.
   */

  if (subcategory) {
    return titleCase(
      subcategory
    );
  }

  /*
   * Offers.
   */

  if (
    normalizeSlug(
      category
    ) === "offers"
  ) {
    return "Men's Offers";
  }

  /*
   * Single category.
   */

  if (category) {
    const menuItem =
      getMenMenuItem(
        category
      );

    const categoryName =
      menuItem?.name ||
      titleCase(
        category
      );

    return `Men's ${categoryName}`;
  }

  /*
   * Root /men
   */

  return "Men's Collection";
}

/* =========================================================
   PAGE DESCRIPTION
========================================================= */

export function getMenPageDescription(
  category?: string,
  subcategory?: string
): string {
  /*
   * Deep category.
   *
   * Example:
   * /men/underwear/trunks
   */

  if (subcategory) {
    const name =
      titleCase(
        subcategory
      );

    return `Explore our latest men's ${name.toLowerCase()} collection.`;
  }

  /*
   * Offers.
   */

  if (
    normalizeSlug(
      category
    ) === "offers"
  ) {
    return "Explore special offers and discounted styles from our men's collection.";
  }

  /*
   * Category.
   *
   * Example:
   * /men/trunks
   */

  if (category) {
    const menuItem =
      getMenMenuItem(
        category
      );

    const categoryName =
      menuItem?.name ||
      titleCase(
        category
      );

    return `Discover our latest men's ${categoryName.toLowerCase()} collection.`;
  }

  /*
   * Root /men
   */

  return "Explore our latest men's collection, styles and everyday essentials.";
}

/* =========================================================
   IMPORTANT

   OLD CODE REMOVED:

   export function getMenBanners(...) {
     return [];
   }

   Ab banner yahan se nahi aayega.

   Men Page me:

   await getCategoryBanners({
     rootCategory: "men",
     path: route,
   });

   use hoga.

   RESULT:

   /men
   -> Men category ka banner

   /men/trunks
   -> Trunks category ka banner

   /men/briefs
   -> Briefs category ka banner

   /men/underwear/trunks
   -> Trunks category ka banner

   Agar exact selected category ke paas image/banner
   nahi hai:
   -> [] aayega
   -> koi banner nahi show hoga.

   Parent category ka banner fallback nahi hoga.
========================================================= */