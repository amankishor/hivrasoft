/* =========================================================
   WOMEN PRODUCT TYPE
========================================================= */

export type WomenProduct = {
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
   WOMEN BANNER TYPE

   Filhaal type rehne do because WomenCatalog
   isko use karta hai.

   Banner API next step me connect karenge.
========================================================= */

export type WomenBanner = {
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

export type WomenMenuChild = {
  name: string;
  slug: string;
  href: string;
};

export type WomenMenuItem = {
  name: string;
  slug: string;
  href: string;

  children: WomenMenuChild[];
};

/* =========================================================
   WOMEN MENU
========================================================= */

export const womenMenu: WomenMenuItem[] = [
  {
    name: "Women Offers",
    slug: "offers",
    href: "/women/offers",

    children: [],
  },

  {
    name: "Bra",
    slug: "bra",
    href: "/women/bra",

    children: [
      {
        name: "Sports Bra",
        slug: "sports-bra",
        href: "/women/bra/sports-bra",
      },

      {
        name: "Maternity Bra",
        slug: "maternity-bra",
        href: "/women/bra/maternity-bra",
      },

      {
        name: "T-Shirt Bra",
        slug: "t-shirt-bra",
        href: "/women/bra/t-shirt-bra",
      },

      {
        name: "Padded Bra",
        slug: "padded-bra",
        href: "/women/bra/padded-bra",
      },

      {
        name: "Non Padded Bra",
        slug: "non-padded-bra",
        href: "/women/bra/non-padded-bra",
      },
    ],
  },

  {
    name: "Panty",
    slug: "panty",
    href: "/women/panty",

    children: [
      {
        name: "Seamless Panty",
        slug: "seamless-panty",
        href: "/women/panty/seamless-panty",
      },

      {
        name: "Hipster",
        slug: "hipster",
        href: "/women/panty/hipster",
      },

      {
        name: "Thongs",
        slug: "thongs",
        href: "/women/panty/thongs",
      },

      {
        name: "G-String",
        slug: "g-string",
        href: "/women/panty/g-string",
      },
    ],
  },

  {
    name: "Lingerie",
    slug: "lingerie",
    href: "/women/lingerie",

    children: [],
  },

  {
    name: "Shop By Body Shape",
    slug: "shop-by-body-shape",
    href: "/women/shop-by-body-shape",

    children: [],
  },
];

/* =========================================================
   GET MENU ITEM
========================================================= */

export function getWomenMenuItem(
  category?: string
): WomenMenuItem | undefined {
  if (!category) {
    return undefined;
  }

  const slug =
    normalizeWomenSlug(
      category
    );

  return womenMenu.find(
    (item) =>
      item.slug === slug
  );
}

/* =========================================================
   NORMALIZE
========================================================= */

export function normalizeWomenSlug(
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
   TITLE CASE
========================================================= */

export function womenTitleCase(
  value?: string
): string {
  if (!value) {
    return "";
  }

  return String(value)
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
   VALID PATH
========================================================= */

export function isValidWomenPath(
  route: string[]
): boolean {
  if (
    !Array.isArray(route)
  ) {
    return false;
  }

  const validSlug =
    /^[a-z0-9-]+$/;

  return route.every(
    (value) => {
      const slug =
        normalizeWomenSlug(
          value
        );

      return Boolean(
        slug &&
          validSlug.test(
            slug
          )
      );
    }
  );
}

/* =========================================================
   PAGE TITLE
========================================================= */

export function getWomenPageTitle(
  route: string[]
): string {
  const cleanRoute =
    Array.isArray(route)
      ? route
          .map(
            normalizeWomenSlug
          )
          .filter(Boolean)
      : [];

  if (
    cleanRoute.length === 0
  ) {
    return "Women's Collection";
  }

  const selectedSlug =
    cleanRoute[
      cleanRoute.length - 1
    ];

  if (
    selectedSlug ===
    "offers"
  ) {
    return "Women's Offers";
  }

  return `Women's ${womenTitleCase(
    selectedSlug
  )}`;
}

/* =========================================================
   PAGE DESCRIPTION
========================================================= */

export function getWomenPageDescription(
  route: string[]
): string {
  const cleanRoute =
    Array.isArray(route)
      ? route
          .map(
            normalizeWomenSlug
          )
          .filter(Boolean)
      : [];

  if (
    cleanRoute.length === 0
  ) {
    return "Explore our latest women's collection, styles and everyday essentials.";
  }

  const selectedSlug =
    cleanRoute[
      cleanRoute.length - 1
    ];

  if (
    selectedSlug ===
    "offers"
  ) {
    return "Explore special offers and discounted styles from our women's collection.";
  }

  return `Explore our latest women's ${womenTitleCase(
    selectedSlug
  ).toLowerCase()} collection.`;
}

/* =========================================================
   IMPORTANT

   Products ab static nahi hain.

   OLD:
   womenProducts = [...]

   REMOVE.

   Products now come from:
   GET /api/products/active

   Women page API products ko filter karega.

   Banners next step me Category API se aayenge.
========================================================= */